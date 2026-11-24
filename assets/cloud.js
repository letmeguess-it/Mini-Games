/* ===== Let Me Guess — Google sign-in + sync =====
 * No server of our own. The player signs in with Google, and their progress is kept in a
 * hidden "app data" file in THEIR Google Drive (scope drive.appdata: this app can only see
 * its own file, nothing else in their Drive). Each device merges with that file, so history,
 * streaks, paused games and "questions already seen" follow the player everywhere.
 */
(function () {
  "use strict";
  const CFG = window.LMG_CONFIG || {};
  const SCOPE = "https://www.googleapis.com/auth/drive.appdata openid email profile";
  const FILE = "let-me-guess-progress.json";
  const P = MG.PREFIX;
  const listeners = new Set();
  const state = {
    configured: !!CFG.googleClientId,
    user: MG.read("account:user", null),           // { id, name, email, photo }
    token: null, syncing: false, error: null,
    lastSync: MG.read("account:lastSync", 0),
  };
  try { const t = JSON.parse(sessionStorage.getItem("lmg:token") || "null"); if (t && t.exp > Date.now() && state.user) state.token = t.v; } catch {}
  const emit = () => listeners.forEach((f) => { try { f(state); } catch (e) { console.error(e); } });
  const setToken = (v, sec) => { state.token = v; try { v ? sessionStorage.setItem("lmg:token", JSON.stringify({ v, exp: Date.now() + (sec - 60) * 1000 })) : sessionStorage.removeItem("lmg:token"); } catch {} };

  // ---------- Local data: everything under our prefix except account details ----------
  function localKeys() {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(P) && !k.startsWith(P + "account:")) out.push(k.slice(P.length)); } } catch {}
    return out;
  }
  const hasLocalProgress = () => localKeys().some((k) => k.startsWith("game:") && MG.read(k, { plays: [] }).plays.length);
  function exportAll() {
    const keys = {};
    localKeys().filter((k) => /^(game|seen|run):/.test(k)).forEach((k) => (keys[k] = MG.read(k, null)));
    return { app: "let-me-guess", v: 1, savedAt: Date.now(), keys };
  }
  // Merge a remote snapshot into this browser. Union of plays and seen questions;
  // for paused games keep whichever was played more recently.
  function importMerge(remote) {
    if (!remote || remote.app !== "let-me-guess" || !remote.keys) return false;
    let changed = false;
    for (const [k, rv] of Object.entries(remote.keys)) {
      if (rv == null) continue;
      const lv = MG.read(k, null);
      if (k.startsWith("game:")) {
        const plays = (lv && lv.plays) || [], ids = new Set(plays.map((p) => p.id));
        const dailyDays = new Set(plays.filter((p) => p.mode === "daily").map((p) => p.day));
        let add = 0;
        for (const p of rv.plays || []) {
          if (!p || ids.has(p.id) || typeof p.score !== "number") continue;
          if (p.mode === "daily" && dailyDays.has(p.day)) continue;      // one daily per day per game
          plays.push(p); ids.add(p.id); if (p.mode === "daily") dailyDays.add(p.day); add++;
        }
        if (add) { plays.sort((a, b) => a.t - b.t); MG.write(k, { plays }); changed = true; }
      } else if (k.startsWith("seen:")) {
        const arr = Array.isArray(lv) ? lv : [], s = new Set(arr); let add = 0;
        for (const id of rv) if (!s.has(id)) { s.add(id); arr.push(id); add++; }
        if (add) { MG.write(k, arr); changed = true; }
      } else if (k.startsWith("run:")) {
        if (!lv || (rv.saved || 0) > (lv.saved || 0)) { MG.write(k, rv); changed = true; }
      }
    }
    // A paused daily for a day that is already finished (on any device) is stale: drop it.
    localKeys().filter((k) => k.startsWith("run:") && k.includes(":daily:")).forEach((k) => {
      const [, slug, , day] = k.split(":");
      if (MG.dailyOn(slug, day)) { MG.remove(k); changed = true; }
    });
    return changed;
  }

  // ---------- Google Identity Services ----------
  let gisReady = null, tokenClient = null;
  function loadGis() {
    if (gisReady) return gisReady;
    gisReady = new Promise((res, rej) => {
      if (window.google?.accounts?.oauth2) return res();
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client"; s.async = true;
      s.onload = () => res(); s.onerror = () => { gisReady = null; rej(new Error("Couldn't reach Google. Check your connection and try again.")); };
      document.head.append(s);
    });
    return gisReady;
  }
  async function requestToken(prompt) {
    await loadGis();
    return new Promise((res, rej) => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CFG.googleClientId, scope: SCOPE,
        callback: (r) => (r && r.access_token ? res(r) : rej(new Error(r?.error_description || r?.error || "Sign-in was cancelled."))),
        error_callback: (e) => rej(new Error(e?.type === "popup_closed" ? "Sign-in window was closed." : e?.message || "Sign-in failed.")),
      });
      tokenClient.requestAccessToken({ prompt, login_hint: state.user?.email || undefined });
    });
  }

  // ---------- Drive app-data file ----------
  async function api(path, opts = {}) {
    const r = await fetch("https://www.googleapis.com" + path, { ...opts, headers: { Authorization: "Bearer " + state.token, ...(opts.headers || {}) } });
    if (r.status === 401) { setToken(null); throw Object.assign(new Error("Your Google session expired. Tap Reconnect to sync."), { expired: true }); }
    if (!r.ok) throw new Error(`Google Drive returned an error (${r.status}).`);
    return r;
  }
  async function findFile() {
    const q = encodeURIComponent(`name='${FILE}'`);
    const j = await api(`/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&pageSize=10`).then((r) => r.json());
    return j.files && j.files[0] ? j.files[0].id : null;
  }
  async function download(id) { return api(`/drive/v3/files/${id}?alt=media`).then((r) => r.json()).catch(() => null); }
  async function upload(id, data) {
    const body = JSON.stringify(data);
    if (id) return api(`/upload/drive/v3/files/${id}?uploadType=media`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body });
    const b = "lmg" + Math.random().toString(36).slice(2);
    const meta = JSON.stringify({ name: FILE, parents: ["appDataFolder"], mimeType: "application/json" });
    return api(`/upload/drive/v3/files?uploadType=multipart`, { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${b}` },
      body: `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--` });
  }

  let syncQueued = false;
  async function sync() {
    if (!state.user || !state.token) return;
    if (state.syncing) { syncQueued = true; return; }
    state.syncing = true; state.error = null; emit();
    let changed = false;
    try {
      const id = await findFile();
      if (id) changed = importMerge(await download(id));
      await upload(id, exportAll());
      state.lastSync = Date.now(); MG.write("account:lastSync", state.lastSync);
    } catch (e) { state.error = e.message; }
    state.syncing = false; emit();
    if (changed) document.dispatchEvent(new CustomEvent("lmg:data-changed"));
    if (syncQueued) { syncQueued = false; sync(); }
  }
  let timer = null;
  const scheduleSync = () => { if (!state.token) return; clearTimeout(timer); timer = setTimeout(sync, 2500); };

  // ---------- Sign in / out ----------
  function choose(title, text, options) {
    return new Promise((resolve) => {
      const back = MG.h("div", { class: "modal-back" });
      const box = MG.h("div", { class: "card modal", role: "dialog", "aria-label": title }, MG.h("h2", {}, title), MG.h("p", { class: "muted" }, text),
        MG.h("div", { class: "acct-choices" }, ...options.map((o) => MG.h("button", { class: `btn ${o.primary ? "primary" : ""}`, onclick: () => { back.remove(); resolve(o.value); } }, o.label))));
      back.append(box); document.body.append(back);
    });
  }
  async function signIn() {
    if (!state.configured) {
      MG.modal("Google sign-in isn't switched on yet", `<p>The site owner needs to add a Google client ID in <code>assets/config.js</code>. Until then, your progress is saved in this browser.</p>`);
      return;
    }
    state.error = null; emit();
    try {
      const tok = await requestToken(state.user ? "" : "select_account");
      setToken(tok.access_token, tok.expires_in || 3600);
      const me = await api("/oauth2/v3/userinfo").then((r) => r.json());
      const user = { id: me.sub, name: me.name || me.email, email: me.email, photo: me.picture || "" };
      const owner = MG.read("account:owner", null);
      if (owner && owner !== user.id && hasLocalProgress()) {
        const pick = await choose("This browser has someone else's progress",
          `It belongs to another Google account. What should happen to it now that ${user.email} is signing in?`,
          [{ label: `Start fresh with ${user.name.split(" ")[0]}'s progress`, value: "clear", primary: true }, { label: "Add it to this account", value: "merge" }, { label: "Cancel", value: "cancel" }]);
        if (pick === "cancel") { setToken(null); emit(); return; }
        if (pick === "clear") clearLocal();
      }
      state.user = user; MG.write("account:user", user); MG.write("account:owner", user.id);
      emit();
      await sync();
      MG.toast(`Signed in as ${user.name}`);
    } catch (e) { state.error = e.message; emit(); MG.toast(e.message); }
  }
  function clearLocal() {
    localKeys().forEach((k) => MG.remove(k));
    MG.remove("account:lastSync");
    document.dispatchEvent(new CustomEvent("lmg:data-changed"));
  }
  async function signOut() {
    const pick = await choose("Sign out?", "Your progress stays safe in your Google account. Do you also want to remove it from this browser (for example, on a shared computer)?",
      [{ label: "Sign out, keep it here", value: "keep", primary: true }, { label: "Sign out and remove it here", value: "clear" }, { label: "Cancel", value: "cancel" }]);
    if (pick === "cancel") return;
    if (state.token && window.google?.accounts?.oauth2) try { google.accounts.oauth2.revoke(state.token, () => {}); } catch {}
    setToken(null); state.user = null; state.error = null;
    MG.remove("account:user");
    if (pick === "clear") { clearLocal(); MG.remove("account:owner"); }
    emit(); MG.toast("Signed out");
  }
  async function reconnect() {
    try { const tok = await requestToken(""); setToken(tok.access_token, tok.expires_in || 3600); await sync(); }
    catch (e) { state.error = e.message; emit(); }
  }

  // ---------- Account bar on the dashboard ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const G_LOGO = `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
  function render(el) {
    if (!el) return;
    const u = state.user;
    if (!u) {
      el.innerHTML = `<div class="acct card"><div class="acct-text"><b>Keep your progress everywhere</b><span>Sign in to save your streaks, scores and history to your Google account and pick up on any device.</span>
        <small class="acct-legal">By signing in you agree to the <a href="terms.html">Terms</a> and <a href="privacy.html">Privacy Policy</a>.</small></div>
        <button class="btn g-btn" data-act="in">${G_LOGO}<span>Sign in with Google</span></button></div>`;
    } else {
      const status = state.syncing ? "Syncing…" : state.error ? esc(state.error) : !state.token ? "Not syncing on this visit" : state.lastSync ? `Synced ${MG.ago(state.lastSync)}` : "Ready";
      const photo = /^https:\/\//.test(u.photo) ? `<img class="acct-ava" src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="acct-ava">${esc((u.name || "?")[0])}</span>`;
      el.innerHTML = `<div class="acct card signed">${photo}<div class="acct-text"><b>${esc(u.name)}</b><span><i class="dot ${state.syncing ? "busy" : state.error || !state.token ? "warn" : "ok"}"></i>${status}</span></div>
        ${state.token ? `<button class="btn sm" data-act="sync" ${state.syncing ? "disabled" : ""}>Sync now</button>` : `<button class="btn sm primary" data-act="reconnect">Reconnect</button>`}
        <button class="btn sm ghost" data-act="out">Sign out</button></div>`;
    }
    el.querySelector('[data-act="in"]')?.addEventListener("click", signIn);
    el.querySelector('[data-act="sync"]')?.addEventListener("click", sync);
    el.querySelector('[data-act="reconnect"]')?.addEventListener("click", reconnect);
    el.querySelector('[data-act="out"]')?.addEventListener("click", signOut);
  }

  // Sync as soon as the page opens (if this tab still has a valid Google session) and whenever progress changes.
  if (state.user && state.token) setTimeout(sync, 300);
  addEventListener("storage", (e) => { if (e.key && e.key.startsWith(P + "game:")) scheduleSync(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && state.token) sync(); });

  window.LMGCloud = { state, choose, signIn, signOut, sync, scheduleSync, reconnect, render, onChange: (f) => (listeners.add(f), () => listeners.delete(f)), exportAll, importMerge };
})();

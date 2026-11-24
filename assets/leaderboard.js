/* ===== Let Me Guess — global leaderboard =====
 * Opt-in. A signed-in player who joins publishes ONLY a display name and point totals to
 * Cloud Firestore (Firebase). Everyone can read the boards. Talks to Firebase over its REST
 * APIs, so there's no SDK to download.
 *
 * Points = daily-challenge scores played on their own day (calendar catch-ups don't count).
 *   Overall:   players/{uid}                 { name, total, games:{slug:points}, updated }
 *   This week: weeks/{monday}/players/{uid}  { name, total, games:{slug:points}, updated }
 */
(function () {
  "use strict";
  const FB = (window.LMG_CONFIG || {}).firebase || null;
  const configured = !!(FB && FB.apiKey && FB.projectId);
  const DOCS = configured ? `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents` : "";
  const TOP = 10;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const view = { scope: "overall", game: "all", rows: null, me: null, error: null, loading: false, editing: false, busy: false };
  let host = null, session = null; // Firebase session: { uid, idToken, exp }

  // ---------- Points from this browser's (synced) history ----------
  function weekStart(day = MG.dayKey()) {
    const [y, m, d] = day.split("-").map(Number), dt = new Date(y, m - 1, d);
    return MG.dayKey(new Date(y, m - 1, d - ((dt.getDay() + 6) % 7)));
  }
  function myTotals() {
    const today = MG.dayKey(), wk = weekStart(today);
    const all = { total: 0, games: {} }, week = { total: 0, games: {} }, weeks = new Set();
    MG.GAMES.forEach((g) => {
      let a = 0, w = 0;
      MG.gameData(g.slug).plays.forEach((p) => {
        if (p.mode !== "daily" || p.catchup) return;
        a += p.score; weeks.add(weekStart(p.day));
        if (p.day >= wk && p.day <= today) w += p.score;
      });
      all.games[g.slug] = a; all.total += a; week.games[g.slug] = w; week.total += w;
    });
    return { all, week, wk, weeks: [...weeks] };
  }

  // ---------- Membership (stored per Google account, not synced) ----------
  const member = () => { const m = MG.read("account:lb", null), u = LMGCloud.state.user; return m && u && m.user === u.id ? m : null; };
  const defaultName = () => { const n = (LMGCloud.state.user?.name || "Player").trim().split(/\s+/); return n.length > 1 ? `${n[0]} ${n[n.length - 1][0]}.` : n[0]; };
  const cleanName = (s) => String(s || "").replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);

  // ---------- Firebase Auth (exchange the Google token for a Firebase ID token) ----------
  async function fbSession() {
    if (session && session.exp > Date.now()) return session;
    const g = LMGCloud.state.token;
    if (!g) throw Object.assign(new Error("Reconnect your Google account to update the leaderboard."), { reconnect: true });
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FB.apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postBody: `access_token=${g}&providerId=google.com`, requestUri: location.origin, returnSecureToken: true, returnIdpCredential: true }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error("Couldn't connect to the leaderboard" + (j?.error?.message ? ` (${j.error.message})` : "."));
    session = { uid: j.localId, idToken: j.idToken, exp: Date.now() + (Number(j.expiresIn || 3600) - 120) * 1000 };
    return session;
  }

  // ---------- Firestore REST ----------
  const int = (n) => ({ integerValue: String(Math.max(0, Math.round(n || 0))) });
  const encode = (name, t) => ({ fields: { name: { stringValue: name }, total: int(t.total), updated: { timestampValue: new Date().toISOString() },
    games: { mapValue: { fields: Object.fromEntries(MG.GAMES.map((g) => [g.slug, int(t.games[g.slug])])) } } } });
  async function fs(path, opts = {}, auth = true) {
    const headers = { "Content-Type": "application/json" };
    if (auth) headers.Authorization = "Bearer " + (await fbSession()).idToken;
    const r = await fetch(`${DOCS}${path}${path.includes("?") ? "&" : "?"}key=${FB.apiKey}`, { ...opts, headers });
    if (!r.ok && r.status !== 404) { const j = await r.json().catch(() => ({})); throw new Error(j?.error?.message || `Leaderboard error (${r.status})`); }
    return r.status === 204 ? null : r.json().catch(() => null);
  }
  const parent = (scope) => (scope === "week" ? `/weeks/${weekStart()}` : "");
  const field = (game) => (game === "all" ? "total" : `games.${game}`);
  async function topList(scope, game) {
    const q = { structuredQuery: { from: [{ collectionId: "players" }], orderBy: [{ field: { fieldPath: field(game) }, direction: "DESCENDING" }],
      where: { fieldFilter: { field: { fieldPath: field(game) }, op: "GREATER_THAN", value: { integerValue: "0" } } }, limit: TOP } };
    const res = await fs(`${parent(scope)}:runQuery`, { method: "POST", body: JSON.stringify(q) }, false);
    return (res || []).filter((x) => x.document).map((x) => {
      const f = x.document.fields || {}, uid = x.document.name.split("/").pop();
      const pts = game === "all" ? f.total?.integerValue : f.games?.mapValue?.fields?.[game]?.integerValue;
      return { uid, name: f.name?.stringValue || "Player", pts: Number(pts || 0) };
    });
  }
  async function countAbove(scope, game, pts) {
    const q = { structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: "players" }],
      where: { fieldFilter: { field: { fieldPath: field(game) }, op: "GREATER_THAN", value: { integerValue: String(pts) } } } }, aggregations: [{ alias: "n", count: {} }] } };
    const res = await fs(`${parent(scope)}:runAggregationQuery`, { method: "POST", body: JSON.stringify(q) }, false);
    return Number(res?.[0]?.result?.aggregateFields?.n?.integerValue || 0);
  }

  // ---------- Publish / join / leave ----------
  async function publish() {
    const m = member(); if (!configured || !m) return;
    const s = await fbSession(), t = myTotals();
    await fs(`/players/${s.uid}`, { method: "PATCH", body: JSON.stringify(encode(m.name, t.all)) });
    await fs(`/weeks/${t.wk}/players/${s.uid}`, { method: "PATCH", body: JSON.stringify(encode(m.name, t.week)) });
    if (m.uid !== s.uid) MG.write("account:lb", { ...m, uid: s.uid });
  }
  let pubTimer = null;
  const schedulePublish = () => { if (!member() || !LMGCloud.state.token) return; clearTimeout(pubTimer); pubTimer = setTimeout(() => publish().then(load).catch((e) => { view.error = e.message; draw(); }), 1500); };

  async function join(name) {
    name = cleanName(name) || defaultName();
    view.busy = true; draw();
    try {
      MG.write("account:lb", { user: LMGCloud.state.user.id, name });
      await publish(); view.error = null; MG.toast("You're on the leaderboard");
    } catch (e) { MG.remove("account:lb"); view.error = e.reconnect ? e.message : e.message; }
    view.busy = false; view.editing = false; load();
  }
  async function rename(name) {
    const m = member(); name = cleanName(name); if (!m || !name) return;
    MG.write("account:lb", { ...m, name }); view.editing = false;
    try { await publish(); } catch (e) { view.error = e.message; }
    load();
  }
  async function leave() {
    const m = member(); if (!m) return;
    const ok = await LMGCloud.choose("Leave the leaderboard?", "Your name and points will be removed from every leaderboard. Your own progress and history stay as they are.",
      [{ label: "Leave the leaderboard", value: true, primary: true }, { label: "Cancel", value: false }]);
    if (!ok) return;
    view.busy = true; draw();
    try {
      const s = await fbSession(), t = myTotals();
      await fs(`/players/${s.uid}`, { method: "DELETE" });
      for (const wk of new Set([...t.weeks, t.wk])) await fs(`/weeks/${wk}/players/${s.uid}`, { method: "DELETE" });
      await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${FB.apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: s.idToken }) }).catch(() => {});
      session = null; MG.remove("account:lb"); MG.toast("You've left the leaderboard");
    } catch (e) { view.error = e.message; }
    view.busy = false; load();
  }

  // ---------- Load + draw ----------
  async function load() {
    if (!configured) return draw();
    view.loading = true; view.error = null; draw();
    const { scope, game } = view;
    try {
      const rows = await topList(scope, game);
      let me = null; const m = member();
      if (m) {
        const t = myTotals(), pts = game === "all" ? (scope === "week" ? t.week.total : t.all.total) : (scope === "week" ? t.week.games[game] : t.all.games[game]);
        const inTop = rows.findIndex((r) => r.uid === m.uid);
        me = { pts, rank: inTop >= 0 ? inTop + 1 : pts > 0 ? (await countAbove(scope, game, pts)) + 1 : null, inTop: inTop >= 0 };
      }
      if (scope === view.scope && game === view.game) { view.rows = rows; view.me = me; }
    } catch (e) { view.error = e.message; view.rows = view.rows || []; }
    view.loading = false; draw();
  }
  function draw() {
    if (!host || !host.isConnected) return;
    const m = configured && member(), signedIn = !!LMGCloud.state.user;
    const gameBtn = (slug, label, icon) => `<button class="lb-g ${view.game === slug ? "on" : ""}" data-game="${slug}" title="${label}" aria-label="${label}">${icon ? `<img src="${icon}" alt="" width="22" height="22">` : "All"}</button>`;
    let list;
    if (!configured) list = `<p class="lb-empty">The global leaderboard switches on once it's connected to Firebase.</p>`;
    else if (view.loading && !view.rows) list = `<p class="lb-empty">Loading…</p>`;
    else if (!view.rows || !view.rows.length) list = `<p class="lb-empty">${view.error ? esc(view.error) : `No scores yet${view.scope === "week" ? " this week" : ""}. Be the first.`}</p>`;
    else list = `<ol class="lb-list ${view.loading ? "dim" : ""}">${view.rows.map((r, i) => `<li class="${m && r.uid === m.uid ? "me" : ""}"><span class="lb-rank">${i + 1}</span>
      <span class="lb-name">${esc(r.name)}${m && r.uid === m.uid ? ` <em>you</em>` : ""}</span><span class="lb-pts">${r.pts.toLocaleString()}</span></li>`).join("")}</ol>`;
    let foot = "";
    if (configured) {
      if (!signedIn) foot = `<span>Sign in with Google to join the leaderboard.</span><button class="btn sm" data-act="signin">Sign in</button>`;
      else if (!m) foot = view.editing
        ? `<input class="lb-input" maxlength="24" value="${esc(defaultName())}" aria-label="Display name"><button class="btn sm primary" data-act="join" ${view.busy ? "disabled" : ""}>Join</button><button class="btn sm ghost" data-act="cancel">Cancel</button>
           <small class="lb-note">Your display name and point totals will be public. You can leave at any time.</small>`
        : `<span>You're not on the leaderboard yet.</span><button class="btn sm primary" data-act="start">Join</button>`;
      else if (view.editing) foot = `<input class="lb-input" maxlength="24" value="${esc(m.name)}" aria-label="Display name"><button class="btn sm primary" data-act="rename">Save</button><button class="btn sm ghost" data-act="cancel">Cancel</button>`;
      else {
        const me = view.me;
        foot = `<span><b>${esc(m.name)}</b> · ${me && me.rank ? `#${me.rank} with ${me.pts.toLocaleString()} pts` : "no points here yet"}</span>
          ${!LMGCloud.state.token ? `<button class="btn sm" data-act="reconnect">Reconnect</button>` : ""}
          <button class="lb-link" data-act="start">Rename</button><button class="lb-link" data-act="leave" ${view.busy ? "disabled" : ""}>Leave</button>`;
      }
    }
    host.innerHTML = `<div class="card lb">
      <div class="lb-top"><div class="seg lb-seg"><button data-scope="overall" class="${view.scope === "overall" ? "on" : ""}">Overall</button><button data-scope="week" class="${view.scope === "week" ? "on" : ""}">This week</button></div>
        <div class="lb-games">${gameBtn("all", "All games")}${MG.GAMES.map((g) => gameBtn(g.slug, g.name, `games/${g.slug}/icon.svg`)).join("")}</div></div>
      <div class="lb-sub">${view.game === "all" ? "All games" : MG.GAMES.find((g) => g.slug === view.game).name} · ${view.scope === "week" ? "since Monday" : "all time"} · daily-challenge points</div>
      ${list}
      ${foot ? `<div class="lb-foot">${foot}</div>` : ""}
    </div>`;
    host.querySelectorAll("[data-scope]").forEach((b) => b.addEventListener("click", () => { view.scope = b.dataset.scope; view.rows = null; load(); }));
    host.querySelectorAll("[data-game]").forEach((b) => b.addEventListener("click", () => { view.game = b.dataset.game; view.rows = null; load(); }));
    const input = host.querySelector(".lb-input");
    const act = (name, fn) => host.querySelector(`[data-act="${name}"]`)?.addEventListener("click", fn);
    act("signin", () => LMGCloud.signIn());
    act("reconnect", () => LMGCloud.reconnect().then(() => schedulePublish()));
    act("start", () => { view.editing = true; draw(); host.querySelector(".lb-input")?.select(); });
    act("cancel", () => { view.editing = false; draw(); });
    act("join", () => join(input.value));
    act("rename", () => rename(input.value));
    act("leave", leave);
    input?.addEventListener("keydown", (e) => { if (e.key === "Enter") (member() ? rename : join)(input.value); if (e.key === "Escape") { view.editing = false; draw(); } });
  }

  function render(el) { host = el; draw(); if (configured && !view.loading) load(); }

  // Publish after every sync (new scores, or scores arriving from another device).
  let lastSync = LMGCloud.state.lastSync;
  LMGCloud.onChange((st) => {
    if (!st.user) { session = null; }
    if (st.lastSync !== lastSync && !st.syncing) { lastSync = st.lastSync; schedulePublish(); }
    draw();
  });

  window.LMGBoard = { render, publish, myTotals, weekStart, configured };
})();

/* Mini Games — optional Google sign-in, Drive app-data sync, Firestore leaderboard.
 * No server of our own: the browser talks to Google directly. */
(function () {
  "use strict";
  const CFG = window.MG_CONFIG || {};
  const FB_VER = "10.12.2";
  const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
  const FILE = "minigames-stats.json";
  const listeners = new Set();
  const state = { mode: CFG.firebase ? "firebase" : CFG.googleClientId ? "gis" : "off", user: MG.read("cloud:user", null), token: null, syncing: false, lastSync: MG.read("cloud:lastSync", 0), error: null };
  try { const t = JSON.parse(sessionStorage.getItem("mg:token") || "null"); if (t && t.exp > Date.now()) state.token = t.v; } catch {}
  const emit = () => listeners.forEach((f) => f(state));
  let fb = null; // { auth, db, mods }

  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.async = true; s.onload = res; s.onerror = () => rej(new Error("Couldn't load " + src)); document.head.append(s); });
  }
  async function firebase() {
    if (fb) return fb;
    const base = `https://www.gstatic.com/firebasejs/${FB_VER}/`;
    const [app, auth, fs] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]);
    const a = app.initializeApp(CFG.firebase);
    fb = { auth: auth.getAuth(a), db: fs.getFirestore(a), A: auth, F: fs };
    return fb;
  }
  function setToken(v, sec = 3500) {
    state.token = v;
    try { sessionStorage.setItem("mg:token", JSON.stringify({ v, exp: Date.now() + sec * 1000 })); } catch {}
  }
  const shortName = (full = "") => { const p = full.trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0] || "Player"; };

  async function signIn() {
    state.error = null;
    try {
      if (state.mode === "firebase") {
        const { auth, A } = await firebase();
        const provider = new A.GoogleAuthProvider();
        provider.addScope(SCOPE);
        const res = await A.signInWithPopup(auth, provider);
        const cred = A.GoogleAuthProvider.credentialFromResult(res);
        if (cred?.accessToken) setToken(cred.accessToken);
        const u = res.user;
        state.user = { id: u.uid, name: shortName(u.displayName), email: u.email, photo: u.photoURL };
      } else if (state.mode === "gis") {
        await loadScript("https://accounts.google.com/gsi/client");
        const tok = await new Promise((res, rej) => {
          const client = google.accounts.oauth2.initTokenClient({
            client_id: CFG.googleClientId, scope: SCOPE + " openid email profile",
            callback: (r) => (r.error ? rej(new Error(r.error)) : res(r)), error_callback: (e) => rej(new Error(e.message || e.type)),
          });
          client.requestAccessToken({ prompt: state.user ? "" : "consent" });
        });
        setToken(tok.access_token, tok.expires_in - 60);
        const me = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: "Bearer " + state.token } }).then((r) => r.json());
        state.user = { id: me.sub, name: shortName(me.name), email: me.email, photo: me.picture };
      } else {
        throw new Error("Sign-in isn't set up yet. Add a Google client ID in assets/config.js (see README).");
      }
      MG.write("cloud:user", state.user);
      emit();
      await sync();
    } catch (e) {
      state.error = e.message || String(e); emit(); throw e;
    }
  }
  async function signOut() {
    if (state.mode === "firebase" && fb) await fb.A.signOut(fb.auth).catch(() => {});
    if (state.token && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(state.token, () => {});
    state.user = null; state.token = null;
    MG.write("cloud:user", null); sessionStorage.removeItem("mg:token");
    emit();
  }

  // ---- Google Drive appDataFolder ----
  async function drive(path, opts = {}) {
    const r = await fetch("https://www.googleapis.com" + path, { ...opts, headers: { Authorization: "Bearer " + state.token, ...(opts.headers || {}) } });
    if (r.status === 401) { setToken(null, 0); state.token = null; throw new Error("Google session expired. Sign in again to sync."); }
    if (!r.ok) throw new Error("Drive error " + r.status);
    return r;
  }
  async function syncDrive() {
    const q = encodeURIComponent(`name='${FILE}'`);
    const list = await drive(`/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`).then((r) => r.json());
    let id = list.files?.[0]?.id;
    if (id) {
      const remote = await drive(`/drive/v3/files/${id}?alt=media`).then((r) => r.json()).catch(() => null);
      MG.importMerge(remote);
    }
    const body = JSON.stringify(MG.exportAll());
    if (id) {
      await drive(`/upload/drive/v3/files/${id}?uploadType=media`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body });
    } else {
      const boundary = "mgb" + Math.random().toString(36).slice(2);
      const meta = JSON.stringify({ name: FILE, parents: ["appDataFolder"], mimeType: "application/json" });
      const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
      await drive(`/upload/drive/v3/files?uploadType=multipart`, { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body: multipart });
    }
  }

  // ---- Leaderboard (Firestore) ----
  function summary() {
    const today = MG.dayKey();
    let total = 0, todayPts = 0, todayGames = 0, dailyDays = new Set();
    const best = {};
    MG.GAMES.forEach((g) => {
      const s = MG.stats(g.slug);
      total += s.dailyTotal; best[g.slug] = s.best;
      s.all.forEach((p) => p.mode === "daily" && dailyDays.add(p.day));
      if (s.today) { todayPts += s.today.score; todayGames++; }
    });
    return { today, total, todayPts, todayGames, best, streak: MG.streakFrom([...dailyDays]).current };
  }
  async function pushScores() {
    if (state.mode !== "firebase" || !state.user) return;
    const { auth, db, F } = await firebase();
    if (!auth.currentUser) return;
    const s = summary(), uid = auth.currentUser.uid, who = { name: state.user.name, photo: state.user.photo || "" };
    await F.setDoc(F.doc(db, "players", uid), { ...who, total: s.total, streak: s.streak, best: s.best, updated: F.serverTimestamp() }, { merge: true });
    if (s.todayGames) await F.setDoc(F.doc(db, "daily", s.today, "players", uid), { ...who, points: s.todayPts, games: s.todayGames, updated: F.serverTimestamp() });
  }
  async function leaderboard(kind = "today") {
    if (state.mode !== "firebase") return null;
    const { db, F } = await firebase();
    const col = kind === "today" ? F.collection(db, "daily", MG.dayKey(), "players") : F.collection(db, "players");
    const snap = await F.getDocs(F.query(col, F.orderBy(kind === "today" ? "points" : "total", "desc"), F.limit(25)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async function sync() {
    if (!state.user || state.syncing) return;
    state.syncing = true; state.error = null; emit();
    try {
      if (state.token) await syncDrive();
      await pushScores();
      state.lastSync = Date.now(); MG.write("cloud:lastSync", state.lastSync);
    } catch (e) { state.error = e.message; }
    state.syncing = false; emit();
  }

  // Restore a Firebase session silently on reload.
  if (state.mode === "firebase" && state.user) firebase().then(({ auth, A }) => A.onAuthStateChanged(auth, (u) => { if (!u) { state.user = null; MG.write("cloud:user", null); } emit(); if (u) sync(); })).catch(() => {});

  window.MGCloud = { state, signIn, signOut, sync, leaderboard, summary, onChange: (f) => (listeners.add(f), () => listeners.delete(f)) };
})();

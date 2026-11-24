/* Mini Games — dashboard landing page. Reads every game's local history. */
(function () {
  "use strict";
  const { GAMES, stats, dayKey, addDays, dayNumber, h } = MG;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeImg = (u) => (/^https:\/\//.test(u || "") ? u : "");
  let lbKind = "today";
  // Inside a sandboxed preview frame new tabs are blocked, so open games in place there.
  let EMBEDDED = false; try { EMBEDDED = window.self !== window.top; } catch { EMBEDDED = true; }
  const openGame = (slug) => (EMBEDDED ? (location.href = `games/${slug}/index.html`) : window.open(`games/${slug}/index.html`, `mg-${slug}`));

  function greeting() {
    const hr = new Date().getHours();
    return hr < 5 ? "Up late?" : hr < 12 ? "Good morning." : hr < 17 ? "Good afternoon." : "Good evening.";
  }

  function render() {
    const today = dayKey();
    const all = GAMES.map((g) => ({ g, s: stats(g.slug) }));
    const done = all.filter((x) => x.s.today);
    const dailyDays = new Set(all.flatMap((x) => x.s.all.filter((p) => p.mode === "daily").map((p) => p.day)));
    const streak = MG.streakFrom([...dailyDays]).current;
    const played = all.filter((x) => x.s.plays);
    const rating = played.length ? Math.round(played.reduce((a, x) => a + x.s.rating, 0) / played.length) : null;

    document.getElementById("dayPill").textContent = `Day #${dayNumber()} · ${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`;
    if (played.length) document.getElementById("greet").innerHTML = `${greeting()}<br>${done.length === GAMES.length ? "All dailies done." : `${GAMES.length - done.length} dailies to go.`}`;
    document.getElementById("todayCount").textContent = `${done.length}/${GAMES.length}`;
    document.getElementById("progress").innerHTML = all.map((x) => `<i title="${x.g.name}${x.s.today ? ": " + x.s.today.score : ""}" style="${x.s.today ? `background:${x.g.color}` : ""}"></i>`).join("");
    document.getElementById("kStreak").textContent = streak;
    document.getElementById("kToday").textContent = done.reduce((a, x) => a + x.s.today.score, 0);
    document.getElementById("kRating").textContent = rating ?? "–";
    const next = all.find((x) => !x.s.today);
    const nb = document.getElementById("nextBtn");
    nb.textContent = next ? `Play next daily: ${next.g.name} →` : "Come back tomorrow ✓";
    nb.disabled = !next;
    nb.onclick = () => next && openGame(next.g.slug);

    // Game cards
    const grid = document.getElementById("games");
    grid.innerHTML = "";
    all.forEach(({ g, s }) => {
      grid.append(h("a", { class: "card gcard", href: `games/${g.slug}/index.html`, target: EMBEDDED ? null : `mg-${g.slug}`, style: `--gc:${g.color}` },
        h("div", { class: "top" }, h("div", { class: "mark" }, g.name[0]), h("div", {}, h("h3", {}, g.name), h("div", { class: "skill" }, g.skill))),
        h("p", {}, g.tagline),
        h("div", { class: "foot" },
          s.today ? h("span", { class: "pill done" }, `Daily ✓ ${s.today.score}`) : h("span", { class: "pill" }, "Daily ready"),
          h("span", { class: "faint" }, s.streak ? `${s.streak}-day streak` : s.plays ? `best ${s.best}` : "new"),
          h("span", { class: "go" }, "Play →"))));
    });

    // Skill profile
    const sk = document.getElementById("skills");
    const ranked = all.slice().sort((a, b) => b.s.rating - a.s.rating);
    sk.innerHTML = ranked.map(({ g, s }) => `<div class="skill-row" title="${g.name}: ${s.plays ? `${s.rating} avg over last ${Math.min(10, s.plays)} games` : "not played yet"}">
      <span>${g.name}</span><span class="track"><i style="width:${s.rating}%;background:${g.color}"></i></span>
      <span class="mono" style="text-align:right;font-weight:700">${s.plays ? s.rating : "–"}</span></div>`).join("");

    // Last 14 days
    const days = Array.from({ length: 14 }, (_, k) => addDays(today, k - 13));
    const pts = days.map((d) => all.reduce((a, x) => a + x.s.all.filter((p) => p.mode === "daily" && p.day === d).reduce((b, p) => b + p.score, 0), 0));
    const mx = Math.max(100, ...pts);
    document.getElementById("days").innerHTML = `<div class="cols">${days.map((d, k) => `<div class="c ${d === today ? "today" : ""}">
        <span class="tip">${d.slice(5)} · ${pts[k]} pts</span><i style="height:${Math.max(2, Math.round((pts[k] / mx) * 112))}px"></i></div>`).join("")}</div>
      <div class="cols-x">${days.map((d, k) => `<span>${k % 2 === 1 ? +d.slice(8) : ""}</span>`).join("")}</div>`;

    // Highlights
    const totalGames = all.reduce((a, x) => a + x.s.plays, 0);
    const fav = all.slice().sort((a, b) => b.s.plays - a.s.plays)[0];
    const strongest = ranked.find((x) => x.s.plays);
    const longest = Math.max(0, ...all.map((x) => x.s.bestStreak));
    document.getElementById("highlights").innerHTML = [
      [totalGames, "Games played"], [strongest ? strongest.g.name : "–", "Strongest game"],
      [fav && fav.s.plays ? fav.g.name : "–", "Most played"], [longest, "Longest game streak"],
    ].map(([v, l]) => `<div class="kpi"><b style="font-size:17px">${esc(v)}</b><span>${l}</span></div>`).join("");

    renderAccount();
  }

  // ---------- Account ----------
  function renderAccount() {
    const el = document.getElementById("account");
    const st = MGCloud.state;
    el.innerHTML = "";
    if (st.user) {
      const dot = h("span", { class: `sync-dot ${st.syncing ? "busy" : st.error ? "err" : ""}`, title: st.error || (st.lastSync ? "Synced " + new Date(st.lastSync).toLocaleTimeString() : "") });
      el.append(h("div", { class: "user" }, dot,
        safeImg(st.user.photo) ? h("img", { class: "avatar", src: st.user.photo, alt: "", referrerpolicy: "no-referrer" }) : h("span", { class: "avatar" }, st.user.name[0]),
        h("span", {}, st.user.name),
        !st.token && st.mode === "gis" ? h("button", { class: "btn sm", onclick: () => MGCloud.signIn().catch(() => {}) }, "Reconnect") : h("button", { class: "btn sm", onclick: () => MGCloud.sync() }, "Sync"),
        h("button", { class: "btn ghost sm", onclick: () => MGCloud.signOut() }, "Sign out")));
      document.getElementById("syncNote").textContent = st.error ? ` · ${st.error}` : " · backed up to your Google Drive";
    } else {
      el.append(h("button", { class: "btn g-btn", onclick: () => MGCloud.signIn().catch((e) => MG.toast(e.message.slice(0, 90))) },
        h("span", { html: `<svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>` }),
        "Sign in with Google"));
      document.getElementById("syncNote").textContent = "";
    }
  }

  // ---------- Leaderboard ----------
  async function renderLeaderboard() {
    const box = document.getElementById("lb");
    const st = MGCloud.state, me = MGCloud.summary();
    const myPts = lbKind === "today" ? me.todayPts : me.total;
    const row = (r, i, mine) => `<tr class="${mine ? "me" : ""}"><td class="rk">${i}</td><td><div class="who">${safeImg(r.photo) ? `<img class="avatar" src="${esc(r.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="avatar">${esc((r.name || "?")[0])}</span>`}${esc(r.name || "Player")}</div></td>
      <td class="faint mono">${lbKind === "today" ? `${r.games ?? "–"}/10` : `${r.streak ?? 0}d`}</td><td class="pts">${(lbKind === "today" ? r.points : r.total) ?? 0}</td></tr>`;
    const head = `<tr><th>#</th><th>Player</th><th>${lbKind === "today" ? "Games" : "Streak"}</th><th style="text-align:right">${lbKind === "today" ? "Points today" : "Total daily points"}</th></tr>`;
    const local = () => `<table>${head}${row({ name: st.user ? st.user.name : "You (this device)", photo: st.user?.photo, games: me.todayGames, points: me.todayPts, streak: me.streak, total: me.total }, 1, true)}</table>`;

    if (st.mode !== "firebase") {
      box.innerHTML = `${local()}<div class="empty" style="margin-top:14px">The global leaderboard switches on once the site owner adds a Firebase project in <code>assets/config.js</code>. Until then, here's how you rank against yourself.</div>`;
      return;
    }
    box.innerHTML = `<div class="empty">Loading rankings…</div>`;
    try {
      const rows = await MGCloud.leaderboard(lbKind);
      const uid = st.user?.id;
      let html = `<table>${head}${rows.map((r, i) => row(r, i + 1, r.id === uid)).join("")}`;
      if (!rows.length) html += `<tr><td colspan="4" class="faint" style="text-align:center;padding:24px">No scores yet${lbKind === "today" ? " today" : ""}. Be the first.</td></tr>`;
      html += `</table>`;
      if (!st.user) html += `<div class="empty" style="margin-top:14px">Sign in with Google to put your ${myPts} points on the board.</div>`;
      else if (uid && !rows.some((r) => r.id === uid) && myPts) html += `<p class="faint" style="font-size:13px">You have ${myPts} points but you're outside the top 25. Keep going.</p>`;
      box.innerHTML = html;
    } catch (e) {
      box.innerHTML = `${local()}<div class="empty" style="margin-top:14px">Couldn't reach the leaderboard (${esc(e.message)}).</div>`;
    }
  }

  document.getElementById("lbSeg").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    lbKind = b.dataset.k;
    document.querySelectorAll("#lbSeg button").forEach((x) => x.classList.toggle("on", x === b));
    renderLeaderboard();
  });

  // Live updates: games in other tabs write to localStorage → we re-render and sync.
  let syncTimer;
  addEventListener("storage", (e) => {
    if (!e.key || !e.key.startsWith(MG.PREFIX + "game:")) return;
    render(); renderLeaderboard();
    clearTimeout(syncTimer); syncTimer = setTimeout(() => MGCloud.sync().then(renderLeaderboard), 3000);
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { render(); renderLeaderboard(); } });
  let lastSyncState = 0;
  MGCloud.onChange((st) => { renderAccount(); if (!st.syncing && st.lastSync !== lastSyncState) { lastSyncState = st.lastSync; render(); renderLeaderboard(); } });

  if (EMBEDDED) document.getElementById("tabNote").textContent = "Preview mode: games open in this view";
  render();
  renderLeaderboard();
  if (MGCloud.state.user && MGCloud.state.token) MGCloud.sync();
})();

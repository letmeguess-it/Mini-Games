/* ===== Let Me Guess — single-page app: sidebar, routing, home dashboard ===== */
(function () {
  "use strict";
  const { GAMES, stats, dayKey, addDays, dayNumber, h } = MG;
  const sidebar = document.getElementById("sidebar"), view = document.getElementById("view");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let current = null; // slug of the open game, or null for home
  const FIRST_DAY = "2026-01-01"; // Day #1: the calendar starts here
  let selDay = MG.dayKey(), calMonth = MG.dayKey().slice(0, 7);

  const route = () => decodeURIComponent(location.hash.replace(/^#/, ""));
  // "#sonar" → today's Sonar; "#sonar-2026-11-20" → Sonar's daily for 20 Nov (past dates only).
  function parseRoute() {
    const m = route().match(/^([a-z]+)(?:-(\d{4}-\d{2}-\d{2}))?$/);
    if (!m || !GAMES.some((g) => g.slug === m[1])) return { slug: null, day: null };
    const d = m[2] && m[2] >= FIRST_DAY && m[2] < MG.dayKey() ? m[2] : null;
    return { slug: m[1], day: d };
  }
  const linkFor = (slug, day) => (day && day !== MG.dayKey() ? `#${slug}-${day}` : `#${slug}`);
  const go = (target) => { if (route() !== target) location.hash = target ? target : ""; else render(); };

  // ---------- Sidebar ----------
  function statusOf(g) {
    const paused = MG.pausedRuns(g.slug).length > 0, today = stats(g.slug).today;
    if (paused) return { cls: "paused", text: "Paused" };
    if (today) return { cls: "done", text: today.abandoned ? "Ended" : `✓ ${today.score}` };
    return { cls: "", text: "Daily" };
  }
  function renderSidebar() {
    const doneCount = GAMES.filter((g) => stats(g.slug).today).length;
    sidebar.innerHTML = "";
    sidebar.append(
      h("a", { class: "brand", href: "#" }, h("img", { class: "brand-logo", src: "assets/logo.svg", alt: "", width: 34, height: 34 }), h("span", {}, "Let Me Guess")),
      h("a", { class: `nav-item ${current ? "" : "on"}`, href: "#", style: "--gc:var(--ink)" },
        h("span", { class: "nav-mark home", html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 11 12 4l9 7M5 10v10h14V10"/></svg>` }),
        h("span", { class: "nav-text" }, h("b", {}, "Dashboard"), h("small", {}, `Day #${dayNumber()}`))),
      h("div", { class: "nav-label" }, "Games"),
      ...GAMES.map((g) => {
        const st = statusOf(g);
        return h("a", { class: `nav-item ${current === g.slug ? "on" : ""}`, href: `#${g.slug}`, style: `--gc:${g.color}`, "aria-current": current === g.slug ? "page" : null },
          h("img", { class: "nav-icon", src: `games/${g.slug}/icon.svg`, alt: "", width: 34, height: 34 }),
          h("span", { class: "nav-text" }, h("b", {}, g.name), h("small", {}, g.skill)),
          h("span", { class: `nav-status ${st.cls}` }, st.text));
      }),
      h("div", { class: "side-foot" }, `Today's dailies · ${doneCount}/${GAMES.length}`,
        h("div", { class: "progress" }, ...GAMES.map((g) => h("i", { style: stats(g.slug).today ? `background:${g.color}` : "" })))));
    sidebar.querySelector(".nav-item.on")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  // ---------- Home ----------
  function greeting() { const hr = new Date().getHours(); return hr < 5 ? "Up late?" : hr < 12 ? "Good morning." : hr < 17 ? "Good afternoon." : "Good evening."; }
  function renderHome() {
    view.dataset.game = "home";
    view.style.removeProperty("--accent");
    const today = dayKey();
    const all = GAMES.map((g) => ({ g, s: stats(g.slug) }));
    const done = all.filter((x) => x.s.today);
    const dailyDays = new Set(all.flatMap((x) => x.s.all.filter((p) => p.mode === "daily" && !p.abandoned).map((p) => p.day)));
    const streak = MG.streakFrom([...dailyDays]).current;
    const played = all.filter((x) => x.s.plays);
    const rating = played.length ? Math.round(played.reduce((a, x) => a + x.s.rating, 0) / played.length) : null;
    const next = all.find((x) => !x.s.today);
    const paused = GAMES.flatMap((g) => MG.pausedRuns(g.slug).map((r) => ({ g, r }))).sort((a, b) => (b.r.saved || 0) - (a.r.saved || 0));

    const days = Array.from({ length: 14 }, (_, k) => addDays(today, k - 13));
    const pts = days.map((d) => all.reduce((a, x) => a + x.s.all.filter((p) => p.mode === "daily" && p.day === d).reduce((b, p) => b + p.score, 0), 0));
    const mx = Math.max(100, ...pts);
    const ranked = all.slice().sort((a, b) => b.s.rating - a.s.rating);
    const totalGames = all.reduce((a, x) => a + x.s.plays, 0);
    const fav = all.slice().sort((a, b) => b.s.plays - a.s.plays)[0];
    const strongest = ranked.find((x) => x.s.plays);
    const longest = Math.max(0, ...all.map((x) => x.s.bestStreak));

    view.innerHTML = `<div class="view-inner anim-in">
      <section class="hero">
        <div>
          <span class="pill">Day #${dayNumber()} · ${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>
          <h1>${played.length ? `${greeting()}<br>${done.length === GAMES.length ? "All dailies done." : `${GAMES.length - done.length} dailies to go.`}` : "Guess better,<br>every day."}</h1>
          <p class="lead">Ten original games of estimation, deduction and intuition. Pick one on the left. Each has a fresh daily challenge, no question ever repeats, and if you leave mid-game you'll pick up exactly where you stopped.</p>
        </div>
        <div class="card today">
          <div class="row" style="justify-content:space-between"><b>Today's challenges</b><span class="faint mono">${done.length}/${GAMES.length}</span></div>
          <div class="progress">${all.map((x) => `<i title="${x.g.name}${x.s.today ? ": " + x.s.today.score : ""}" style="${x.s.today ? `background:${x.g.color}` : ""}"></i>`).join("")}</div>
          <div class="kpis">
            <div class="kpi"><b>${streak}</b><span>Day streak</span></div>
            <div class="kpi"><b>${done.reduce((a, x) => a + x.s.today.score, 0)}</b><span>Points today</span></div>
            <div class="kpi"><b>${rating ?? "–"}</b><span>Mind rating</span></div>
          </div>
          ${next ? `<a class="btn primary" href="#${next.g.slug}">Play next daily: ${next.g.name} →</a>` : `<button class="btn primary" disabled>Come back tomorrow ✓</button>`}
        </div>
      </section>

      ${paused.length ? `<div class="sec-h"><h2>Continue where you left off</h2><span class="faint" style="font-size:13px">Paused games wait for you, however long you're away</span></div>
      <section class="paused-list">${paused.map(({ g, r }) => `<a class="card paused" href="${r.mode === "daily" ? linkFor(g.slug, r.day) : "#" + g.slug}" style="--gc:${g.color}">
          <img class="nav-icon" src="games/${g.slug}/icon.svg" alt="" width="40" height="40">
          <span><b>${g.name} · ${r.mode === "daily" ? (r.day === today ? "Today's daily" : `Daily from ${MG.fmtDay(r.day)}`) : "Practice"}</b>
          <small>${esc(MG.DEFS[g.slug].progress ? MG.DEFS[g.slug].progress(r) : "In progress")} · ${MG.ago(r.saved || r.started)}</small></span>
          <span class="go">Resume →</span></a>`).join("")}</section>` : ""}

      <div class="sec-h"><h2>Daily calendar</h2><span class="faint" style="font-size:13px">Pick any day up to today to play that day's challenges</span></div>
      <section class="cal-wrap" id="cal"></section>

      <div class="sec-h"><h2>Insights</h2><span class="faint" style="font-size:13px">From every game played in this browser</span></div>
      <section class="insights">
        <div class="card panel"><h3>Skill profile · average of last 10 games</h3>
          ${ranked.map(({ g, s }) => `<a class="skill-row" href="#${g.slug}" title="${g.name}: ${s.plays ? `${s.rating} average over the last ${Math.min(10, s.plays)} games` : "not played yet"}">
            <span class="sk-name"><img src="games/${g.slug}/icon.svg" alt="" width="20" height="20">${g.name}</span><span class="track"><i style="width:${s.rating}%;background:${g.color}"></i></span>
            <span class="mono" style="text-align:right;font-weight:700">${s.plays ? s.rating : "–"}</span></a>`).join("")}</div>
        <div class="card panel"><h3>Daily points · last 14 days</h3>
          <div class="cols">${days.map((d, k) => `<div class="c ${d === today ? "today" : ""}"><span class="tip">${d.slice(5)} · ${pts[k]} pts</span><i style="height:${Math.max(2, Math.round((pts[k] / mx) * 112))}px"></i></div>`).join("")}</div>
          <div class="cols-x">${days.map((d, k) => `<span>${k % 2 === 1 ? +d.slice(8) : ""}</span>`).join("")}</div>
          <div class="highlights">${[[totalGames, "Games played"], [strongest ? strongest.g.name : "–", "Strongest game"], [fav && fav.s.plays ? fav.g.name : "–", "Most played"], [longest, "Longest game streak"]]
            .map(([v, l]) => `<div class="kpi"><b style="font-size:17px">${esc(v)}</b><span>${l}</span></div>`).join("")}</div></div>
      </section>
      <p class="foot-note">Everything is saved in this browser: scores, paused games and the questions you've already seen. There are no accounts and no server.</p>
    </div>`;
  }

  // ---------- Calendar ----------
  const doneOn = (day) => GAMES.map((g) => ({ g, p: MG.dailyOn(g.slug, day), paused: MG.getRun(g.slug, "daily", day) }));
  function renderCalendar() {
    const box = document.getElementById("cal"); if (!box) return;
    const today = dayKey(), [Y, M] = calMonth.split("-").map(Number);
    const first = new Date(Y, M - 1, 1), daysIn = new Date(Y, M, 0).getDate(), lead = (first.getDay() + 6) % 7; // Monday first
    const monthName = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const canPrev = calMonth > FIRST_DAY.slice(0, 7), canNext = calMonth < today.slice(0, 7);
    let cells = "";
    for (let i = 0; i < lead; i++) cells += `<span class="cal-cell empty"></span>`;
    for (let d = 1; d <= daysIn; d++) {
      const key = `${calMonth}-${String(d).padStart(2, "0")}`, future = key > today, early = key < FIRST_DAY;
      const n = future || early ? 0 : doneOn(key).filter((x) => x.p).length;
      cells += `<button class="cal-cell ${key === today ? "is-today" : ""} ${key === selDay ? "sel" : ""} ${n === GAMES.length ? "full" : ""}" data-day="${key}" ${future || early ? "disabled" : ""}
        aria-label="${key}${n ? `, ${n} of ${GAMES.length} dailies played` : ""}">${d}${n ? `<i class="${n === GAMES.length ? "all" : ""}"></i>` : ""}</button>`;
    }
    const rows = doneOn(selDay), pts = rows.reduce((a, x) => a + (x.p ? x.p.score : 0), 0), nDone = rows.filter((x) => x.p).length;
    const nice = new Date(selDay + "T12:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    box.innerHTML = `
      <div class="card cal">
        <div class="cal-head"><b>${monthName}</b>
          ${calMonth !== today.slice(0, 7) || selDay !== today ? `<button class="cal-link" data-today>Today</button>` : ""}
          <button class="cal-nav" data-nav="-1" ${canPrev ? "" : "disabled"} aria-label="Previous month">‹</button><button class="cal-nav" data-nav="1" ${canNext ? "" : "disabled"} aria-label="Next month">›</button></div>
        <div class="cal-grid cal-dow">${["M", "T", "W", "T", "F", "S", "S"].map((d) => `<span>${d}</span>`).join("")}</div>
        <div class="cal-grid">${cells}</div>
      </div>
      <div class="card day-panel">
        <div class="dp-head"><div><span class="pill">Day #${dayNumber(selDay)}${selDay === today ? " · Today" : ""}</span><h3>${nice}</h3>
          <p class="faint">${nDone}/${GAMES.length} played · ${pts} points${selDay !== today ? " · new questions just for this day" : ""}</p></div></div>
        <div class="dp-list">${rows.map(({ g, p, paused }) => `<a class="dp-row" href="${linkFor(g.slug, selDay)}" style="--gc:${g.color}">
          <img src="games/${g.slug}/icon.svg" alt="" width="30" height="30"><span class="dp-name">${g.name}</span>
          <span class="dp-st ${p ? (p.abandoned ? "end" : "done") : paused && paused.moves ? "pause" : ""}">${p ? (p.abandoned ? "Ended" : `✓ ${p.score}`) : paused && paused.moves ? "Paused" : "Play →"}</span></a>`).join("")}</div>
      </div>`;
    box.querySelectorAll("[data-day]").forEach((b) => b.addEventListener("click", () => { selDay = b.dataset.day; renderCalendar(); }));
    box.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => {
      const [y, m] = calMonth.split("-").map(Number), d = new Date(y, m - 1 + +b.dataset.nav, 1);
      calMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; renderCalendar();
    }));
    box.querySelector("[data-today]")?.addEventListener("click", () => { selDay = dayKey(); calMonth = selDay.slice(0, 7); renderCalendar(); });
  }

  // ---------- Router ----------
  function render() {
    const { slug, day } = parseRoute();
    current = slug;
    document.body.dataset.view = current ? "game" : "home";
    renderSidebar();
    if (current) {
      if (day) { selDay = day; calMonth = day.slice(0, 7); } // returning to the dashboard keeps the chosen day
      MG.mountGame(view, current, { day, onExit: () => (window._mgCameFromHome ? history.back() : go("")), onChange: renderSidebar, onToday: () => go(current) });
    } else {
      renderHome();
      renderCalendar();
    }
    window.scrollTo({ top: 0 });
    document.title = current ? `${GAMES.find((g) => g.slug === current).name} · Let Me Guess` : "Let Me Guess · Guess better every day";
  }
  let lastRoute = route();
  addEventListener("hashchange", () => { window._mgCameFromHome = lastRoute === "" && route() !== ""; lastRoute = route(); render(); });
  // Keep views fresh when the tab regains focus (e.g. the next day).
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !current) render(); });
  render();
})();

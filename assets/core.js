/* ===== Mini Games — shared core =====
 * Everything lives in the browser:
 *  - localStorage keeps score history, paused games and every question a player has seen
 *  - a seeded RNG makes each day's challenge stable while you play it
 *  - mountGame() draws a game into the right-hand pane of the single-page app
 */
(function () {
  "use strict";

  const PREFIX = "mg:v1:";

  // ---------- Game registry ----------
  const GAMES = [
    { slug: "ballpark", name: "Ballpark", color: "#3b5bdb", skill: "Estimation",
      tagline: "Guess huge and tiny numbers on a log scale. Close in powers of ten counts." },
    { slug: "compass", name: "Compass", color: "#0c8599", skill: "Geography",
      tagline: "Point the needle from one city to another, then guess the distance." },
    { slug: "fermi", name: "Fermi", color: "#e8590c", skill: "Reasoning",
      tagline: "Break an impossible question into pieces you can guess." },
    { slug: "glyph", name: "Glyph", color: "#7048e8", skill: "Words",
      tagline: "Find the hidden word from letter-overlap counts alone." },
    { slug: "sonar", name: "Sonar", color: "#1098ad", skill: "Deduction",
      tagline: "Ping the deep. Every ping tells you how far the nearest wreck is." },
    { slug: "equilibrium", name: "Equilibrium", color: "#2f9e44", skill: "Logic",
      tagline: "Each symbol hides a digit. The sums give them away." },
    { slug: "liar", name: "Liar", color: "#c2255c", skill: "Logic",
      tagline: "Find the number. The oracle will lie to you exactly once." },
    { slug: "chrono", name: "Chrono", color: "#a07800", skill: "History",
      tagline: "Drop five moments onto the timeline. Years matter." },
    { slug: "eyeball", name: "Eyeball", color: "#d6336c", skill: "Perception",
      tagline: "How many dots? What angle? Trust your eyes, fast." },
    { slug: "oracle", name: "Oracle", color: "#5f3dc4", skill: "Induction",
      tagline: "Test numbers against a secret rule, then name the rule." },
  ];
  const DEFS = {};
  const define = (d) => (DEFS[d.slug] = d);

  // ---------- Dates ----------
  function dayKey(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function addDays(key, n) { const [y, m, d] = key.split("-").map(Number); return dayKey(new Date(y, m - 1, d + n)); }
  function dayNumber(key = dayKey()) { const [y, m, d] = key.split("-").map(Number); return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 0, 1)) / 864e5) + 1; }
  function msToMidnight() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n; }
  function fmtDay(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: y === new Date().getFullYear() ? undefined : "numeric" }); }
  function ago(t) {
    const s = Math.max(1, Math.round((Date.now() - t) / 1000));
    if (s < 60) return "just now";
    const units = [[31536000, "year"], [2592000, "month"], [86400, "day"], [3600, "hour"], [60, "minute"]];
    for (const [n, u] of units) if (s >= n) { const v = Math.floor(s / n); return `${v} ${u}${v > 1 ? "s" : ""} ago`; }
  }

  // ---------- Seeded RNG ----------
  function hashStr(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function rng(seed) {
    let a = hashStr(String(seed));
    const next = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    next.pick = (arr) => arr[Math.floor(next() * arr.length)];
    next.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    next.sample = (arr, k) => next.shuffle(arr).slice(0, k);
    return next;
  }

  // ---------- Storage ----------
  function read(key, fallback) { try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
  function write(key, val) { try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) { console.warn("Storage unavailable", e); } }
  function remove(key) { try { localStorage.removeItem(PREFIX + key); } catch {} }
  function gameData(slug) { return read("game:" + slug, { plays: [] }); }
  function record(slug, { score, mode, summary = "", share = "", day = dayKey(), abandoned = false }) {
    const data = gameData(slug);
    if (mode === "daily" && data.plays.some((p) => p.mode === "daily" && p.day === day)) return null;
    const play = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), t: Date.now(), day, mode,
      score: Math.max(0, Math.min(100, Math.round(score))), summary, share, ...(abandoned ? { abandoned: true } : {}) };
    data.plays.push(play);
    data.plays.sort((a, b) => a.t - b.t);
    if (data.plays.length > 1000) data.plays = data.plays.slice(-1000);
    write("game:" + slug, data);
    return play;
  }

  // Saved (paused) games: one per game per mode.
  const runKey = (slug, mode) => `run:${slug}:${mode}`;
  const getRun = (slug, mode) => read(runKey(slug, mode), null);
  const pausedRuns = (slug) => ["daily", "practice"].map((m) => getRun(slug, m)).filter((r) => r && r.moves > 0);

  // Every question a player has seen, so nothing ever repeats.
  const seenSet = (slug) => new Set(read("seen:" + slug, []));
  function markSeen(slug, ids) {
    const arr = read("seen:" + slug, []), s = new Set(arr);
    ids.forEach((id) => { id = String(id); if (!s.has(id)) { s.add(id); arr.push(id); } });
    write("seen:" + slug, arr);
  }

  function streakFrom(days) {
    const set = new Set(days);
    let cur = 0, k = dayKey();
    if (!set.has(k)) k = addDays(k, -1);
    while (set.has(k)) { cur++; k = addDays(k, -1); }
    let best = 0, run = 0, prev = null;
    [...set].sort().forEach((d) => { run = prev && addDays(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; });
    return { current: cur, best };
  }
  function stats(slug) {
    const plays = gameData(slug).plays;
    const daily = plays.filter((p) => p.mode === "daily");
    const scores = plays.map((p) => p.score);
    const s = streakFrom(daily.filter((p) => !p.abandoned).map((p) => p.day));
    const recent = plays.slice(-10).map((p) => p.score);
    return {
      plays: plays.length, best: scores.length ? Math.max(...scores) : 0,
      avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      rating: recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : 0,
      streak: s.current, bestStreak: s.best, today: daily.find((p) => p.day === dayKey()) || null, all: plays,
    };
  }

  // ---------- UI helpers ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v);
    }
    kids.flat().forEach((k) => k != null && k !== false && el.append(k.nodeType ? k : document.createTextNode(k)));
    return el;
  }
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = h("div", { class: "toast", role: "status" }); document.body.append(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function modal(title, html) {
    const back = h("div", { class: "modal-back", onclick: (e) => e.target === back && close() });
    const close = () => { back.remove(); removeEventListener("keydown", esc); };
    const esc = (e) => e.key === "Escape" && close();
    back.append(h("div", { class: "card modal", role: "dialog", "aria-label": title }, h("h2", {}, title), h("div", { html }),
      h("div", { class: "row", style: "justify-content:flex-end;margin-top:14px" }, h("button", { class: "btn primary", onclick: close }, "Got it"))));
    document.body.append(back); addEventListener("keydown", esc);
  }
  function ring(score, color, size = 140) {
    const r = size / 2 - 10, c = 2 * Math.PI * r, off = c * (1 - score / 100);
    const arc = score > 0 ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c}" transform="rotate(-90 ${size / 2} ${size / 2})">
        <animate attributeName="stroke-dashoffset" from="${c}" to="${off}" dur=".9s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1" keyTimes="0;1"/></circle>` : "";
    return `<svg class="score-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="10"/>${arc}
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="var(--mono)" font-weight="700" font-size="${size / 4}" fill="var(--ink)">${score}</text></svg>`;
  }
  function spark(values, color, w = 260, hgt = 56) {
    if (values.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${hgt}"><text x="0" y="${hgt / 2}" fill="var(--ink-3)" font-size="12">Play twice to see a trend</text></svg>`;
    const step = w / (values.length - 1);
    const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(hgt - 4 - (v / 100) * (hgt - 8)).toFixed(1)}`);
    return `<svg class="spark" viewBox="0 0 ${w} ${hgt}" preserveAspectRatio="none">
      <polyline points="0,${hgt} ${pts.join(" ")} ${w},${hgt}" fill="${color}" opacity=".08"/>
      <polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
  }
  function fmtCountdown(ms) { const s = Math.floor(ms / 1000); return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((x) => String(x).padStart(2, "0")).join(":"); }
  function fmtNum(n) {
    const a = Math.abs(n);
    if (a >= 1e12) return +(n / 1e12).toPrecision(3) + " trillion";
    if (a >= 1e9) return +(n / 1e9).toPrecision(3) + " billion";
    if (a >= 1e6) return +(n / 1e6).toPrecision(3) + " million";
    if (a >= 100) return Math.round(n).toLocaleString();
    if (a >= 1) return String(+n.toPrecision(3));
    return String(+n.toPrecision(2));
  }
  const blocks = (scores) => scores.map((s) => (s >= 80 ? "🟩" : s >= 50 ? "🟨" : s >= 20 ? "🟧" : "⬛")).join("");
  const css = (text) => document.head.append(h("style", {}, text));
  function parseNum(str) {
    if (str == null) return NaN;
    const s = String(str).trim().toLowerCase().replace(/,/g, "").replace(/\s+/g, "");
    const mult = { k: 1e3, thousand: 1e3, m: 1e6, mn: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9, t: 1e12, trillion: 1e12, lakh: 1e5, crore: 1e7 };
    const m = s.match(/^([0-9]*\.?[0-9]+(?:e[+-]?\d+)?)([a-z]*)$/);
    if (!m) { const x = s.match(/^([0-9.]+)[x×*]10\^?(-?\d+)$/); return x ? parseFloat(x[1]) * 10 ** +x[2] : NaN; }
    const n = parseFloat(m[1]);
    return !m[2] ? n : mult[m[2]] ? n * mult[m[2]] : NaN;
  }
  function sci(n) {
    if (n >= 1e15 || (n > 0 && n < 1e-3)) { const e = Math.floor(Math.log10(n)); return `${+(n / 10 ** e).toFixed(2)} × 10^${e}`; }
    return fmtNum(n);
  }
  function logSlider({ lo, hi, unit = "" }) {
    const L0 = Math.log10(lo), L1 = Math.log10(hi);
    let value = +(10 ** ((L0 + L1) / 2)).toPrecision(2);
    const range = h("input", { type: "range", min: 0, max: 1000, value: 500, "aria-label": "Estimate" });
    const text = h("input", { class: "input", inputmode: "decimal", placeholder: "Or type: 3.5m, 2e9, 4 crore", "aria-label": "Type an estimate" });
    const readout = h("div", { class: "mono readout" });
    const show = () => { readout.innerHTML = `${sci(value)} <span class="muted unit">${unit}</span>`; };
    range.addEventListener("input", () => { value = +(10 ** (L0 + (L1 - L0) * (range.value / 1000))).toPrecision(2); text.value = ""; show(); });
    text.addEventListener("input", () => { const n = parseNum(text.value); if (n > 0) { value = n; range.value = Math.max(0, Math.min(1000, ((Math.log10(n) - L0) / (L1 - L0)) * 1000)); show(); } });
    show();
    const el = h("div", {}, readout, range, h("div", { class: "row faint mono", style: "justify-content:space-between;font-size:12px" }, h("span", {}, sci(lo)), h("span", {}, sci(hi))), h("div", { style: "margin-top:12px" }, text));
    return { el, text, get value() { return value; }, disable() { range.disabled = text.disabled = true; } };
  }
  // Progress dots + counter used by round-based games.
  function roundTop(i, total, right) {
    return h("div", { class: "stage-top" }, h("div", { class: "dots" }, ...Array.from({ length: total }, (_, k) => h("i", { class: k < i ? "on" : k === i ? "cur" : "" }))),
      right || h("span", { class: "faint mono" }, `${i + 1} / ${total}`));
  }

  // ---------- Game pane ----------
  function mountGame(view, slug, { onExit, onChange } = {}) {
    const def = DEFS[slug], meta = GAMES.find((g) => g.slug === slug);
    view.dataset.game = slug;
    view.style.setProperty("--accent", meta.color);
    let mode = read("lastmode:" + slug, "daily");

    const stage = h("div", { class: "card stage" });
    const side = h("aside", { class: "side" });
    const seg = h("div", { class: "seg", role: "tablist" },
      h("button", { "data-m": "daily", onclick: () => setMode("daily") }, "Daily"),
      h("button", { "data-m": "practice", onclick: () => setMode("practice") }, "Practice"));
    view.innerHTML = "";
    view.append(h("div", { class: "g-wrap" },
      h("div", { class: "g-head" },
        h("button", { class: "btn back", onclick: onExit, title: "Your progress is saved" }, "← Dashboard"),
        h("div", { class: "g-title" }, h("h1", {}, meta.name), h("span", { class: "pill" }, meta.skill)),
        h("span", { class: "spacer" }), seg,
        h("button", { class: "btn sm", onclick: () => modal(`How to play ${meta.name}`, def.howTo) }, "How to play")),
      h("p", { class: "g-tag" }, meta.tagline),
      h("div", { class: "game-grid" }, stage, side)));

    function setMode(m) {
      mode = m; write("lastmode:" + slug, m);
      seg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
      enter();
    }
    const changed = () => { renderSide(); onChange && onChange(); };

    function enter() {
      stage.innerHTML = ""; renderSide();
      const run = getRun(slug, mode);
      if (run && run.moves > 0) return resumeCard(run);
      if (run) return play(run);
      if (mode === "daily" && stats(slug).today) return showResult(stats(slug).today, true);
      fresh();
    }
    function fresh() {
      stage.innerHTML = "";
      const seed = mode === "daily" ? `${slug}:${dayKey()}` : `${slug}:p:${Date.now()}:${Math.random()}`;
      const state = { seed, mode, day: dayKey(), started: Date.now(), moves: 0 };
      const init = def.init(makeCtx(state));
      if (!init) return exhausted();
      Object.assign(state, init);
      write(runKey(slug, mode), state);
      changed();
      play(state);
    }
    function play(state) {
      stage.innerHTML = "";
      const ctx = makeCtx(state);
      stage.append(ctx.root);
      def.render(ctx, state);
    }
    function makeCtx(state) {
      const r = rng(state.seed + ":" + (state.moves || 0));
      return {
        root: h("div", { class: "anim-in" }), mode: state.mode, day: state.day, rng: r, h, toast, color: meta.color,
        // Pick k questions this player has never seen; marks them seen immediately.
        pick(pool, k, idOf = (x) => x.id) {
          const seen = seenSet(slug), avail = pool.filter((x) => !seen.has(String(idOf(x))));
          if (avail.length < k) return null;
          const out = r.sample(avail, k); markSeen(slug, out.map(idOf)); return out;
        },
        isSeen: (id) => seenSet(slug).has(String(id)),
        markSeen: (ids) => markSeen(slug, ids),
        save() { state.moves = (state.moves || 0) + 1; state.saved = Date.now(); write(runKey(slug, state.mode), state); changed(); },
        finish(score, { summary = "", share = "" } = {}) {
          remove(runKey(slug, state.mode));
          const header = `${meta.name} ${state.mode === "daily" ? "#" + dayNumber(state.day) : "(practice)"} · ${Math.round(score)}/100`;
          const p = record(slug, { score, mode: state.mode, day: state.day, summary, share: share ? `${header}\n${share}` : header });
          changed();
          setTimeout(() => stage.isConnected && showResult(p || { score: Math.round(score), summary, share: header }, state.mode === "daily"), 650);
        },
      };
    }
    function resumeCard(run) {
      const oldDaily = run.mode === "daily" && run.day !== dayKey();
      const prog = def.progress ? def.progress(run) : "";
      const card = h("div", { class: "resume anim-in" },
        h("div", { class: "pause-icon", html: `<svg viewBox="0 0 48 48" width="56" height="56"><circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="16" y="14" width="5" height="20" rx="2" fill="currentColor"/><rect x="27" y="14" width="5" height="20" rx="2" fill="currentColor"/></svg>` }),
        h("h2", {}, oldDaily ? `Unfinished daily from ${fmtDay(run.day)}` : run.mode === "daily" ? "Today's daily is paused" : "Practice game paused"),
        h("p", { class: "muted" }, [prog, `Last played ${ago(run.saved || run.started)}`].filter(Boolean).join(" · ")),
        h("div", { class: "actions" },
          h("button", { class: "btn primary lg", onclick: () => play(run) }, "Resume"),
          h("button", { class: "btn lg", onclick: () => startOver(run) }, "Start a new game")),
        run.mode === "daily" ? h("p", { class: "faint", style: "font-size:13px;max-width:380px" },
          "Starting over ends this daily with the points you've earned so far. Questions you've already seen won't come back.") : null);
      stage.append(card);
    }
    function startOver(run) {
      remove(runKey(slug, run.mode));
      if (run.mode === "daily") {
        record(slug, { score: def.partial ? def.partial(run) : 0, mode: "daily", day: run.day, summary: "Ended early", abandoned: true });
        changed();
        if (!stats(slug).today) return enter();   // an old daily ended: today's is still waiting
        return setMode("practice");
      }
      changed(); fresh();
    }
    function exhausted() {
      stage.append(h("div", { class: "resume anim-in" }, h("h2", {}, "You've seen every question"),
        h("p", { class: "muted", style: "max-width:420px" }, `You've played every question ${meta.name} has, and questions never repeat. New ones will be added to the game.`),
        mode === "daily" ? h("button", { class: "btn", onclick: () => setMode("practice") }, "Try practice") : null));
    }
    function renderSide() {
      const s = stats(slug);
      side.innerHTML = `
        <div class="card"><h3>Your stats</h3><div class="kpis">
          <div class="kpi"><b>${s.streak}</b><span>Daily streak</span></div><div class="kpi"><b>${s.best}</b><span>Best score</span></div>
          <div class="kpi"><b>${s.avg}</b><span>Average</span></div><div class="kpi"><b>${s.plays}</b><span>Games played</span></div></div></div>
        <div class="card"><h3>Score history</h3>${spark(s.all.slice(-30).map((p) => p.score), meta.color)}
          <ul class="history">${s.all.slice(-40).reverse().map((p) => `<li><span class="tag">${p.mode === "daily" ? "Daily" : "Practice"}</span>
            <span class="faint mono" style="font-size:11px;width:44px">${p.day.slice(5)}</span><span class="bar"><i style="width:${p.score}%"></i></span>
            <span class="sc">${p.abandoned ? "–" : p.score}</span></li>`).join("") || `<li class="faint">No games yet. Today's daily is waiting.</li>`}</ul></div>`;
    }
    function showResult(p, isDaily) {
      stage.innerHTML = "";
      const res = h("div", { class: "result" });
      res.innerHTML = `${ring(p.score, meta.color)}<h2>${p.abandoned ? "Ended early" : p.score >= 90 ? "Outstanding" : p.score >= 70 ? "Sharp" : p.score >= 45 ? "Not bad" : "Tough one"}</h2>
        <div class="detail">${p.summary || ""}</div>`;
      const actions = h("div", { class: "actions" });
      if (p.share) actions.append(h("button", { class: "btn", onclick: () => navigator.clipboard?.writeText(p.share).then(() => toast("Result copied"), () => toast("Couldn't copy")) }, "Copy result"));
      if (isDaily) {
        const cd = h("div", { class: "countdown" });
        const tick = () => { if (!cd.isConnected) return clearInterval(iv); cd.textContent = `Next daily in ${fmtCountdown(msToMidnight())}`; };
        const iv = setInterval(tick, 1000); tick();
        actions.append(h("button", { class: "btn primary", onclick: () => setMode("practice") }, "Practice round"));
        res.append(actions, cd);
      } else {
        actions.append(h("button", { class: "btn primary", onclick: () => fresh() }, "Play again"));
        res.append(actions);
      }
      stage.append(res);
    }

    setMode(mode);
    return { slug };
  }

  window.MG = { GAMES, DEFS, define, dayKey, dayNumber, addDays, fmtDay, ago, msToMidnight, rng, hashStr, read, write, remove, gameData, record, stats, streakFrom,
    getRun, pausedRuns, seenSet, markSeen, h, $, toast, modal, ring, spark, fmtNum, fmtCountdown, blocks, css, parseNum, sci, logSlider, roundTop, mountGame, PREFIX };
})();

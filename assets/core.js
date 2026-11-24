/* ===== Mini Games — shared core =====
 * Everything lives in the browser: localStorage for history, a date-seeded
 * RNG for daily challenges, and a small UI shell every game mounts into.
 */
(function () {
  "use strict";

  const PREFIX = "mg:v1:";

  // ---------- Game registry (single source of truth for the dashboard) ----------
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

  // ---------- Dates ----------
  function dayKey(d = new Date()) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
  function addDays(key, n) {
    const [y, m, d] = key.split("-").map(Number);
    return dayKey(new Date(y, m - 1, d + n));
  }
  function dayNumber(key = dayKey()) {
    const [y, m, d] = key.split("-").map(Number);
    return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 0, 1)) / 864e5) + 1;
  }
  function msToMidnight() {
    const n = new Date(), t = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
    return t - n;
  }

  // ---------- Seeded RNG ----------
  function hashStr(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; };
  }
  function rng(seed) {
    let a = hashStr(String(seed))();
    const next = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    next.pick = (arr) => arr[Math.floor(next() * arr.length)];
    next.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    next.sample = (arr, k) => next.shuffle(arr).slice(0, k);
    return next;
  }

  // ---------- Storage ----------
  function read(key, fallback) {
    try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) { console.warn("storage full?", e); }
  }
  function gameData(slug) { return read("game:" + slug, { plays: [] }); }
  function setGameData(slug, data) {
    data.plays.sort((a, b) => a.t - b.t);
    if (data.plays.length > 600) data.plays = data.plays.slice(-600);
    write("game:" + slug, data);
    write("updated", Date.now());
  }

  function record(slug, { score, mode, summary = "", share = "" }) {
    const data = gameData(slug);
    const play = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), t: Date.now(),
      day: dayKey(), mode, score: Math.max(0, Math.min(100, Math.round(score))), summary, share };
    if (mode === "daily" && data.plays.some((p) => p.mode === "daily" && p.day === play.day)) return null;
    data.plays.push(play);
    setGameData(slug, data);
    return play;
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
    const today = daily.find((p) => p.day === dayKey()) || null;
    const scores = plays.map((p) => p.score);
    const s = streakFrom(daily.map((p) => p.day));
    const recent = plays.slice(-10).map((p) => p.score);
    return {
      plays: plays.length, dailyPlays: daily.length,
      best: scores.length ? Math.max(...scores) : 0,
      avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      dailyAvg: daily.length ? Math.round(daily.reduce((a, b) => a + b.score, 0) / daily.length) : 0,
      dailyTotal: daily.reduce((a, b) => a + b.score, 0),
      rating: recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : 0,
      streak: s.current, bestStreak: s.best, today, all: plays,
    };
  }

  // All data, for sync. Merge = union of plays by id.
  function exportAll() {
    const games = {};
    GAMES.forEach((g) => (games[g.slug] = gameData(g.slug)));
    return { v: 1, updated: read("updated", 0), games, profile: read("profile", {}) };
  }
  function importMerge(remote) {
    if (!remote || !remote.games) return false;
    let changed = false;
    Object.entries(remote.games).forEach(([slug, rd]) => {
      if (!GAMES.some((g) => g.slug === slug)) return;
      const local = gameData(slug), ids = new Set(local.plays.map((p) => p.id));
      let mine = false;
      (rd.plays || []).forEach((p) => {
        if (!p || ids.has(p.id) || typeof p.score !== "number") return;
        if (p.mode === "daily" && local.plays.some((q) => q.mode === "daily" && q.day === p.day)) return;
        local.plays.push(p); mine = changed = true;
      });
      if (mine) setGameData(slug, local);
    });
    return changed;
  }

  // ---------- Small UI helpers ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v);
    }
    kids.flat().forEach((k) => k != null && el.append(k.nodeType ? k : document.createTextNode(k)));
    return el;
  }
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = h("div", { class: "toast" }); document.body.append(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function modal(title, html) {
    const back = h("div", { class: "modal-back", onclick: (e) => e.target === back && back.remove() });
    const box = h("div", { class: "card modal" }, h("h2", {}, title), h("div", { html }),
      h("div", { class: "row", style: "justify-content:flex-end;margin-top:14px" }, h("button", { class: "btn primary", onclick: () => back.remove() }, "Got it")));
    back.append(box); document.body.append(back);
    const esc = (e) => { if (e.key === "Escape") { back.remove(); removeEventListener("keydown", esc); } };
    addEventListener("keydown", esc);
  }
  function ring(score, color, size = 140) {
    const r = size / 2 - 10, c = 2 * Math.PI * r, off = c * (1 - score / 100);
    return `<svg class="score-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="10"/>
      ${score > 0 ? "" : "<!--"}<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c}" transform="rotate(-90 ${size / 2} ${size / 2})">
        <animate attributeName="stroke-dashoffset" from="${c}" to="${off}" dur=".9s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1" keyTimes="0;1"/>
      </circle>${score > 0 ? "" : "-->"}
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="var(--mono)" font-weight="700" font-size="${size / 4}" fill="var(--ink)">${score}</text>
    </svg>`;
  }
  function spark(values, color, w = 260, hgt = 56) {
    if (values.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${hgt}"><text x="0" y="${hgt / 2}" fill="var(--ink-3)" font-size="12">Play twice to see a trend</text></svg>`;
    const step = w / (values.length - 1);
    const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(hgt - 4 - (v / 100) * (hgt - 8)).toFixed(1)}`);
    return `<svg class="spark" viewBox="0 0 ${w} ${hgt}" preserveAspectRatio="none">
      <polyline points="0,${hgt} ${pts.join(" ")} ${w},${hgt}" fill="${color}" opacity=".08"/>
      <polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
  }
  function fmtCountdown(ms) {
    const s = Math.floor(ms / 1000);
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((x) => String(x).padStart(2, "0")).join(":");
  }
  function fmtNum(n) {
    const a = Math.abs(n);
    if (a >= 1e12) return +(n / 1e12).toPrecision(3) + " trillion";
    if (a >= 1e9) return +(n / 1e9).toPrecision(3) + " billion";
    if (a >= 1e6) return +(n / 1e6).toPrecision(3) + " million";
    if (a >= 1e4) return Math.round(n).toLocaleString();
    if (a >= 100) return Math.round(n).toLocaleString();
    if (a >= 1) return String(+n.toPrecision(3));
    return String(+n.toPrecision(2));
  }
  function blocks(scores) { return scores.map((s) => (s >= 80 ? "🟩" : s >= 50 ? "🟨" : s >= 20 ? "🟧" : "⬛")).join(""); }

  // ---------- Game shell ----------
  function game(def) {
    const meta = GAMES.find((g) => g.slug === def.slug);
    document.documentElement.style.setProperty("--accent", meta.color);
    document.title = `${meta.name} · Mini Games`;
    let mode = "daily";

    const stage = h("div", { class: "card stage" });
    const side = h("aside", { class: "side" });
    const modeSeg = h("div", { class: "seg" },
      h("button", { "data-m": "daily", class: "on", onclick: () => setMode("daily") }, "Daily"),
      h("button", { "data-m": "practice", onclick: () => setMode("practice") }, "Practice"));

    document.body.append(
      h("header", { class: "topbar" }, h("div", { class: "wrap" },
        h("a", { class: "brand", href: "../../index.html" }, h("span", { class: "brand-mark" }, "?"), "Mini Games"),
        h("span", { class: "spacer" }),
        h("button", { class: "btn ghost sm", onclick: () => modal(`How to play ${meta.name}`, def.howTo) }, "How to play"))),
      h("main", { class: "wrap" },
        h("section", { class: "game-head" },
          h("div", { style: "flex:1;min-width:240px" }, h("div", { class: "pill" }, meta.skill), h("h1", {}, meta.name), h("p", {}, meta.tagline)),
          modeSeg),
        h("section", { class: "game-grid" }, stage, side)));

    function setMode(m) {
      mode = m;
      modeSeg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
      start();
    }

    function renderSide() {
      const s = stats(def.slug);
      const recent = s.all.slice(-30).map((p) => p.score);
      side.innerHTML = `
        <div class="card"><h3>Your stats</h3>
          <div class="kpis">
            <div class="kpi"><b>${s.streak}</b><span>Daily streak</span></div>
            <div class="kpi"><b>${s.best}</b><span>Best score</span></div>
            <div class="kpi"><b>${s.avg}</b><span>Average</span></div>
            <div class="kpi"><b>${s.plays}</b><span>Games played</span></div>
          </div></div>
        <div class="card"><h3>Score history</h3>${spark(recent, meta.color)}
          <ul class="history">${s.all.slice(-40).reverse().map((p) => `
            <li title="${(p.summary || "").replace(/"/g, "&quot;")}"><span class="tag">${p.mode === "daily" ? "Daily" : "Practice"}</span>
            <span class="faint mono" style="font-size:11px;width:44px">${p.day.slice(5)}</span>
            <span class="bar"><i style="width:${p.score}%"></i></span><span class="sc">${p.score}</span></li>`).join("") ||
            `<li class="faint">No games yet. Today's daily is waiting.</li>`}</ul></div>`;
    }

    function showResult(play, isDaily) {
      const res = h("div", { class: "result" });
      res.innerHTML = `${ring(play.score, meta.color)}
        <h2>${play.score >= 90 ? "Outstanding" : play.score >= 70 ? "Sharp" : play.score >= 45 ? "Not bad" : "Tough one"}</h2>
        <div class="detail">${play.summary || ""}</div>`;
      const actions = h("div", { class: "actions" });
      if (play.share) actions.append(h("button", { class: "btn", onclick: () => {
        navigator.clipboard?.writeText(play.share).then(() => toast("Result copied"), () => toast("Couldn't copy"));
      } }, "Share result"));
      if (isDaily) {
        const cd = h("div", { class: "countdown" });
        const tick = () => { if (!cd.isConnected) return clearInterval(iv); cd.textContent = `Next daily in ${fmtCountdown(msToMidnight())}`; };
        const iv = setInterval(tick, 1000); tick();
        actions.append(h("button", { class: "btn primary", onclick: () => setMode("practice") }, "Practice round"));
        res.append(actions, cd);
      } else {
        actions.append(h("button", { class: "btn primary", onclick: () => start() }, "Play again"));
        res.append(actions);
      }
      stage.append(res);
      const top = stage.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.6) stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function start() {
      stage.innerHTML = "";
      renderSide();
      const today = stats(def.slug).today;
      if (mode === "daily" && today) { showResult(today, true); return; }
      const seed = mode === "daily" ? `${def.slug}:${dayKey()}` : `${def.slug}:p:${Date.now()}:${Math.random()}`;
      const ctx = {
        root: h("div", { class: "anim-in" }), mode, rng: rng(seed), day: dayKey(), dayNo: dayNumber(),
        color: meta.color, h, toast, fmtNum, blocks,
        finish(score, { summary = "", share = "" } = {}) {
          const header = `${meta.name} ${mode === "daily" ? "#" + dayNumber() : "(practice)"} · ${Math.round(score)}/100`;
          const play = record(def.slug, { score, mode, summary, share: share ? `${header}\n${share}` : header });
          renderSide();
          setTimeout(() => showResult(play || { score: Math.round(score), summary, share }, mode === "daily"), 650);
        },
      };
      stage.append(ctx.root);
      def.setup(ctx);
    }

    addEventListener("storage", (e) => { if (e.key === PREFIX + "game:" + def.slug) renderSide(); });
    start();
  }

  // ---------- Shared widgets ----------
  function css(text) { document.head.append(h("style", {}, text)); }
  function parseNum(str) {
    if (str == null) return NaN;
    let s = String(str).trim().toLowerCase().replace(/,/g, "").replace(/\s+/g, "");
    const mult = { k: 1e3, thousand: 1e3, m: 1e6, mn: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9, t: 1e12, trillion: 1e12, lakh: 1e5, crore: 1e7 };
    const m = s.match(/^([0-9]*\.?[0-9]+(?:e[+-]?\d+)?)([a-z]*)$/);
    if (!m) { const x = s.match(/^([0-9.]+)[x×\*]10\^?(-?\d+)$/); return x ? parseFloat(x[1]) * 10 ** +x[2] : NaN; }
    const n = parseFloat(m[1]);
    if (!m[2]) return n;
    return mult[m[2]] ? n * mult[m[2]] : NaN;
  }
  function sci(n) {
    if (n >= 1e15 || (n > 0 && n < 1e-3)) { const e = Math.floor(Math.log10(n)); return `${+(n / 10 ** e).toFixed(2)} × 10^${e}`; }
    return fmtNum(n);
  }
  // Log-scale slider + free text input, kept in sync.
  function logSlider({ lo, hi, unit = "", onChange }) {
    const L0 = Math.log10(lo), L1 = Math.log10(hi);
    let value = 10 ** ((L0 + L1) / 2);
    const range = h("input", { type: "range", min: 0, max: 1000, value: 500 });
    const text = h("input", { class: "input", inputmode: "decimal", placeholder: "Type a number, e.g. 3.5m or 2e9" });
    const readout = h("div", { class: "mono", style: "font-size:34px;font-weight:700;letter-spacing:-.02em;margin:6px 0 4px" });
    const scale = h("div", { class: "row faint mono", style: "justify-content:space-between;font-size:12px" }, h("span", {}, sci(lo)), h("span", {}, sci(hi)));
    const show = () => { readout.innerHTML = `${sci(value)} <span class="muted" style="font-size:16px;font-weight:600">${unit}</span>`; onChange && onChange(value); };
    range.addEventListener("input", () => { value = 10 ** (L0 + (L1 - L0) * (range.value / 1000)); const r = +value.toPrecision(2); value = r; text.value = ""; show(); });
    text.addEventListener("input", () => {
      const n = parseNum(text.value);
      if (n > 0) { value = n; range.value = Math.max(0, Math.min(1000, ((Math.log10(n) - L0) / (L1 - L0)) * 1000)); show(); }
    });
    show();
    const el = h("div", {}, readout, range, scale, h("div", { style: "margin-top:12px" }, text));
    return { el, get value() { return value; }, focus: () => text.focus(), disable() { range.disabled = text.disabled = true; } };
  }

  window.MG = { GAMES, css, parseNum, sci, logSlider, dayKey, dayNumber, addDays, msToMidnight, rng, read, write, gameData, record, stats, streakFrom,
    exportAll, importMerge, h, $, toast, modal, ring, spark, fmtNum, fmtCountdown, blocks, game, PREFIX };
})();

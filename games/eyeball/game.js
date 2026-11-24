/* Eyeball — quick visual estimation: counts, angles, proportions, ratios. */
(function () {
  const ROUNDS = 6, FLASH_MS = 2200;
  MG.css(`
  .eb-canvas{width:100%;max-width:520px;aspect-ratio:13/8;display:block;margin:0 auto 18px;border-radius:14px;background:var(--surface-2)}
  .eb-val{font:700 40px var(--mono);text-align:center;letter-spacing:-.02em}
  .eb-timer{height:4px;border-radius:2px;background:var(--accent);transform-origin:left;margin:0 auto 14px;max-width:520px}`);

  const TYPES = {
    dots: { prompt: "How many dots were there?", min: 10, max: 400, flash: true,
      make: (r) => { const n = r.int(25, 320), pts = []; while (pts.length < n) pts.push([+(r() * 0.94 + 0.03).toFixed(3), +(r() * 0.92 + 0.04).toFixed(3)]); return { answer: n, pts, size: r.int(3, 5) }; },
      draw: (g, d, W, H, col) => { g.fillStyle = col; d.pts.forEach(([x, y]) => { g.beginPath(); g.arc(x * W, y * H, d.size * 2, 0, 7); g.fill(); }); },
      score: (gu, a) => Math.max(0, 100 * (1 - Math.abs(Math.log(gu / a)) / 0.5)), fmt: (v) => `${Math.round(v)}` },
    angle: { prompt: "What's the angle between the two lines?", min: 0, max: 180,
      make: (r) => ({ answer: r.int(8, 172), rot: r() * 360 }),
      draw: (g, d, W, H, col) => { const cx = W / 2, cy = H / 2, L = H * 0.42, a0 = (d.rot * Math.PI) / 180, a1 = a0 + (d.answer * Math.PI) / 180;
        g.strokeStyle = col; g.lineWidth = 6; g.lineCap = "round"; [a0, a1].forEach((a) => { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + L * Math.cos(a), cy + L * Math.sin(a)); g.stroke(); });
        g.fillStyle = col; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill(); },
      score: (gu, a) => Math.max(0, 100 * (1 - Math.abs(gu - a) / 25)), fmt: (v) => `${Math.round(v)}°` },
    fill: { prompt: "What percentage of the shape is filled?", min: 0, max: 100,
      make: (r) => ({ answer: r.int(4, 96), shape: r.pick(["bar", "ring", "tilted"]), tilt: r.int(-35, 35) }),
      draw: (g, d, W, H, col, ink) => {
        g.lineWidth = 3; g.strokeStyle = ink; g.fillStyle = col;
        if (d.shape === "ring") { const cx = W / 2, cy = H / 2, r = H * 0.36, s = -Math.PI / 2 + d.tilt / 30;
          g.lineWidth = 34; g.globalAlpha = 0.15; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); g.globalAlpha = 1; g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, r, s, s + (d.answer / 100) * Math.PI * 2); g.stroke(); }
        else { g.save(); g.translate(W / 2, H / 2); if (d.shape === "tilted") g.rotate((d.tilt * Math.PI) / 180); const w = W * 0.7, hh = H * 0.22; g.fillRect(-w / 2, -hh / 2, (w * d.answer) / 100, hh); g.strokeRect(-w / 2, -hh / 2, w, hh); g.restore(); }
      },
      score: (gu, a) => Math.max(0, 100 * (1 - Math.abs(gu - a) / 18)), fmt: (v) => `${Math.round(v)}%` },
    ratio: { prompt: "How many times longer is the long line than the short one?", min: 1, max: 8, step: 0.1,
      make: (r) => ({ answer: Math.round((1.2 + r() * 5.6) * 10) / 10, vertical: r() < 0.5, off: r() }),
      draw: (g, d, W, H, col, ink) => {
        g.lineCap = "round"; g.lineWidth = 8; const long = d.vertical ? H * 0.8 : W * 0.75, short = long / d.answer;
        if (d.vertical) { g.strokeStyle = col; g.beginPath(); g.moveTo(W * 0.38, H * 0.1); g.lineTo(W * 0.38, H * 0.1 + long); g.stroke(); const y0 = H * 0.1 + (long - short) * d.off; g.strokeStyle = ink; g.beginPath(); g.moveTo(W * 0.62, y0); g.lineTo(W * 0.62, y0 + short); g.stroke(); }
        else { g.strokeStyle = col; g.beginPath(); g.moveTo(W * 0.12, H * 0.36); g.lineTo(W * 0.12 + long, H * 0.36); g.stroke(); const x0 = W * 0.12 + (long - short) * d.off; g.strokeStyle = ink; g.beginPath(); g.moveTo(x0, H * 0.64); g.lineTo(x0 + short, H * 0.64); g.stroke(); }
      },
      score: (gu, a) => Math.max(0, 100 * (1 - Math.abs(Math.log(gu / a)) / 0.4)), fmt: (v) => `${(+v).toFixed(1)}×` },
  };

  MG.define({
    slug: "eyeball",
    howTo: `<p>Six quick rounds that test how well you judge things by eye:</p>
    <ul><li><b>Dots</b>: a cloud flashes for ${FLASH_MS / 1000} seconds. How many were there? Leaving mid-flash won't let you see it again.</li>
    <li><b>Angle</b>: estimate the angle between two lines.</li><li><b>Fill</b>: what share of the bar or ring is filled?</li>
    <li><b>Ratio</b>: how many times longer is one line than the other?</li></ul><p>Every picture is newly generated, so none repeats.</p>`,
    progress: (s) => `Round ${s.ans.length + 1} of ${s.rounds.length}`,
    partial: (s) => s.ans.reduce((a, b) => a + b.s, 0) / s.rounds.length,
    init(ctx) {
      const r = ctx.rng, sig = "set:" + ctx.rng.int(0, 2 ** 31);
      if (ctx.isSeen(sig)) return null;
      ctx.markSeen([sig]);
      const order = r.shuffle(["dots", "angle", "fill", "ratio", "dots", r.pick(["angle", "fill", "ratio"])]);
      return { rounds: order.map((t) => ({ t, d: TYPES[t].make(r) })), ans: [], flashed: [] };
    },
    render(ctx, st) {
      const { root, h, color } = ctx;
      const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink-2").trim() || "#555";
      function round() {
        const i = st.ans.length, { t, d } = st.rounds[i], T = TYPES[t];
        root.innerHTML = "";
        const cv = h("canvas", { class: "eb-canvas" }), timer = h("div", { class: "eb-timer" });
        const range = h("input", { type: "range", min: T.min, max: T.max, step: T.step || 1, value: (T.min + T.max) / 2, "aria-label": "Your estimate" });
        const val = h("div", { class: "eb-val" });
        const show = () => (val.textContent = T.fmt(range.value));
        range.addEventListener("input", show); show();
        const fb = h("div", { class: "feedback" });
        const btn = h("button", { class: "btn primary lg", onclick: submit }, "Lock it in");
        range.addEventListener("keydown", (e) => e.key === "Enter" && submit());
        root.append(MG.roundTop(i, st.rounds.length, h("span", { class: "pill" }, t)), h("p", { class: "big-q", style: "margin-bottom:14px" }, T.prompt), T.flash ? timer : "", cv, val, range,
          h("div", { class: "row", style: "margin-top:16px" }, btn), fb);
        const dpr = devicePixelRatio || 1, W = cv.clientWidth || 520, H = W * (8 / 13);
        cv.width = W * dpr; cv.height = H * dpr;
        const g = cv.getContext("2d"); g.scale(dpr, dpr);
        const gone = () => { g.clearRect(0, 0, W, H); g.fillStyle = ink; g.font = "600 15px system-ui"; g.textAlign = "center"; g.globalAlpha = 0.6; g.fillText("Gone. How many were there?", W / 2, H / 2); g.globalAlpha = 1; };
        if (T.flash && st.flashed.includes(i)) { gone(); timer.style.transform = "scaleX(0)"; }
        else {
          T.draw(g, d, W, H, color, ink);
          if (T.flash) {
            st.flashed.push(i); ctx.save();
            timer.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: FLASH_MS, fill: "forwards" });
            setTimeout(() => cv.isConnected && !locked && gone(), FLASH_MS);
          }
        }
        range.focus({ preventScroll: true });
        let locked = false;
        function submit() {
          if (locked) return; locked = true; range.disabled = true;
          const gu = Math.max(+range.value, t === "ratio" ? 1 : 0.0001), s = Math.round(T.score(gu, d.answer));
          st.ans.push({ g: +range.value, s }); ctx.save();
          if (T.flash) { g.clearRect(0, 0, W, H); T.draw(g, d, W, H, color, ink); }
          fb.innerHTML = `<div class="pop row" style="gap:18px"><span>Actual <b class="mono" style="font-size:22px">${T.fmt(d.answer)}</b></span><span class="muted">You said ${T.fmt(range.value)}</span><span class="gain">+${s}</span></div>`;
          const last = st.ans.length >= st.rounds.length;
          const next = h("button", { class: "btn primary lg", onclick: () => (last ? end() : round()) }, last ? "See result" : "Next");
          btn.replaceWith(next); next.focus();
        }
      }
      const end = () => { const sc = st.ans.map((a) => a.s); ctx.finish(sc.reduce((a, b) => a + b, 0) / st.rounds.length, { summary: st.rounds.map((r, k) => `${r.t}: ${sc[k]}`).join(" · "), share: MG.blocks(sc) }); };
      st.ans.length >= st.rounds.length ? end() : round();
    },
  });
})();

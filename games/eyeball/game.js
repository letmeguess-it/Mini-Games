/* Eyeball — quick visual estimation: counts, angles, proportions, ratios. */
const ROUNDS = 6, FLASH_MS = 2200;

MG.css(`
.eb-canvas{width:100%;max-width:520px;aspect-ratio:13/8;display:block;margin:0 auto 18px;border-radius:14px;background:var(--surface-2)}
.eb-val{font:700 40px var(--mono);text-align:center;letter-spacing:-.02em}
.eb-timer{height:4px;border-radius:2px;background:var(--accent);transform-origin:left;margin:0 auto 14px;max-width:520px}
`);

const TYPES = {
  dots: {
    prompt: "How many dots were there?", min: 10, max: 400, unit: "dots", flash: true,
    make: (rng) => { const n = rng.int(25, 320); const pts = []; while (pts.length < n) pts.push([rng() * 0.94 + 0.03, rng() * 0.92 + 0.04]); return { answer: n, pts, size: rng.int(3, 5) }; },
    draw: (g, d, W, H, col) => { g.fillStyle = col; d.pts.forEach(([x, y]) => { g.beginPath(); g.arc(x * W, y * H, d.size * 2, 0, 7); g.fill(); }); },
    score: (gu, a) => Math.max(0, 100 * (1 - Math.abs(Math.log(gu / a)) / 0.5)),
    fmt: (v) => `${Math.round(v)}`,
  },
  angle: {
    prompt: "What's the angle between the two lines?", min: 0, max: 180, unit: "°",
    make: (rng) => ({ answer: rng.int(8, 172), rot: rng() * 360 }),
    draw: (g, d, W, H, col) => {
      const cx = W / 2, cy = H / 2, L = H * 0.42, a0 = (d.rot * Math.PI) / 180, a1 = a0 + (d.answer * Math.PI) / 180;
      g.strokeStyle = col; g.lineWidth = 6; g.lineCap = "round";
      [a0, a1].forEach((a) => { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + L * Math.cos(a), cy + L * Math.sin(a)); g.stroke(); });
      g.fillStyle = col; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill();
    },
    score: (gu, a) => Math.max(0, 100 * (1 - Math.abs(gu - a) / 25)),
    fmt: (v) => `${Math.round(v)}°`,
  },
  fill: {
    prompt: "What percentage of the shape is filled?", min: 0, max: 100, unit: "%",
    make: (rng) => ({ answer: rng.int(4, 96), shape: rng.pick(["bar", "ring", "tilted"]), tilt: rng.int(-35, 35) }),
    draw: (g, d, W, H, col, ink) => {
      g.lineWidth = 3; g.strokeStyle = ink; g.fillStyle = col;
      if (d.shape === "ring") {
        const cx = W / 2, cy = H / 2, r = H * 0.36, s = -Math.PI / 2 + d.tilt / 30;
        g.lineWidth = 34; g.strokeStyle = ink; g.globalAlpha = 0.15; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); g.globalAlpha = 1;
        g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, r, s, s + (d.answer / 100) * Math.PI * 2); g.stroke();
      } else {
        g.save(); g.translate(W / 2, H / 2); if (d.shape === "tilted") g.rotate((d.tilt * Math.PI) / 180);
        const w = W * 0.7, hh = H * 0.22;
        g.fillRect(-w / 2, -hh / 2, (w * d.answer) / 100, hh); g.strokeRect(-w / 2, -hh / 2, w, hh); g.restore();
      }
    },
    score: (gu, a) => Math.max(0, 100 * (1 - Math.abs(gu - a) / 18)),
    fmt: (v) => `${Math.round(v)}%`,
  },
  ratio: {
    prompt: "How many times longer is the long line than the short one?", min: 1, max: 8, unit: "×", step: 0.1,
    make: (rng) => { const r = Math.round((1.2 + rng() * 5.6) * 10) / 10; return { answer: r, vertical: rng() < 0.5, off: rng() }; },
    draw: (g, d, W, H, col, ink) => {
      g.lineCap = "round"; g.lineWidth = 8;
      const long = d.vertical ? H * 0.8 : W * 0.75, short = long / d.answer;
      if (d.vertical) {
        g.strokeStyle = col; g.beginPath(); g.moveTo(W * 0.38, H * 0.1); g.lineTo(W * 0.38, H * 0.1 + long); g.stroke();
        const y0 = H * 0.1 + (long - short) * d.off; g.strokeStyle = ink; g.beginPath(); g.moveTo(W * 0.62, y0); g.lineTo(W * 0.62, y0 + short); g.stroke();
      } else {
        g.strokeStyle = col; g.beginPath(); g.moveTo(W * 0.12, H * 0.36); g.lineTo(W * 0.12 + long, H * 0.36); g.stroke();
        const x0 = W * 0.12 + (long - short) * d.off; g.strokeStyle = ink; g.beginPath(); g.moveTo(x0, H * 0.64); g.lineTo(x0 + short, H * 0.64); g.stroke();
      }
    },
    score: (gu, a) => Math.max(0, 100 * (1 - Math.abs(Math.log(gu / a)) / 0.4)),
    fmt: (v) => `${(+v).toFixed(1)}×`,
  },
};

MG.game({
  slug: "eyeball",
  howTo: `<p>Six quick rounds that test how well you judge things by eye:</p>
  <ul><li><b>Dots</b>: a cloud flashes for ${FLASH_MS / 1000} seconds. How many were there?</li>
  <li><b>Angle</b>: estimate the angle between two lines.</li>
  <li><b>Fill</b>: what share of the bar or ring is filled?</li>
  <li><b>Ratio</b>: how many times longer is one line than the other?</li></ul>
  <p>No rulers, and no zooming in.</p>`,
  setup(ctx) {
    const { root, rng, h, color } = ctx;
    const order = rng.shuffle(["dots", "angle", "fill", "ratio", "dots", rng.pick(["angle", "fill", "ratio"])]);
    const rounds = order.map((t) => ({ t, d: TYPES[t].make(rng) }));
    const scores = [];
    let i = 0;
    const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink-2").trim() || "#555";

    function round() {
      const { t, d } = rounds[i], T = TYPES[t];
      root.innerHTML = "";
      const cv = h("canvas", { class: "eb-canvas" });
      const timer = h("div", { class: "eb-timer" });
      const range = h("input", { type: "range", min: T.min, max: T.max, step: T.step || 1, value: (T.min + T.max) / 2 });
      const val = h("div", { class: "eb-val" });
      const show = () => (val.textContent = T.fmt(range.value));
      range.addEventListener("input", show); show();
      const fb = h("div", { class: "feedback" });
      const btn = h("button", { class: "btn primary lg", onclick: submit }, "Lock it in");
      range.addEventListener("keydown", (e) => e.key === "Enter" && submit());
      root.append(
        h("div", { class: "stage-top" }, h("div", { class: "dots" }, ...rounds.map((_, k) => h("i", { class: k < i ? "on" : k === i ? "cur" : "" }))), h("span", { class: "pill" }, t)),
        h("p", { class: "big-q", style: "margin-bottom:14px" }, T.prompt), T.flash ? timer : "", cv, val, range,
        h("div", { class: "row", style: "margin-top:16px" }, btn), fb);

      const dpr = devicePixelRatio || 1, W = cv.clientWidth || 520, H = W * (8 / 13);
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext("2d"); g.scale(dpr, dpr);
      T.draw(g, d, W, H, color, ink);
      if (T.flash) {
        timer.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: FLASH_MS, fill: "forwards" });
        setTimeout(() => { if (!cv.isConnected) return; g.clearRect(0, 0, W, H); g.fillStyle = ink; g.font = "600 15px system-ui"; g.textAlign = "center"; g.globalAlpha = 0.6; g.fillText("Gone. How many?", W / 2, H / 2); g.globalAlpha = 1; }, FLASH_MS);
      }
      range.focus();
      let locked = false;
      function submit() {
        if (locked) return; locked = true; range.disabled = true;
        const gu = Math.max(+range.value, t === "ratio" ? 1 : 0.0001);
        const s = Math.round(T.score(gu, d.answer));
        scores.push(s);
        if (T.flash) { g.clearRect(0, 0, W, H); T.draw(g, d, W, H, color, ink); }
        fb.innerHTML = `<div class="pop row" style="gap:18px"><span>Actual <b class="mono" style="font-size:22px">${T.fmt(d.answer)}</b></span><span class="muted">You said ${T.fmt(range.value)}</span><span class="mono" style="color:var(--accent);font-size:22px">+${s}</span></div>`;
        const next = h("button", { class: "btn primary lg", onclick: () => { i++; i < ROUNDS ? round() : end(); } }, i + 1 < ROUNDS ? "Next" : "See result");
        btn.replaceWith(next); next.focus();
      }
    }
    function end() {
      ctx.finish(scores.reduce((a, b) => a + b, 0) / ROUNDS, { summary: rounds.map((r, k) => `${r.t}: ${scores[k]}`).join(" · "), share: MG.blocks(scores) });
    }
    round();
  },
});

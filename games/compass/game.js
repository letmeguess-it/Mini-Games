/* Compass — guess the bearing and distance between two cities. */
const CITIES = [
  ["London", 51.507, -0.128], ["Paris", 48.857, 2.352], ["New York", 40.713, -74.006], ["Tokyo", 35.676, 139.65],
  ["Sydney", -33.869, 151.209], ["Cairo", 30.044, 31.236], ["Rio de Janeiro", -22.907, -43.173], ["Mumbai", 19.076, 72.878],
  ["Delhi", 28.614, 77.209], ["Beijing", 39.904, 116.407], ["Moscow", 55.756, 37.617], ["Cape Town", -33.925, 18.424],
  ["Los Angeles", 34.052, -118.244], ["Mexico City", 19.433, -99.133], ["Buenos Aires", -34.604, -58.382], ["Singapore", 1.352, 103.82],
  ["Dubai", 25.205, 55.271], ["Istanbul", 41.008, 28.978], ["Nairobi", -1.292, 36.822], ["Lagos", 6.524, 3.379],
  ["Reykjavík", 64.147, -21.942], ["Anchorage", 61.218, -149.9], ["Honolulu", 21.307, -157.858], ["Lima", -12.046, -77.043],
  ["Toronto", 43.653, -79.383], ["Bangkok", 13.756, 100.502], ["Jakarta", -6.208, 106.846], ["Seoul", 37.567, 126.978],
  ["Auckland", -36.848, 174.763], ["Santiago", -33.449, -70.669], ["Madrid", 40.417, -3.704], ["Rome", 41.903, 12.496],
  ["Berlin", 52.52, 13.405], ["Stockholm", 59.329, 18.069], ["Tehran", 35.689, 51.389], ["Karachi", 24.861, 67.01],
  ["Kolkata", 22.573, 88.364], ["Chennai", 13.083, 80.271], ["Perth", -31.95, 115.86], ["Vancouver", 49.283, -123.121],
  ["Havana", 23.113, -82.366], ["Bogotá", 4.711, -74.072], ["Addis Ababa", 9.03, 38.74], ["Kathmandu", 27.717, 85.324],
  ["Manila", 14.6, 120.984], ["Lisbon", 38.722, -9.139], ["Athens", 37.984, 23.728], ["Casablanca", 33.573, -7.59],
  ["Ulaanbaatar", 47.886, 106.906], ["Bengaluru", 12.972, 77.594], ["Hong Kong", 22.319, 114.169], ["Johannesburg", -26.204, 28.047],
].map(([name, lat, lon]) => ({ name, lat, lon }));

const R = 6371, rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
function distance(a, b) {
  const dφ = rad(b.lat - a.lat), dλ = rad(b.lon - a.lon);
  const x = Math.sin(dφ / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function bearing(a, b) {
  const φ1 = rad(a.lat), φ2 = rad(b.lat), dλ = rad(b.lon - a.lon);
  const y = Math.sin(dλ) * Math.cos(φ2), x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}
function greatCircle(a, b, n = 64) {
  const v = (p) => [Math.cos(rad(p.lat)) * Math.cos(rad(p.lon)), Math.cos(rad(p.lat)) * Math.sin(rad(p.lon)), Math.sin(rad(p.lat))];
  const A = v(a), B = v(b), d = Math.acos(Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s1 = Math.sin((1 - t) * d) / Math.sin(d), s2 = Math.sin(t * d) / Math.sin(d);
    const p = [0, 1, 2].map((k) => s1 * A[k] + s2 * B[k]);
    out.push({ lat: deg(Math.atan2(p[2], Math.hypot(p[0], p[1]))), lon: deg(Math.atan2(p[1], p[0])) });
  }
  return out;
}
const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const point = (b) => COMPASS[Math.round(b / 22.5) % 16];
const ROUNDS = 4;

MG.css(`
.cmp-wrap{display:grid;grid-template-columns:260px 1fr;gap:28px;align-items:center}
@media(max-width:640px){.cmp-wrap{grid-template-columns:1fr;justify-items:center}}
.dial{width:260px;height:260px;touch-action:none;cursor:grab;user-select:none}
.dial:active{cursor:grabbing}
.dial:focus{outline:none}.dial:focus-visible .dial-face{stroke:var(--accent)}
.route{font-size:22px;font-weight:700;letter-spacing:-.01em;margin:0 0 4px}
.route span{color:var(--ink-3);font-weight:500;margin:0 8px}
.mapbox{margin-top:18px;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:var(--surface-2)}
`);

MG.game({
  slug: "compass",
  howTo: `<p>You stand in the first city. Turn the needle to point toward the second city, then estimate how far away it is.</p>
  <ul><li>The direction is the <b>initial heading of the shortest route</b> over the globe (a great circle). That's why New York to Tokyo starts out heading north-west, not west.</li>
  <li>Drag the dial, or focus it and use the arrow keys (Shift for 10°).</li>
  <li>Each round: 60 points for direction (zero at 90° off) and 40 for distance (zero at 4× off).</li></ul>`,
  setup(ctx) {
    const { root, rng, h } = ctx;
    const rounds = [];
    while (rounds.length < ROUNDS) {
      const [a, b] = rng.sample(CITIES, 2);
      const d = distance(a, b);
      if (d > 700 && !rounds.some((r) => r.a === a || r.b === b)) rounds.push({ a, b, d, br: bearing(a, b) });
    }
    const scores = [];
    let i = 0;

    function round() {
      const r = rounds[i];
      let angle = rng.int(0, 359);
      root.innerHTML = "";
      const svgNS = "http://www.w3.org/2000/svg";
      const dial = document.createElementNS(svgNS, "svg");
      dial.setAttribute("viewBox", "0 0 260 260"); dial.setAttribute("class", "dial"); dial.setAttribute("tabindex", "0");
      dial.setAttribute("role", "slider"); dial.setAttribute("aria-label", "Bearing");
      let ticks = "";
      for (let t = 0; t < 360; t += 5) {
        const big = t % 45 === 0, L = big ? 14 : t % 15 === 0 ? 8 : 4;
        ticks += `<line x1="130" y1="${14}" x2="130" y2="${14 + L}" stroke="var(--ink-${big ? 2 : 3})" stroke-width="${big ? 2 : 1}" transform="rotate(${t} 130 130)"/>`;
      }
      dial.innerHTML = `<circle class="dial-face" cx="130" cy="130" r="122" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/>${ticks}
        ${["N", "E", "S", "W"].map((c, k) => `<text x="${130 + 86 * Math.sin(k * Math.PI / 2)}" y="${130 - 86 * Math.cos(k * Math.PI / 2)}" text-anchor="middle" dominant-baseline="central" font-weight="700" font-size="15" fill="var(--ink${c === "N" ? "" : "-2"})">${c}</text>`).join("")}
        <g id="truth" opacity="0"></g>
        <g id="needle"><path d="M130 30 L139 130 L130 142 L121 130Z" fill="var(--accent)"/><path d="M130 230 L137 130 L123 130Z" fill="var(--ink-3)" opacity=".35"/></g>
        <circle cx="130" cy="130" r="7" fill="var(--ink)"/>`;
      const needle = dial.querySelector("#needle");
      const readout = h("div", { class: "mono", style: "font-size:30px;font-weight:700" });
      const set = (a) => { angle = ((Math.round(a) % 360) + 360) % 360; needle.setAttribute("transform", `rotate(${angle} 130 130)`); readout.innerHTML = `${angle}° <span class="muted" style="font-size:16px">${point(angle)}</span>`; };
      set(angle);
      let locked = false;
      const fromEvent = (e) => { const b = dial.getBoundingClientRect(); set(deg(Math.atan2(e.clientX - b.left - b.width / 2, -(e.clientY - b.top - b.height / 2)))); };
      dial.addEventListener("pointerdown", (e) => { if (locked) return; dial.setPointerCapture(e.pointerId); fromEvent(e); });
      dial.addEventListener("pointermove", (e) => { if (!locked && dial.hasPointerCapture(e.pointerId)) fromEvent(e); });
      dial.addEventListener("keydown", (e) => {
        if (locked) return;
        const step = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") { set(angle + step); e.preventDefault(); }
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { set(angle - step); e.preventDefault(); }
        if (e.key === "Enter") submit();
      });

      const dist = MG.logSlider({ lo: 300, hi: 20000, unit: "km" });
      const fb = h("div", { class: "feedback" });
      const btn = h("button", { class: "btn primary lg", onclick: submit }, "Lock it in");
      root.append(
        h("div", { class: "stage-top" }, h("div", { class: "dots" }, ...rounds.map((_, k) => h("i", { class: k < i ? "on" : k === i ? "cur" : "" }))), h("span", { class: "faint mono" }, `${i + 1} / ${ROUNDS}`)),
        h("p", { class: "route" }, r.a.name, h("span", {}, "→"), r.b.name),
        h("p", { class: "muted", style: "margin:0 0 20px" }, `Which way, and how far?`),
        h("div", { class: "cmp-wrap" }, h("div", { class: "center" }, dial, readout), h("div", {}, h("div", { class: "faint", style: "font-size:12px;text-transform:uppercase;letter-spacing:.08em" }, "Distance"), dist.el)),
        h("div", { class: "row", style: "margin-top:20px" }, btn), fb);

      function submit() {
        if (locked) return; locked = true;
        dist.disable();
        let err = Math.abs(angle - r.br); err = Math.min(err, 360 - err);
        const bs = Math.max(0, 1 - err / 90) * 60;
        const ds = Math.max(0, 1 - Math.abs(Math.log2(dist.value / r.d)) / 2) * 40;
        const s = Math.round(bs + ds);
        scores.push(s);
        const truth = dial.querySelector("#truth");
        truth.innerHTML = `<line x1="130" y1="130" x2="130" y2="22" stroke="var(--good)" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 7"/>`;
        truth.setAttribute("transform", `rotate(${r.br} 130 130)`);
        truth.style.transition = "opacity .5s"; requestAnimationFrame(() => truth.setAttribute("opacity", "1"));
        fb.innerHTML = `<div class="pop row" style="gap:18px">
          <span>Heading <b class="mono">${Math.round(r.br)}° ${point(r.br)}</b> <span class="muted">(${Math.round(err)}° off)</span></span>
          <span>Distance <b class="mono">${Math.round(r.d).toLocaleString()} km</b></span>
          <span class="mono" style="color:var(--accent);font-size:22px">+${s}</span></div>`;
        fb.append(mapOf(r));
        const next = h("button", { class: "btn primary lg", onclick: () => { i++; i < ROUNDS ? round() : end(); } }, i + 1 < ROUNDS ? "Next" : "See result");
        btn.replaceWith(next); next.focus();
      }
    }

    function mapOf(r) {
      const W = 720, H = 360, X = (lon) => ((lon + 180) / 360) * W, Y = (lat) => ((90 - lat) / 180) * H;
      let grid = "";
      for (let lon = -150; lon <= 150; lon += 30) grid += `<line x1="${X(lon)}" y1="0" x2="${X(lon)}" y2="${H}" stroke="var(--line)"/>`;
      for (let lat = -60; lat <= 60; lat += 30) grid += `<line x1="0" y1="${Y(lat)}" x2="${W}" y2="${Y(lat)}" stroke="var(--line)" ${lat === 0 ? 'stroke-width="2"' : ""}/>`;
      const pts = greatCircle(r.a, r.b);
      let path = "", prev = null;
      pts.forEach((p) => { const jump = prev && Math.abs(p.lon - prev.lon) > 180; path += `${!prev || jump ? "M" : "L"}${X(p.lon).toFixed(1)} ${Y(p.lat).toFixed(1)} `; prev = p; });
      const others = CITIES.map((c) => `<circle cx="${X(c.lon)}" cy="${Y(c.lat)}" r="2" fill="var(--ink-3)" opacity=".5"/>`).join("");
      const label = (c, col) => `<circle cx="${X(c.lon)}" cy="${Y(c.lat)}" r="6" fill="${col}" stroke="var(--surface)" stroke-width="2"/>
        <text x="${X(c.lon) + 9}" y="${Y(c.lat) - 8}" font-size="14" font-weight="700" fill="var(--ink)">${c.name}</text>`;
      const box = document.createElement("div"); box.className = "mapbox anim-in";
      box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${grid}${others}
        <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 6"/>
        ${label(r.a, "var(--ink)")}${label(r.b, "var(--accent)")}</svg>`;
      return box;
    }

    function end() {
      ctx.finish(scores.reduce((a, b) => a + b, 0) / ROUNDS, {
        summary: rounds.map((r, k) => `${r.a.name} → ${r.b.name}: ${scores[k]}`).join("<br>"),
        share: MG.blocks(scores),
      });
    }
    round();
  },
});

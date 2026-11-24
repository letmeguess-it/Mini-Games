/* Compass — guess the bearing and distance between two cities. */
(function () {
  // Approximate geographic centres of countries and well-known islands.
  const PLACES = `Afghanistan 33.94 67.71|Albania 41.15 20.17|Algeria 28.03 1.66|Angola -11.2 17.87|Argentina -38.42 -63.62|Armenia 40.07 45.04|Australia -25.27 133.78|Austria 47.52 14.55
|Azerbaijan 40.14 47.58|Bahamas 25.03 -77.4|Bahrain 25.93 50.64|Bangladesh 23.68 90.36|Barbados 13.19 -59.54|Belarus 53.71 27.95|Belgium 50.5 4.47|Belize 17.19 -88.5|Benin 9.31 2.32
|Bhutan 27.51 90.43|Bolivia -16.29 -63.59|Bosnia and Herzegovina 43.92 17.68|Botswana -22.33 24.68|Brazil -14.24 -51.93|Brunei 4.54 114.73|Bulgaria 42.73 25.49|Burkina Faso 12.24 -1.56
|Burundi -3.37 29.92|Cambodia 12.57 104.99|Cameroon 7.37 12.35|Canada 56.13 -106.35|Cape Verde 16 -24.01|Central African Republic 6.61 20.94|Chad 15.45 18.73|Chile -35.68 -71.54
|China 35.86 104.2|Colombia 4.57 -74.3|Comoros -11.88 43.87|Republic of the Congo -0.23 15.83|DR Congo -4.04 21.76|Costa Rica 9.75 -83.75|Côte d'Ivoire 7.54 -5.55|Croatia 45.1 15.2
|Cuba 21.52 -77.78|Cyprus 35.13 33.43|Czechia 49.82 15.47|Denmark 56.26 9.5|Djibouti 11.83 42.59|Dominican Republic 18.74 -70.16|Ecuador -1.83 -78.18|Egypt 26.82 30.8
|El Salvador 13.79 -88.9|Equatorial Guinea 1.65 10.27|Eritrea 15.18 39.78|Estonia 58.6 25.01|Eswatini -26.52 31.47|Ethiopia 9.15 40.49|Fiji -16.58 179.41|Finland 61.92 25.75
|France 46.23 2.21|Gabon -0.8 11.61|Gambia 13.44 -15.31|Georgia 42.32 43.36|Germany 51.17 10.45|Ghana 7.95 -1.02|Greece 39.07 21.82|Guatemala 15.78 -90.23|Guinea 9.95 -9.7
|Guinea-Bissau 11.8 -15.18|Guyana 4.86 -58.93|Haiti 18.97 -72.29|Honduras 15.2 -86.24|Hungary 47.16 19.5|Iceland 64.96 -19.02|India 20.59 78.96|Indonesia -0.79 113.92|Iran 32.43 53.69
|Iraq 33.22 43.68|Ireland 53.41 -8.24|Israel 31.05 34.85|Italy 41.87 12.57|Jamaica 18.11 -77.3|Japan 36.2 138.25|Jordan 30.59 36.24|Kazakhstan 48.02 66.92|Kenya -0.02 37.91
|Kosovo 42.6 20.9|Kuwait 29.31 47.48|Kyrgyzstan 41.2 74.77|Laos 19.86 102.5|Latvia 56.88 24.6|Lebanon 33.85 35.86|Lesotho -29.61 28.23|Liberia 6.43 -9.43|Libya 26.34 17.23
|Lithuania 55.17 23.88|Luxembourg 49.82 6.13|Madagascar -18.77 46.87|Malawi -13.25 34.3|Malaysia 4.21 101.98|Maldives 3.2 73.22|Mali 17.57 -4|Malta 35.94 14.38|Marshall Islands 7.13 171.18
|Mauritania 21.01 -10.94|Mauritius -20.35 57.55|Mexico 23.63 -102.55|Micronesia 7.43 150.55|Moldova 47.41 28.37|Mongolia 46.86 103.85|Montenegro 42.71 19.37|Morocco 31.79 -7.09
|Mozambique -18.67 35.53|Myanmar 21.91 95.96|Namibia -22.96 18.49|Nauru -0.52 166.93|Nepal 28.39 84.12|Netherlands 52.13 5.29|New Zealand -40.9 174.89|Nicaragua 12.87 -85.21
|Niger 17.61 8.08|Nigeria 9.08 8.68|North Korea 40.34 127.51|North Macedonia 41.61 21.75|Norway 60.47 8.47|Oman 21.51 55.92|Pakistan 30.38 69.35|Palau 7.51 134.58|Palestine 31.95 35.23
|Panama 8.54 -80.78|Papua New Guinea -6.31 143.96|Paraguay -23.44 -58.44|Peru -9.19 -75.02|Philippines 12.88 121.77|Poland 51.92 19.15|Portugal 39.4 -8.22|Qatar 25.35 51.18
|Romania 45.94 24.97|Russia 61.52 105.32|Rwanda -1.94 29.87|Samoa -13.76 -172.1|São Tomé and Príncipe 0.19 6.61|Saudi Arabia 23.89 45.08|Senegal 14.5 -14.45|Serbia 44.02 21.01
|Seychelles -4.68 55.49|Sierra Leone 8.46 -11.78|Singapore 1.35 103.82|Slovakia 48.67 19.7|Slovenia 46.15 14.99|Solomon Islands -9.65 160.16|Somalia 5.15 46.2|South Africa -30.56 22.94
|South Korea 35.91 127.77|South Sudan 7.86 29.69|Spain 40.46 -3.75|Sri Lanka 7.87 80.77|Sudan 12.86 30.22|Suriname 3.92 -56.03|Sweden 60.13 18.64|Switzerland 46.82 8.23|Syria 34.8 38.1
|Taiwan 23.7 120.96|Tajikistan 38.86 71.28|Tanzania -6.37 34.89|Thailand 15.87 100.99|Timor-Leste -8.87 125.73|Togo 8.62 0.82|Tonga -21.18 -175.2|Trinidad and Tobago 10.69 -61.22
|Tunisia 33.89 9.54|Turkey 38.96 35.24|Turkmenistan 38.97 59.56|Tuvalu -7.11 177.65|Uganda 1.37 32.29|Ukraine 48.38 31.17|United Arab Emirates 23.42 53.85|United Kingdom 55.38 -3.44
|United States 37.09 -95.71|Uruguay -32.52 -55.77|Uzbekistan 41.38 64.59|Vanuatu -15.38 166.96|Venezuela 6.42 -66.59|Vietnam 14.06 108.28|Yemen 15.55 48.52|Zambia -13.13 27.85|Zimbabwe -19.02 29.15
|Greenland 72 -40|Borneo 0.9 114|Sumatra -0.6 101.3|Java -7.5 110|New Guinea -5.5 141|Tasmania -42 146.6|Sicily 37.6 14|Sardinia 40 9|Corsica 42.1 9.1|Crete 35.2 24.9
|Hawaii (Big Island) 19.6 -155.5|Galápagos Islands -0.8 -91|Easter Island -27.1 -109.4|Bermuda 32.3 -64.8|Canary Islands 28.3 -16.6|Azores 38.6 -28|Svalbard 78.2 15.6|Baffin Island 69 -72
|Newfoundland 49 -56|Sakhalin 50.7 142.8|Hokkaido 43.2 142.9|Andaman Islands 12 92.8|Lakshadweep 10.5 72.6|Zanzibar -6.1 39.3|Socotra 12.5 53.9|Falkland Islands -51.8 -59.5
|South Georgia -54.3 -36.5|Tahiti -17.65 -149.4|Guam 13.44 144.79|Puerto Rico 18.2 -66.5|Faroe Islands 62 -6.9|Tierra del Fuego -54 -68|Vancouver Island 49.6 -125.5|Bali -8.4 115.2
|Mindanao 7.5 125|Luzon 16 121|Honshu 36 138|Isle of Man 54.2 -4.5|Réunion -21.1 55.5|New Caledonia -21.3 165.5|Kamchatka 56 159`
    .split("|").map((s) => s.trim()).filter(Boolean).map((s) => { const p = s.split(" "); const lon = +p.pop(), lat = +p.pop(); return { name: p.join(" "), lat, lon }; });
  const R = 6371, rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  function distance(a, b) { const dφ = rad(b.lat - a.lat), dλ = rad(b.lon - a.lon); const x = Math.sin(dφ / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dλ / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
  function bearing(a, b) { const φ1 = rad(a.lat), φ2 = rad(b.lat), dλ = rad(b.lon - a.lon); return (deg(Math.atan2(Math.sin(dλ) * Math.cos(φ2), Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ))) + 360) % 360; }
  function greatCircle(a, b, n = 64) {
    const v = (p) => [Math.cos(rad(p.lat)) * Math.cos(rad(p.lon)), Math.cos(rad(p.lat)) * Math.sin(rad(p.lon)), Math.sin(rad(p.lat))];
    const A = v(a), B = v(b), d = Math.acos(Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])), out = [];
    for (let i = 0; i <= n; i++) { const t = i / n, s1 = Math.sin((1 - t) * d) / Math.sin(d), s2 = Math.sin(t * d) / Math.sin(d); const p = [0, 1, 2].map((k) => s1 * A[k] + s2 * B[k]); out.push({ lat: deg(Math.atan2(p[2], Math.hypot(p[0], p[1]))), lon: deg(Math.atan2(p[1], p[0])) }); }
    return out;
  }
  const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const point = (b) => COMPASS[Math.round(b / 22.5) % 16];
  const pairId = (a, b) => `${a.name}>${b.name}`; // A→B and B→A are different questions (different heading)
  const ROUNDS = 4;

  MG.css(`
  .cmp-wrap{display:grid;grid-template-columns:260px 1fr;gap:28px;align-items:center}
  @media(max-width:700px){.cmp-wrap{grid-template-columns:1fr;justify-items:center}}
  .dial{width:260px;height:260px;touch-action:none;cursor:grab;user-select:none}.dial:active{cursor:grabbing}.dial:focus{outline:none}.dial:focus-visible .dial-face{stroke:var(--accent)}
  .route{font-size:22px;font-weight:700;letter-spacing:-.01em;margin:0 0 4px}.route span{color:var(--ink-3);font-weight:500;margin:0 8px}
  .mapbox{margin-top:18px;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:var(--surface-2)}
  .cmp-label{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3)}`);

  MG.define({
    slug: "compass",
    howTo: `<p>You stand at the centre of the first country or island. Turn the needle to point toward the centre of the second one, then estimate how far away it is.</p>
    <ul><li>The direction is the <b>initial heading of the shortest route</b> over the globe (a great circle). That's why the shortest route from India to the United States starts out heading almost due north.</li>
    <li>Drag the dial, or focus it and use the arrow keys (Shift for 10°).</li>
    <li>Each round: 60 points for direction (zero at 90° off) and 40 for distance (zero at 4× off).</li>
    <li>Places are countries and well-known islands, measured centre to centre. You'll never get the same pair twice.</li></ul>`,
    progress: (s) => `Round ${s.ans.length + 1} of ${s.qs.length}`,
    partial: (s) => s.ans.reduce((a, b) => a + b.s, 0) / s.qs.length,
    init(ctx) {
      const r = ctx.rng, seen = ctx.seen(), used = new Set(), qs = [];
      for (let t = 0; t < 40000 && qs.length < ROUNDS; t++) {
        const [a, b] = r.sample(PLACES, 2), id = pairId(a, b);
        if (used.has(a.name) || used.has(b.name) || seen.has(id)) continue;
        const d = distance(a, b); if (d < 700) continue;
        used.add(a.name); used.add(b.name);
        qs.push({ id, a, b, d, br: bearing(a, b), start: r.int(0, 359) });
      }
      if (qs.length < ROUNDS) return null;
      ctx.markSeen(qs.map((q) => q.id));
      return { qs, ans: [] };
    },
    render(ctx, st) {
      const { root, h } = ctx;
      function round() {
        const i = st.ans.length, r = st.qs[i];
        let angle = r.start, locked = false;
        root.innerHTML = "";
        const dial = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        dial.setAttribute("viewBox", "0 0 260 260"); dial.setAttribute("class", "dial"); dial.setAttribute("tabindex", "0"); dial.setAttribute("role", "slider"); dial.setAttribute("aria-label", "Bearing");
        let ticks = "";
        for (let t = 0; t < 360; t += 5) { const big = t % 45 === 0, L = big ? 14 : t % 15 === 0 ? 8 : 4; ticks += `<line x1="130" y1="14" x2="130" y2="${14 + L}" stroke="var(--ink-${big ? 2 : 3})" stroke-width="${big ? 2 : 1}" transform="rotate(${t} 130 130)"/>`; }
        dial.innerHTML = `<circle class="dial-face" cx="130" cy="130" r="122" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/>${ticks}
          ${["N", "E", "S", "W"].map((c, k) => `<text x="${130 + 86 * Math.sin((k * Math.PI) / 2)}" y="${130 - 86 * Math.cos((k * Math.PI) / 2)}" text-anchor="middle" dominant-baseline="central" font-weight="700" font-size="15" fill="var(--ink${c === "N" ? "" : "-2"})">${c}</text>`).join("")}
          <g id="truth" opacity="0"></g><g id="needle"><path d="M130 30 L139 130 L130 142 L121 130Z" fill="var(--accent)"/><path d="M130 230 L137 130 L123 130Z" fill="var(--ink-3)" opacity=".35"/></g>
          <circle cx="130" cy="130" r="7" fill="var(--ink)"/>`;
        const needle = dial.querySelector("#needle");
        const readout = h("div", { class: "mono", style: "font-size:30px;font-weight:700" });
        const set = (a) => { angle = ((Math.round(a) % 360) + 360) % 360; needle.setAttribute("transform", `rotate(${angle} 130 130)`); readout.innerHTML = `${angle}° <span class="muted" style="font-size:16px">${point(angle)}</span>`; };
        set(angle);
        const fromEvent = (e) => { const b = dial.getBoundingClientRect(); set(deg(Math.atan2(e.clientX - b.left - b.width / 2, -(e.clientY - b.top - b.height / 2)))); };
        dial.addEventListener("pointerdown", (e) => { if (locked) return; dial.setPointerCapture(e.pointerId); fromEvent(e); });
        dial.addEventListener("pointermove", (e) => { if (!locked && dial.hasPointerCapture(e.pointerId)) fromEvent(e); });
        dial.addEventListener("keydown", (e) => {
          if (locked) return; const step = e.shiftKey ? 10 : 1;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { set(angle + step); e.preventDefault(); }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { set(angle - step); e.preventDefault(); }
          if (e.key === "Enter") submit();
        });
        const dist = MG.logSlider({ lo: 300, hi: 20000, unit: "km" });
        const fb = h("div", { class: "feedback" });
        const btn = h("button", { class: "btn primary lg", onclick: submit }, "Lock it in");
        root.append(MG.roundTop(i, st.qs.length), h("p", { class: "route" }, r.a.name, h("span", {}, "→"), r.b.name),
          h("p", { class: "muted", style: "margin:0 0 20px" }, "Which way, and how far?"),
          h("div", { class: "cmp-wrap" }, h("div", { class: "center" }, dial, readout), h("div", {}, h("div", { class: "cmp-label" }, "Distance"), dist.el)),
          h("div", { class: "row", style: "margin-top:20px" }, btn), fb);
        function submit() {
          if (locked) return; locked = true; dist.disable();
          let err = Math.abs(angle - r.br); err = Math.min(err, 360 - err);
          const s = Math.round(Math.max(0, 1 - err / 90) * 60 + Math.max(0, 1 - Math.abs(Math.log2(dist.value / r.d)) / 2) * 40);
          st.ans.push({ angle, dist: dist.value, s }); ctx.save();
          const truth = dial.querySelector("#truth");
          truth.innerHTML = `<line x1="130" y1="130" x2="130" y2="22" stroke="var(--good)" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 7"/>`;
          truth.setAttribute("transform", `rotate(${r.br} 130 130)`); truth.style.transition = "opacity .5s"; requestAnimationFrame(() => truth.setAttribute("opacity", "1"));
          fb.innerHTML = `<div class="pop row" style="gap:18px"><span>Heading <b class="mono">${Math.round(r.br)}° ${point(r.br)}</b> <span class="muted">(${Math.round(err)}° off)</span></span>
            <span>Distance <b class="mono">${Math.round(r.d).toLocaleString()} km</b></span><span class="gain">+${s}</span></div>`;
          fb.append(mapOf(r));
          const last = st.ans.length >= st.qs.length;
          const next = h("button", { class: "btn primary lg", onclick: () => (last ? end() : round()) }, last ? "See result" : "Next");
          btn.replaceWith(next); next.focus();
        }
      }
      function mapOf(r) {
        const W = 720, H = 360, X = (lon) => ((lon + 180) / 360) * W, Y = (lat) => ((90 - lat) / 180) * H;
        let grid = "";
        for (let lon = -150; lon <= 150; lon += 30) grid += `<line x1="${X(lon)}" y1="0" x2="${X(lon)}" y2="${H}" stroke="var(--line)"/>`;
        for (let lat = -60; lat <= 60; lat += 30) grid += `<line x1="0" y1="${Y(lat)}" x2="${W}" y2="${Y(lat)}" stroke="var(--line)" ${lat === 0 ? 'stroke-width="2"' : ""}/>`;
        let path = "", prev = null;
        greatCircle(r.a, r.b).forEach((p) => { const jump = prev && Math.abs(p.lon - prev.lon) > 180; path += `${!prev || jump ? "M" : "L"}${X(p.lon).toFixed(1)} ${Y(p.lat).toFixed(1)} `; prev = p; });
        const others = PLACES.map((c) => `<circle cx="${X(c.lon)}" cy="${Y(c.lat)}" r="2" fill="var(--ink-3)" opacity=".45"/>`).join("");
        const label = (c, col, below) => `<circle cx="${X(c.lon)}" cy="${Y(c.lat)}" r="6" fill="${col}" stroke="var(--surface)" stroke-width="2"/>
          <text x="${X(c.lon) + 9}" y="${Y(c.lat) + (below ? 20 : -8)}" font-size="14" font-weight="700" fill="var(--ink)">${c.name}</text>`;
        const box = document.createElement("div"); box.className = "mapbox anim-in";
        box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${grid}${others}<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 6"/>${label(r.a, "var(--ink)", r.a.lat < r.b.lat)}${label(r.b, "var(--accent)", r.b.lat <= r.a.lat)}</svg>`;
        return box;
      }
      const end = () => { const sc = st.ans.map((a) => a.s); ctx.finish(sc.reduce((a, b) => a + b, 0) / st.qs.length, { summary: st.qs.map((r, k) => `${r.a.name} → ${r.b.name}: ${sc[k]}`).join("<br>"), share: MG.blocks(sc) }); };
      st.ans.length >= st.qs.length ? end() : round();
    },
  });
})();

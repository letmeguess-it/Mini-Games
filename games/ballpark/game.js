/* Ballpark — estimate quantities on a logarithmic scale.
 * Questions = curated facts + exact, computed quantities, so the supply is large
 * and no question is ever shown twice to the same player. */
(function () {
  const FACTS = [
    ["Bones in an adult human body", 206, "bones"], ["Keys on a standard piano", 88, "keys"], ["Height of Mount Everest", 8849, "metres"],
    ["Average distance from Earth to the Moon", 384400, "km"], ["Speed of light in a vacuum", 299792, "km per second"],
    ["Average distance from Earth to the Sun", 149.6e6, "km"], ["Seconds in a 365-day year", 31536000, "seconds"],
    ["Member states of the United Nations", 193, "countries"], ["Elements on the periodic table", 118, "elements"], ["Diameter of the Earth", 12742, "km"],
    ["Depth of the Challenger Deep, the ocean's deepest point", 10935, "metres"], ["Height of the Burj Khalifa", 828, "metres"],
    ["Different orderings of a shuffled 52-card deck", 8.07e67, "orderings"], ["Possible 5-card poker hands from a 52-card deck", 2598960, "hands"],
    ["Reachable positions of a 3×3 Rubik's Cube", 4.33e19, "positions"], ["Valid completed 9×9 Sudoku grids", 6.67e21, "grids"],
    ["Neurons in a human brain (approx.)", 86e9, "neurons"], ["Mass of the Earth", 5.97e24, "kg"], ["Age of the universe", 13.8e9, "years"],
    ["Age of the Earth", 4.54e9, "years"], ["Avogadro's number", 6.022e23, "particles per mole"], ["Length of a Martian year", 687, "Earth days"],
    ["Length of the Great Wall of China, all branches (2012 survey)", 21196, "km"], ["Length of a marathon", 42.195, "km"],
    ["Distance light travels in one year", 9.46e12, "km"], ["Nominal volume of an Olympic swimming pool", 2.5e6, "litres"], ["Area of Russia", 17.1e6, "km²"],
    ["Area of Vatican City", 0.49, "km²"], ["Speed of sound in air at 20 °C", 343, "metres per second"], ["Circumference of the Earth at the equator", 40075, "km"],
    ["Height of Hyperion, the tallest known living tree", 116, "metres"], ["Time for sunlight to reach Earth", 499, "seconds"], ["Bytes in one gibibyte (GiB)", 1073741824, "bytes"],
    ["Feet in a mile", 5280, "feet"], ["Teeth in a full adult human set", 32, "teeth"], ["Legal opening moves for White in chess", 20, "moves"],
    ["Boiling point of water at sea level", 212, "°F"], ["World population (2025, approx.)", 8.2e9, "people"], ["Height of the Eiffel Tower including antennas", 330, "metres"],
    ["Squares (of every size) on an 8×8 chessboard", 204, "squares"], ["Height of the Statue of Liberty, ground to torch", 93, "metres"],
    ["Main span of the Golden Gate Bridge", 1280, "metres"], ["UN member countries in Africa", 54, "countries"], ["Closest Earth–Mars distance of the 2003 approach", 55.76e6, "km"],
    ["Diameter of the Sun", 1.39e6, "km"], ["Diameter of the Moon", 3474, "km"], ["Mass of the Sun", 1.989e30, "kg"], ["Earth's average orbital speed around the Sun", 29.8, "km per second"],
    ["Length of the Ganges", 2525, "km"], ["Height of K2", 8611, "metres"], ["Area of India", 3.287e6, "km²"], ["States plus union territories in India (2024)", 36, "regions"],
    ["Languages listed in the Eighth Schedule of India's constitution", 22, "languages"], ["Time zones in Russia", 11, "time zones"], ["Bones in one human hand, including the wrist", 27, "bones"],
    ["Atomic number of gold", 79, ""], ["Length of the Trans-Siberian Railway, Moscow to Vladivostok", 9289, "km"], ["Mass of the Eiffel Tower's iron structure", 7300, "tonnes"],
    ["Height of the Statue of Unity in Gujarat", 182, "metres"], ["Possible games of tic-tac-toe", 255168, "games"], ["Possible 13-card bridge hands", 635013559600, "hands"],
    ["Ways to pick 6 numbers from 49 in a lottery", 13983816, "combinations"], ["Length of the DNA in one human cell, stretched out", 2, "metres"],
    ["Escape velocity from Earth's surface", 11.2, "km per second"], ["Depth of the Kola Superdeep Borehole", 12262, "metres"], ["Distance to Proxima Centauri", 4.24, "light years"],
    ["Minutes in a week", 10080, "minutes"], ["Seconds in one day", 86400, "seconds"],
  ].map(([q, a, u]) => ({ id: "f:" + q, q, a, u, curated: true }));

  const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  // Comparisons between two real facts that share a unit ("How many times larger…").
  const RATIO_UNITS = ["metres", "km", "km²", "years", "kg", "seconds", "km per second"];
  const RATIO_FACTS = FACTS.filter((f) => RATIO_UNITS.includes(f.u));

  // Each generator returns one exact, computed question. Together they hold over 700,000.
  const GENS = [
    (r) => { const n = r.int(10, 2000), k = r.int(2, 12); if (k >= n) return null; const t = r.int(0, 2);
      const q = [`Ways to choose ${k} winners from ${n.toLocaleString()} entrants, when order doesn't matter`, `Possible ${k}-person committees from a club of ${n.toLocaleString()} members`, `Different groups of ${k} songs you could pick from a library of ${n.toLocaleString()}`][t];
      return { id: `comb:${n}:${k}`, q, a: choose(n, k), u: "ways" }; },
    (r) => { const n = r.int(5, 170), t = n % 4; return { id: `perm:${n}`, q: [`Ways to line up ${n} different books on a shelf`, `Different orders to play a ${n}-song playlist`, `Ways to seat ${n} guests along one bench`, `Possible finishing orders in a ${n}-runner race`][t], a: fact(n), u: "orders" }; },
    (r) => { const n = r.int(8, 64); return { id: `rice:${n}`, q: `Grains of rice on square ${n} of a chessboard, if square 1 has one grain and each square doubles the last`, a: 2 ** (n - 1), u: "grains" }; },
    (r) => { const n = r.int(5, 45); return { id: `tri:${n}`, q: `Rupees you'd have after tripling ₹1 every day for ${n} days`, a: 3 ** n, u: "rupees" }; },
    (r) => { const [u, per, f] = r.pick([["Seconds", "days", 86400], ["Seconds", "weeks", 604800], ["Minutes", "years of 365 days", 525600], ["Hours", "centuries", 876600], ["Seconds", "years of 365 days", 31536000], ["Minutes", "days", 1440], ["Hours", "weeks", 168]]);
      const n = r.int(2, 1000); return { id: `time:${u}:${per}:${n}`, q: `${u} in ${n.toLocaleString()} ${per}`, a: n * f, u: u.toLowerCase() }; },
    (r) => { const [u, f] = r.pick([["second", 1], ["minute", 60], ["hour", 3600], ["day", 86400]]), n = r.int(1, 1000); return { id: `light:${u}:${n}`, q: `Kilometres light travels in ${n.toLocaleString()} ${u}${n > 1 ? "s" : ""}`, a: 299792.458 * f * n, u: "km" }; },
    (r) => { const n = r.int(10, 100000); return { id: `hs:${n}`, q: `Handshakes if ${n.toLocaleString()} people each shake hands with everyone else once`, a: (n * (n - 1)) / 2, u: "handshakes" }; },
    (r) => { const [b, what] = r.pick([[10, "digits 0–9"], [26, "lowercase letters"], [36, "lowercase letters and digits"], [52, "upper- and lowercase letters"], [62, "letters of both cases and digits"], [94, "any of the 94 printable keyboard characters"]]), n = r.int(3, 24);
      return { id: `pw:${b}:${n}`, q: `Possible ${n}-character passwords made from ${what}`, a: b ** n, u: "passwords" }; },
    (r) => { const y = r.int(1, 100), b = 55 + 5 * r.int(0, 8); return { id: `hb:${y}:${b}`, q: `Heartbeats in ${y} year${y > 1 ? "s" : ""} at ${b} beats per minute`, a: b * 525600 * y, u: "beats" }; },
    (r) => { const [t, f, u] = r.pick([["Millimetres in {n} miles", 1609344, "mm"], ["Centimetres in {n} kilometres", 1e5, "cm"], ["Inches in {n} kilometres", 39370.0787, "inches"], ["Grams in {n} pounds", 453.59237, "grams"],
        ["Millilitres in {n} US gallons", 3785.411784, "ml"], ["Feet in {n} kilometres", 3280.8399, "feet"], ["Square metres in {n} acres", 4046.8564224, "m²"], ["Square metres in {n} hectares", 1e4, "m²"], ["Seconds in {n} hours", 3600, "seconds"]]);
      const n = r.int(2, 50000); return { id: `conv:${t}:${n}`, q: t.replace("{n}", n.toLocaleString()), a: n * f, u }; },
    (r) => { const b = r.int(2, 30), e = r.int(5, 40); if (b ** e > 1e300) return null; return { id: `pow:${b}:${e}`, q: `${b} multiplied by itself ${e} times (${b}^${e})`, a: b ** e, u: "" }; },
    (r) => { const n = r.int(3, 2000); return { id: `sq:${n}`, q: `Squares of every size on a ${n}×${n} grid`, a: (n * (n + 1) * (2 * n + 1)) / 6, u: "squares" }; },
    (r) => { const n = r.int(2, 2000); return { id: `rect:${n}`, q: `Rectangles of every size on a ${n}×${n} grid`, a: ((n * (n + 1)) / 2) ** 2, u: "rectangles" }; },
    (r) => { const n = r.int(5, 100000); return { id: `diag:${n}`, q: `Diagonals in a polygon with ${n.toLocaleString()} sides`, a: (n * (n - 3)) / 2, u: "diagonals" }; },
    (r) => { const n = r.int(2, 500); return { id: `bday:${n}`, q: `Pairs of people that can be formed from a class of ${n} students`, a: (n * (n - 1)) / 2, u: "pairs" }; },
    (r) => { const [A, B] = r.sample(RATIO_FACTS, 2); if (A.u !== B.u) return null; const [big, small] = A.a >= B.a ? [A, B] : [B, A]; if (big.a / small.a < 1.5) return null;
      return { id: `ratio:${big.q}|${small.q}`, q: `How many times larger is the ${lower(big.q)} than the ${lower(small.q)}`, a: big.a / small.a, u: "times" }; },
  ];
  const generate = (r) => GENS[Math.floor(r() * GENS.length)](r);
  const ROUNDS = 5;
  const scoreFor = (g, a) => Math.max(0, Math.round(100 * (1 - Math.abs(Math.log10(g / a)) / 1.5)));

  MG.define({
    slug: "ballpark",
    howTo: `<p>Each question asks for a quantity, from tiny to astronomical. Drag the slider (it moves in <b>powers of ten</b>) or type a number like <code>3.2m</code>, <code>4e9</code> or <code>2 crore</code>.</p>
    <ul><li>Scoring is about <b>orders of magnitude</b>: within 2× earns about 80, within 10× about 33.</li>
    <li>The slider's ends are randomized around the answer, so its middle is not a hint.</li>
    <li>You'll never see the same question twice.</li></ul>`,
    progress: (s) => `Question ${s.ans.length + 1} of ${s.qs.length}`,
    partial: (s) => s.ans.reduce((a, b) => a + b.s, 0) / s.qs.length,
    init(ctx) {
      // Two curated facts + three computed quantities per game, all never seen before.
      const cur = FACTS.filter((f) => !ctx.isSeen(f.id));
      const facts = ctx.rng.sample(cur, Math.min(2, cur.length));
      ctx.markSeen(facts.map((f) => f.id));
      const gen = ctx.draw(generate, ROUNDS - facts.length);
      if (!gen) return null;
      const qs = ctx.rng.shuffle([...facts, ...gen]);
      return { qs: qs.map((f) => { const mag = Math.floor(Math.log10(f.a)); return { ...f, lo: 10 ** (mag - ctx.rng.int(2, 4)), hi: 10 ** (mag + ctx.rng.int(2, 4)) }; }), ans: [] };
    },
    render(ctx, st) {
      const { root, h } = ctx;
      const round = () => {
        const i = st.ans.length, f = st.qs[i];
        const slider = MG.logSlider({ lo: f.lo, hi: f.hi, unit: f.u });
        const fb = h("div", { class: "feedback" });
        const btn = h("button", { class: "btn primary lg", onclick: submit }, "Lock it in");
        root.innerHTML = "";
        root.append(MG.roundTop(i, st.qs.length), h("p", { class: "big-q" }, f.q, "?"), slider.el, h("div", { class: "row", style: "margin-top:18px" }, btn), fb);
        slider.text.addEventListener("keydown", (e) => e.key === "Enter" && submit());
        let done = false;
        function submit() {
          if (done) return;
          const g = slider.value;
          if (!(g > 0)) return ctx.toast("Enter a positive number");
          done = true; slider.disable();
          const s = scoreFor(g, f.a), ratio = g / f.a;
          st.ans.push({ g, s }); ctx.save();
          fb.innerHTML = `<div class="pop row" style="gap:18px"><span>Answer: <span class="mono" style="font-size:22px">${MG.sci(f.a)}</span> ${f.u}</span>
            <span class="muted">You were ${ratio >= 1 ? "×" + MG.fmtNum(ratio) + " over" : "÷" + MG.fmtNum(1 / ratio) + " under"}</span><span class="gain">+${s}</span></div>`;
          const last = st.ans.length >= st.qs.length;
          const next = h("button", { class: "btn primary lg", onclick: () => (last ? end() : round()) }, last ? "See result" : "Next");
          btn.replaceWith(next); next.focus();
        }
      };
      const end = () => { const sc = st.ans.map((a) => a.s); ctx.finish(sc.reduce((a, b) => a + b, 0) / st.qs.length, { summary: st.qs.map((q, k) => `${sc[k]} · ${q.q}`).join("<br>"), share: MG.blocks(sc) }); };
      st.ans.length >= st.qs.length ? end() : round();
    },
  });
})();

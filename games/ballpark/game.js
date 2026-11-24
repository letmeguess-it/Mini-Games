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
  function generated() {
    const out = [];
    const perm = ["Ways to line up {n} different books on a shelf", "Different orders to play a {n}-song playlist", "Ways to seat {n} guests along one bench", "Possible finishing orders in a {n}-runner race"];
    for (let n = 6; n <= 40; n++) out.push({ id: `perm:${n}`, q: perm[n % 4].replace("{n}", n), a: fact(n), u: "orders" });
    for (let n = 10; n <= 64; n++) out.push({ id: `rice:${n}`, q: `Grains of rice on square ${n} of a chessboard, if square 1 has one grain and each square doubles the last`, a: 2 ** (n - 1), u: "grains" });
    for (let n = 2; n <= 90; n++) out.push({ id: `min:${n}`, q: `Minutes in ${n} years of 365 days`, a: n * 525600, u: "minutes" });
    for (let n = 2; n <= 52; n++) out.push({ id: `secw:${n}`, q: `Seconds in ${n} weeks`, a: n * 604800, u: "seconds" });
    for (let n = 10; n <= 60; n++) for (let k = 2; k <= 6; k++) out.push({ id: `comb:${n}:${k}`, q: `Ways to choose ${k} winners from ${n} entrants, when order doesn't matter`, a: choose(n, k), u: "ways" });
    for (let n = 3; n <= 16; n++) out.push({ id: `pw26:${n}`, q: `Possible ${n}-letter passwords using only lowercase a–z`, a: 26 ** n, u: "passwords" });
    for (let n = 3; n <= 14; n++) out.push({ id: `pw36:${n}`, q: `Possible ${n}-character codes using a–z and 0–9`, a: 36 ** n, u: "codes" });
    for (let n = 1; n <= 60; n++) out.push({ id: `light:${n}`, q: `Kilometres light travels in ${n} minute${n > 1 ? "s" : ""}`, a: 299792.458 * 60 * n, u: "km" });
    const hs = []; for (let n = 10; n <= 100; n += 5) hs.push(n); for (let n = 150; n <= 1000; n += 50) hs.push(n); for (let n = 2000; n <= 10000; n += 1000) hs.push(n);
    hs.forEach((n) => out.push({ id: `hs:${n}`, q: `Handshakes if ${n.toLocaleString()} people each shake hands with everyone else once`, a: (n * (n - 1)) / 2, u: "handshakes" }));
    for (let n = 2; n <= 30; n++) out.push({ id: `heart:${n}`, q: `Heartbeats in ${n} years, at 70 beats per minute`, a: 70 * 525600 * n, u: "beats" });
    return out;
  }
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
      const cur = FACTS.filter((f) => !ctx.isSeen(f.id)), gen = generated().filter((f) => !ctx.isSeen(f.id));
      if (cur.length + gen.length < ROUNDS) return null;
      const nGen = Math.min(ROUNDS - Math.min(2, cur.length), gen.length), nCur = ROUNDS - nGen;
      const qs = ctx.rng.shuffle([...ctx.rng.sample(cur, nCur), ...ctx.rng.sample(gen, nGen)]);
      ctx.markSeen(qs.map((q) => q.id));
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

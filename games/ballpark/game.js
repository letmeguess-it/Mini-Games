/* Ballpark — estimate quantities on a logarithmic scale. */
const FACTS = [
  { q: "Bones in an adult human body", a: 206, u: "bones" },
  { q: "Keys on a standard piano", a: 88, u: "keys" },
  { q: "Height of Mount Everest", a: 8849, u: "metres" },
  { q: "Average distance from Earth to the Moon", a: 384400, u: "km" },
  { q: "Speed of light in a vacuum", a: 299792, u: "km per second" },
  { q: "Average distance from Earth to the Sun", a: 149.6e6, u: "km" },
  { q: "Seconds in a 365-day year", a: 31536000, u: "seconds" },
  { q: "Member states of the United Nations", a: 193, u: "countries" },
  { q: "Elements on the periodic table", a: 118, u: "elements" },
  { q: "Diameter of the Earth", a: 12742, u: "km" },
  { q: "Depth of the Challenger Deep, the ocean's deepest point", a: 10935, u: "metres" },
  { q: "Height of the Burj Khalifa", a: 828, u: "metres" },
  { q: "Different orderings of a shuffled 52-card deck", a: 8.07e67, u: "orderings" },
  { q: "Possible 5-card poker hands from a 52-card deck", a: 2598960, u: "hands" },
  { q: "Reachable positions of a 3×3 Rubik's Cube", a: 4.33e19, u: "positions" },
  { q: "Valid completed 9×9 Sudoku grids", a: 6.67e21, u: "grids" },
  { q: "Neurons in a human brain (approx.)", a: 86e9, u: "neurons" },
  { q: "Mass of the Earth", a: 5.97e24, u: "kg" },
  { q: "Age of the universe", a: 13.8e9, u: "years" },
  { q: "Age of the Earth", a: 4.54e9, u: "years" },
  { q: "Avogadro's number", a: 6.022e23, u: "particles per mole" },
  { q: "Length of a Martian year", a: 687, u: "Earth days" },
  { q: "Length of the Great Wall of China, all branches (2012 survey)", a: 21196, u: "km" },
  { q: "Length of a marathon", a: 42.195, u: "km" },
  { q: "Distance light travels in one year", a: 9.46e12, u: "km" },
  { q: "Nominal volume of an Olympic swimming pool", a: 2.5e6, u: "litres" },
  { q: "Area of Russia", a: 17.1e6, u: "km²" },
  { q: "Area of Vatican City", a: 0.49, u: "km²" },
  { q: "Speed of sound in air at 20 °C", a: 343, u: "metres per second" },
  { q: "Circumference of the Earth at the equator", a: 40075, u: "km" },
  { q: "Height of Hyperion, the tallest known living tree", a: 116, u: "metres" },
  { q: "Time for sunlight to reach Earth", a: 499, u: "seconds" },
  { q: "Seconds in one day", a: 86400, u: "seconds" },
  { q: "Bytes in one gibibyte (GiB)", a: 1073741824, u: "bytes" },
  { q: "Feet in a mile", a: 5280, u: "feet" },
  { q: "Teeth in a full adult human set", a: 32, u: "teeth" },
  { q: "Legal opening moves for White in chess", a: 20, u: "moves" },
  { q: "Boiling point of water at sea level", a: 212, u: "°F" },
  { q: "World population (2025, approx.)", a: 8.2e9, u: "people" },
  { q: "Minutes in a week", a: 10080, u: "minutes" },
  { q: "Height of the Eiffel Tower including antennas", a: 330, u: "metres" },
  { q: "Squares (of every size) on an 8×8 chessboard", a: 204, u: "squares" },
];

const ROUNDS = 5;
function scoreFor(guess, ans) {
  const err = Math.abs(Math.log10(guess / ans));
  return Math.max(0, Math.round(100 * (1 - err / 1.5)));
}

MG.game({
  slug: "ballpark",
  howTo: `<p>Each question asks for a quantity, from tiny to astronomical. Drag the slider (it moves in <b>powers of ten</b>) or type a number like <code>3.2m</code>, <code>4e9</code> or <code>2 crore</code>.</p>
  <ul><li>Scoring is about <b>orders of magnitude</b>: within 2× earns about 80, within 10× about 33.</li>
  <li>The slider's ends are randomized around the answer, so its middle is not a hint.</li>
  <li>The daily set of ${ROUNDS} is the same for everyone today.</li></ul>`,
  setup(ctx) {
    const { root, rng, h } = ctx;
    const qs = rng.sample(FACTS, ROUNDS);
    const results = [];
    let i = 0;

    function round() {
      const f = qs[i];
      const mag = Math.floor(Math.log10(f.a));
      const lo = 10 ** (mag - rng.int(2, 4)), hi = 10 ** (mag + rng.int(2, 4));
      root.innerHTML = "";
      const dots = h("div", { class: "dots" }, ...qs.map((_, k) => h("i", { class: k < i ? "on" : k === i ? "cur" : "" })));
      const slider = MG.logSlider({ lo, hi, unit: f.u });
      const fb = h("div", { class: "feedback" });
      const btn = h("button", { class: "btn primary lg", onclick: submit }, "Lock it in");
      root.append(
        h("div", { class: "stage-top" }, dots, h("span", { class: "faint mono" }, `${i + 1} / ${ROUNDS}`)),
        h("p", { class: "big-q" }, f.q, "?"),
        slider.el, h("div", { class: "row", style: "margin-top:18px" }, btn), fb);
      root.querySelector("input.input").addEventListener("keydown", (e) => e.key === "Enter" && submit());

      let done = false;
      function submit() {
        if (done) return;
        const g = slider.value;
        if (!(g > 0)) return MG.toast("Enter a positive number");
        done = true;
        const s = scoreFor(g, f.a);
        results.push(s);
        slider.disable();
        const ratio = g / f.a;
        fb.innerHTML = `<div class="pop" style="display:flex;gap:18px;align-items:baseline;flex-wrap:wrap">
          <span>Answer: <span class="mono" style="font-size:22px">${MG.sci(f.a)}</span> ${f.u}</span>
          <span class="muted">You were ${ratio >= 1 ? "×" + MG.fmtNum(ratio) + " over" : "÷" + MG.fmtNum(1 / ratio) + " under"}</span>
          <span class="mono" style="color:var(--accent);font-size:22px">+${s}</span></div>`;
        const next = h("button", { class: "btn primary lg", onclick: () => { i++; i < ROUNDS ? round() : end(); } }, i + 1 < ROUNDS ? "Next" : "See result");
        btn.replaceWith(next); next.focus();
      }
    }
    function end() {
      const total = results.reduce((a, b) => a + b, 0) / ROUNDS;
      ctx.finish(total, { summary: `Round scores: ${results.join(" · ")}`, share: MG.blocks(results) });
    }
    round();
  },
});

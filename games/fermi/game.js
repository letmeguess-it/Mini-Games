/* Fermi — estimate the "impossible" by multiplying things you can guess.
 * Each reference answer is itself an estimate, built from the chain shown. */
const QS = [
  { q: "How many pairs of shoes are sold worldwide in a single day?", u: "pairs",
    chain: [["People on Earth", 8e9, "×"], ["Pairs bought per person per year", 3, "×"], ["Days in a year", 365, "÷"]] },
  { q: "How many piano tuners work in Chicago?", u: "tuners",
    chain: [["People in Chicago", 2.7e6, "×"], ["Households per person", 1 / 2.5, "×"], ["Share of homes with a piano", 1 / 20, "×"], ["Tunings per piano per year", 1, "×"], ["Tunings one tuner does a year (4/day × 250 days)", 1000, "÷"]] },
  { q: "How many times does a human heart beat in a lifetime?", u: "beats",
    chain: [["Beats per minute", 70, "×"], ["Minutes in a day", 1440, "×"], ["Days in a year", 365, "×"], ["Years in a lifetime", 73, "×"]] },
  { q: "How many litres of water does a person drink in their lifetime?", u: "litres",
    chain: [["Litres per day", 2, "×"], ["Days in a year", 365, "×"], ["Years in a lifetime", 73, "×"]] },
  { q: "How many golf balls would fit inside a school bus?", u: "golf balls",
    chain: [["Bus interior volume in cm³ (2.3 m × 1.9 m × 9 m)", 3.9e7, "×"], ["Packing efficiency of spheres", 0.64, "×"], ["Volume of one golf ball in cm³", 41, "÷"]] },
  { q: "How many times does a person blink in a year?", u: "blinks",
    chain: [["Blinks per minute", 15, "×"], ["Waking minutes per day (16 h)", 960, "×"], ["Days in a year", 365, "×"]] },
  { q: "How many slices of pizza are eaten in the US on a given day?", u: "slices",
    chain: [["People in the US", 3.35e8, "×"], ["Share who eat pizza on a given day", 0.13, "×"], ["Slices each", 2.5, "×"]] },
  { q: "How many words does an average person speak in a year?", u: "words",
    chain: [["Words spoken per day", 16000, "×"], ["Days in a year", 365, "×"]] },
  { q: "How many cups of tea are drunk in the UK every day?", u: "cups",
    chain: [["People in the UK", 6.8e7, "×"], ["Share who drink tea daily", 0.6, "×"], ["Cups per tea drinker", 2.5, "×"]] },
  { q: "How many smartphones are sold worldwide each day?", u: "phones",
    chain: [["Smartphone users worldwide", 4.5e9, "×"], ["Years before a phone is replaced", 3.5, "÷"], ["Days in a year", 365, "÷"]] },
  { q: "How many footsteps would it take to walk around the equator?", u: "steps",
    chain: [["Equator length in metres", 4.0075e7, "×"], ["Metres per step", 0.75, "÷"]] },
  { q: "How many cups of coffee are drunk worldwide every day?", u: "cups",
    chain: [["Adults on Earth", 5.7e9, "×"], ["Share who drink coffee daily", 0.3, "×"], ["Cups per coffee drinker", 1.3, "×"]] },
  { q: "How many school teachers are there in India?", u: "teachers",
    chain: [["School students in India", 2.5e8, "×"], ["Students per teacher", 26, "÷"]] },
  { q: "How many grains of rice are in a 1 kg bag?", u: "grains",
    chain: [["Grams in the bag", 1000, "×"], ["Grams per grain", 0.025, "÷"]] },
  { q: "How many babies are born worldwide every day?", u: "babies",
    chain: [["People on Earth", 8e9, "×"], ["Births per person per year (17 per 1,000)", 0.017, "×"], ["Days in a year", 365, "÷"]] },
  { q: "How many hours would it take to count out loud to one million?", u: "hours",
    chain: [["Numbers to say", 1e6, "×"], ["Seconds per number (they get long)", 3, "×"], ["Seconds in an hour", 3600, "÷"]] },
  { q: "How many hairs are on a human head?", u: "hairs",
    chain: [["Scalp area in cm²", 600, "×"], ["Hairs per cm²", 170, "×"]] },
  { q: "How many trips around the Earth would all of a person's lifetime walking add up to?", u: "trips",
    chain: [["Steps per day", 7000, "×"], ["Metres per step", 0.75, "×"], ["Days in 73 years", 26645, "×"], ["Metres around the Earth", 4.0075e7, "÷"]] },
].map((x) => ({ ...x, a: x.chain.reduce((acc, [, v, op]) => (op === "÷" ? acc / v : acc * v), 1) }));

const ROUNDS = 3, HINT_COST = 12;

MG.css(`
.chain{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:6px}
.chain li{display:flex;gap:10px;align-items:center;background:var(--surface-2);border-radius:10px;padding:9px 12px;font-size:14px}
.chain .op{font:700 15px var(--mono);color:var(--accent);width:16px}
.chain .v{margin-left:auto;font:600 14px var(--mono)}
.chain li.locked{color:var(--ink-3)}
.chain li.locked .v{filter:blur(5px)}
`);

MG.game({
  slug: "fermi",
  howTo: `<p>Fermi questions sound unanswerable. The trick is to split them into factors you <i>can</i> guess, then multiply.</p>
  <ul><li>Give your final estimate on the slider or by typing (e.g. <code>65m</code>).</li>
  <li>Stuck? Reveal one factor of the reference chain for ${HINT_COST} points each.</li>
  <li>Scoring is by orders of magnitude: within 3× scores about 76, within 10× about 50.</li>
  <li>The reference answers are estimates too. The point is the reasoning, and the chain is shown afterwards.</li></ul>`,
  setup(ctx) {
    const { root, rng, h } = ctx;
    const qs = rng.sample(QS, ROUNDS);
    const scores = [];
    let i = 0;

    function round() {
      const f = qs[i];
      let hints = 0, locked = false;
      const mag = Math.floor(Math.log10(f.a));
      const slider = MG.logSlider({ lo: 10 ** (mag - rng.int(3, 4)), hi: 10 ** (mag + rng.int(3, 4)), unit: f.u });
      root.innerHTML = "";
      const chain = h("ul", { class: "chain" });
      const renderChain = (all) => {
        chain.innerHTML = f.chain.map(([label, v, op], k) => `<li class="${all || k < hints ? "" : "locked"}">
          <span class="op">${k === 0 ? "" : op}</span><span>${all || k < hints ? label : "Hidden factor"}</span><span class="v">${all || k < hints ? MG.sci(v) : "•••••"}</span></li>`).join("");
      };
      renderChain(false);
      const hintBtn = h("button", { class: "btn sm", onclick: () => {
        if (locked || hints >= f.chain.length - 1) return;
        hints++; renderChain(false);
        hintBtn.textContent = hints >= f.chain.length - 1 ? "No more hints" : `Reveal a factor (−${HINT_COST})`;
        if (hints >= f.chain.length - 1) hintBtn.disabled = true;
      } }, `Reveal a factor (−${HINT_COST})`);
      const fb = h("div", { class: "feedback" });
      const btn = h("button", { class: "btn primary lg", onclick: submit }, "Lock in estimate");
      root.append(
        h("div", { class: "stage-top" }, h("div", { class: "dots" }, ...qs.map((_, k) => h("i", { class: k < i ? "on" : k === i ? "cur" : "" }))), h("span", { class: "faint mono" }, `${i + 1} / ${ROUNDS}`)),
        h("p", { class: "big-q" }, f.q),
        slider.el,
        h("div", { class: "row", style: "margin-top:18px" }, btn, hintBtn),
        h("div", { style: "margin-top:18px" }, h("div", { class: "faint", style: "font-size:12px;text-transform:uppercase;letter-spacing:.08em" }, `Reasoning chain · ${f.chain.length} factors`), chain),
        fb);
      root.querySelector("input.input").addEventListener("keydown", (e) => e.key === "Enter" && submit());

      function submit() {
        if (locked) return; locked = true;
        slider.disable(); hintBtn.disabled = true;
        const err = Math.abs(Math.log10(slider.value / f.a));
        const s = Math.max(0, Math.round(100 * (1 - err / 2)) - hints * HINT_COST);
        scores.push(s);
        renderChain(true);
        fb.innerHTML = `<div class="pop row" style="gap:18px"><span>Reference estimate <b class="mono" style="font-size:22px">≈ ${MG.sci(f.a)}</b> ${f.u}</span>
          <span class="muted">You said ${MG.sci(slider.value)}${hints ? ` · ${hints} hint${hints > 1 ? "s" : ""}` : ""}</span>
          <span class="mono" style="color:var(--accent);font-size:22px">+${s}</span></div>`;
        const next = h("button", { class: "btn primary lg", onclick: () => { i++; i < ROUNDS ? round() : end(); } }, i + 1 < ROUNDS ? "Next" : "See result");
        btn.replaceWith(next); next.focus();
      }
    }
    function end() {
      ctx.finish(scores.reduce((a, b) => a + b, 0) / ROUNDS, { summary: qs.map((q, k) => `${scores[k]} · ${q.q}`).join("<br>"), share: MG.blocks(scores) });
    }
    round();
  },
});

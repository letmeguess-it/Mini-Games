/* Fermi — estimate the "impossible" by multiplying things you can guess.
 * Reference answers are estimates too, built from the chain shown afterwards. */
(function () {
  const CURATED = [
    ["How many pairs of shoes are sold worldwide in a single day?", "pairs", [["People on Earth", 8e9, "×"], ["Pairs bought per person per year", 3, "×"], ["Days in a year", 365, "÷"]]],
    ["How many piano tuners work in Chicago?", "tuners", [["People in Chicago", 2.7e6, "×"], ["Households per person", 0.4, "×"], ["Share of homes with a piano", 0.05, "×"], ["Tunings per piano per year", 1, "×"], ["Tunings one tuner does a year (4/day × 250 days)", 1000, "÷"]]],
    ["How many times does a human heart beat in a lifetime?", "beats", [["Beats per minute", 70, "×"], ["Minutes in a day", 1440, "×"], ["Days in a year", 365, "×"], ["Years in a lifetime", 73, "×"]]],
    ["How many litres of water does a person drink in their lifetime?", "litres", [["Litres per day", 2, "×"], ["Days in a year", 365, "×"], ["Years in a lifetime", 73, "×"]]],
    ["How many golf balls would fit inside a school bus?", "golf balls", [["Bus interior volume in cm³ (2.3 m × 1.9 m × 9 m)", 3.9e7, "×"], ["Packing efficiency of spheres", 0.64, "×"], ["Volume of one golf ball in cm³", 41, "÷"]]],
    ["How many times does a person blink in a year?", "blinks", [["Blinks per minute", 15, "×"], ["Waking minutes per day (16 h)", 960, "×"], ["Days in a year", 365, "×"]]],
    ["How many words does an average person speak in a year?", "words", [["Words spoken per day", 16000, "×"], ["Days in a year", 365, "×"]]],
    ["How many smartphones are sold worldwide each day?", "phones", [["Smartphone users worldwide", 4.5e9, "×"], ["Years before a phone is replaced", 3.5, "÷"], ["Days in a year", 365, "÷"]]],
    ["How many footsteps would it take to walk around the equator?", "steps", [["Equator length in metres", 4.0075e7, "×"], ["Metres per step", 0.75, "÷"]]],
    ["How many cups of coffee are drunk worldwide every day?", "cups", [["Adults on Earth", 5.7e9, "×"], ["Share who drink coffee daily", 0.3, "×"], ["Cups per coffee drinker", 1.3, "×"]]],
    ["How many school teachers are there in India?", "teachers", [["School students in India", 2.5e8, "×"], ["Students per teacher", 26, "÷"]]],
    ["How many grains of rice are in a 1 kg bag?", "grains", [["Grams in the bag", 1000, "×"], ["Grams per grain", 0.025, "÷"]]],
    ["How many babies are born worldwide every day?", "babies", [["People on Earth", 8e9, "×"], ["Births per person per year (17 per 1,000)", 0.017, "×"], ["Days in a year", 365, "÷"]]],
    ["How many hours would it take to count out loud to one million?", "hours", [["Numbers to say", 1e6, "×"], ["Seconds per number (they get long)", 3, "×"], ["Seconds in an hour", 3600, "÷"]]],
    ["How many hairs are on a human head?", "hairs", [["Scalp area in cm²", 600, "×"], ["Hairs per cm²", 170, "×"]]],
    ["How many trips around the Earth does a lifetime of walking add up to?", "trips", [["Steps per day", 7000, "×"], ["Metres per step", 0.75, "×"], ["Days in 73 years", 26645, "×"], ["Metres around the Earth", 4.0075e7, "÷"]]],
    ["How many leaves are on a large, mature oak tree?", "leaves", [["Main branches", 20, "×"], ["Twigs per branch", 100, "×"], ["Leaves per twig", 100, "×"]]],
    ["How many pages would it take to print every whole number from 1 to 1,000,000?", "pages", [["Numbers to print", 1e6, "×"], ["Average digits per number", 5.9, "×"], ["Digits that fit on one page", 3000, "÷"]]],
  ].map(([q, u, chain]) => ({ id: "c:" + q, q, u, chain }));

  // Template × place questions. Populations are rounded estimates, shown in the chain.
  const PLACES = [["Mumbai", 2.1e7], ["Delhi", 3.2e7], ["Bengaluru", 1.3e7], ["Kolkata", 1.5e7], ["Chennai", 1.1e7], ["Hyderabad", 1.05e7], ["Tokyo", 3.7e7], ["New York City", 1.9e7],
    ["London", 9e6], ["Paris", 1.1e7], ["São Paulo", 2.2e7], ["Lagos", 1.5e7], ["Cairo", 2.2e7], ["Sydney", 5.3e6], ["Singapore", 5.9e6], ["Toronto", 6.2e6], ["Berlin", 3.7e6],
    ["Dubai", 3.6e6], ["Seoul", 9.4e6], ["Mexico City", 2.2e7], ["India", 1.45e9], ["the United States", 3.35e8], ["Japan", 1.24e8], ["the United Kingdom", 6.8e7], ["Germany", 8.4e7],
    ["Brazil", 2.16e8], ["Nigeria", 2.24e8], ["Australia", 2.7e7], ["Canada", 4e7], ["France", 6.8e7]];
  const TEMPLATES = [
    ["haircuts", "How many haircuts are given in {p} on a typical day?", "haircuts", [["Haircuts per person per year", 8, "×"], ["Days in a year", 365, "÷"]]],
    ["cakes", "How many birthday cakes are bought in {p} each day?", "cakes", [["Birthdays per person per year", 1, "×"], ["Share of birthdays with a bought cake", 0.4, "×"], ["Days in a year", 365, "÷"]]],
    ["dentists", "How many dentists work in {p}?", "dentists", [["Dental visits per person per year", 0.8, "×"], ["Visits one dentist handles a year (8/day × 230 days)", 1840, "÷"]]],
    ["umbrellas", "How many umbrellas are sold in {p} each year?", "umbrellas", [["Umbrellas bought per person per year", 0.3, "×"]]],
    ["tea", "How many cups of tea and coffee are drunk in {p} each day?", "cups", [["Share who drink tea or coffee daily", 0.7, "×"], ["Cups per drinker", 2, "×"]]],
    ["births", "How many babies are born in {p} each day?", "babies", [["Births per person per year", 0.015, "×"], ["Days in a year", 365, "÷"]]],
    ["toothbrush", "How many toothbrushes are thrown away in {p} each year?", "toothbrushes", [["Share who use a toothbrush", 0.9, "×"], ["Brushes replaced per year", 4, "×"]]],
    ["buses", "How many 50-seat buses would it take to carry every child aged 5–15 in {p}?", "buses", [["Share of people aged 5–15", 0.15, "×"], ["Seats per bus", 50, "÷"]]],
    ["shoes", "How many pairs of shoes are bought in {p} each year?", "pairs", [["Pairs per person per year", 3, "×"]]],
    ["eggs", "How many eggs are eaten in {p} each day?", "eggs", [["Eggs eaten per person per year", 200, "×"], ["Days in a year", 365, "÷"]]],
    ["phones", "How many phone calls are made in {p} each day?", "calls", [["Share who own a phone", 0.8, "×"], ["Calls per owner per day", 4, "×"]]],
    ["bread", "How many loaves of bread (or the equivalent in flatbreads) are eaten in {p} each day?", "loaves", [["Loaves per person per week", 1.5, "×"], ["Days in a week", 7, "÷"]]],
  ];
  function pool() {
    const out = CURATED.slice();
    TEMPLATES.forEach(([tid, q, u, chain]) => PLACES.forEach(([p, pop]) => out.push({ id: `t:${tid}:${p}`, q: q.replace("{p}", p), u, chain: [[`People in ${p}`, pop, "×"], ...chain] })));
    return out.map((x) => ({ ...x, a: x.chain.reduce((acc, [, v, op]) => (op === "÷" ? acc / v : acc * v), 1) }));
  }
  const ROUNDS = 3, HINT_COST = 12;

  MG.css(`
  .chain{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:6px}
  .chain li{display:flex;gap:10px;align-items:center;background:var(--surface-2);border-radius:10px;padding:9px 12px;font-size:14px}
  .chain .op{font:700 15px var(--mono);color:var(--accent);width:16px}.chain .v{margin-left:auto;font:600 14px var(--mono)}
  .chain li.locked{color:var(--ink-3)}`);

  MG.define({
    slug: "fermi",
    howTo: `<p>Fermi questions sound unanswerable. The trick is to split them into factors you <i>can</i> guess, then multiply.</p>
    <ul><li>Give your final estimate on the slider or by typing (e.g. <code>65m</code>).</li>
    <li>Stuck? Reveal one factor of the reference chain for ${HINT_COST} points each.</li>
    <li>Scoring is by orders of magnitude: within 3× scores about 76, within 10× about 50.</li>
    <li>The reference answers are estimates too, and the chain is shown afterwards. Questions never repeat.</li></ul>`,
    progress: (s) => `Question ${s.ans.length + 1} of ${s.qs.length}`,
    partial: (s) => s.ans.reduce((a, b) => a + b.s, 0) / s.qs.length,
    init(ctx) {
      const qs = ctx.pick(pool(), ROUNDS);
      if (!qs) return null;
      return { qs: qs.map((f) => { const mag = Math.floor(Math.log10(f.a)); return { ...f, lo: 10 ** (mag - ctx.rng.int(3, 4)), hi: 10 ** (mag + ctx.rng.int(3, 4)) }; }), ans: [], hints: 0 };
    },
    render(ctx, st) {
      const { root, h } = ctx;
      function round() {
        const i = st.ans.length, f = st.qs[i];
        let locked = false;
        const slider = MG.logSlider({ lo: f.lo, hi: f.hi, unit: f.u });
        const chain = h("ul", { class: "chain" });
        const maxHints = f.chain.length - 1;
        const renderChain = (all) => {
          chain.innerHTML = f.chain.map(([label, v, op], k) => { const open = all || k < st.hints;
            return `<li class="${open ? "" : "locked"}"><span class="op">${k === 0 ? "" : op}</span><span>${open ? label : "Hidden factor"}</span><span class="v">${open ? MG.sci(v) : "•••••"}</span></li>`; }).join("");
        };
        const hintBtn = h("button", { class: "btn sm", onclick: () => {
          if (locked || st.hints >= maxHints) return;
          st.hints++; ctx.save(); renderChain(false); hintLabel();
        } });
        const hintLabel = () => { hintBtn.textContent = st.hints >= maxHints ? "No more hints" : `Reveal a factor (−${HINT_COST})`; hintBtn.disabled = st.hints >= maxHints; };
        renderChain(false); hintLabel();
        const fb = h("div", { class: "feedback" });
        const btn = h("button", { class: "btn primary lg", onclick: submit }, "Lock in estimate");
        root.innerHTML = "";
        root.append(MG.roundTop(i, st.qs.length), h("p", { class: "big-q" }, f.q), slider.el,
          h("div", { class: "row", style: "margin-top:18px" }, btn, hintBtn),
          h("div", { style: "margin-top:18px" }, h("div", { class: "cmp-label faint", style: "font-size:12px;text-transform:uppercase;letter-spacing:.06em" }, `Reasoning chain · ${f.chain.length} factor${f.chain.length > 1 ? "s" : ""}`), chain), fb);
        slider.text.addEventListener("keydown", (e) => e.key === "Enter" && submit());
        function submit() {
          if (locked) return; locked = true; slider.disable(); hintBtn.disabled = true;
          const hints = st.hints;
          const s = Math.max(0, Math.round(100 * (1 - Math.abs(Math.log10(slider.value / f.a)) / 2)) - hints * HINT_COST);
          st.ans.push({ g: slider.value, s, hints }); st.hints = 0; ctx.save();
          renderChain(true);
          fb.innerHTML = `<div class="pop row" style="gap:18px"><span>Reference estimate <b class="mono" style="font-size:22px">≈ ${MG.sci(f.a)}</b> ${f.u}</span>
            <span class="muted">You said ${MG.sci(slider.value)}${hints ? ` · ${hints} hint${hints > 1 ? "s" : ""}` : ""}</span><span class="gain">+${s}</span></div>`;
          const last = st.ans.length >= st.qs.length;
          const next = h("button", { class: "btn primary lg", onclick: () => (last ? end() : round()) }, last ? "See result" : "Next");
          btn.replaceWith(next); next.focus();
        }
      }
      const end = () => { const sc = st.ans.map((a) => a.s); ctx.finish(sc.reduce((a, b) => a + b, 0) / st.qs.length, { summary: st.qs.map((q, k) => `${sc[k]} · ${q.q}`).join("<br>"), share: MG.blocks(sc) }); };
      st.ans.length >= st.qs.length ? end() : round();
    },
  });
})();

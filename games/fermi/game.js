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

  // Template × place × time-period questions. Populations are rounded estimates (millions), shown in the chain.
  const PLACES = `India 1450|China 1410|the United States 340|Indonesia 280|Pakistan 250|Nigeria 230|Brazil 212|Bangladesh 173|Russia 144|Ethiopia 130|Mexico 130|Japan 124|Egypt 116
|the Philippines 116|DR Congo 109|Vietnam 101|Iran 91|Turkey 86|Germany 84|Thailand 72|the United Kingdom 69|Tanzania 68|France 68|South Africa 63|Italy 59|Kenya 56|Myanmar 54
|Colombia 53|South Korea 52|Sudan 50|Uganda 50|Spain 48|Algeria 47|Iraq 46|Argentina 46|Afghanistan 42|Canada 40|Morocco 38|Poland 37|Angola 37|Uzbekistan 36|Malaysia 35
|Mozambique 34|Ghana 34|Peru 34|Saudi Arabia 33|Côte d'Ivoire 31|Nepal 30|Cameroon 29|Venezuela 28|Australia 27|Sri Lanka 22|Chile 20|Kazakhstan 20|Romania 19|the Netherlands 18
|Ecuador 18|Senegal 18|Guatemala 18|Cambodia 17|Zimbabwe 17|Rwanda 14|Bolivia 12|Tunisia 12|Belgium 11.8|Cuba 11|Jordan 11|Czechia 10.9|Portugal 10.6|Sweden 10.6|Greece 10.3
|the United Arab Emirates 10|Israel 9.9|Hungary 9.6|Austria 9.1|Switzerland 8.9|Singapore 5.9|Denmark 5.9|Finland 5.6|Norway 5.5|Ireland 5.3|New Zealand 5.2|Mongolia 3.4|Qatar 2.9
|Jamaica 2.8|Fiji 0.93|Bhutan 0.79|the Maldives 0.52|Iceland 0.39|Mumbai 21|Delhi 33|Bengaluru 13.6|Kolkata 15.5|Chennai 11.5|Hyderabad 10.8|Pune 7.2|Ahmedabad 8.6|Jaipur 4.2
|Lucknow 3.9|Tokyo 37|Osaka 19|Shanghai 29|Beijing 22|Seoul 9.4|Jakarta 11|Manila 14.9|Bangkok 11|Karachi 17|Lahore 13.5|Dhaka 23|Cairo 22|Lagos 15|Kinshasa 17|Nairobi 5.3
|Johannesburg 6.2|Istanbul 15.7|Tehran 9.5|Moscow 12.6|London 9|Paris 11|Berlin 3.8|Madrid 6.8|Rome 4.3|New York City 19|Los Angeles 12.5|Chicago 9.3|Toronto 6.4|Mexico City 22
|São Paulo 22|Buenos Aires 15.6|Lima 11|Bogotá 11.5|Sydney 5.4|Melbourne 5.2|Dubai 3.7|Riyadh 7.7`
    .split("|").map((s) => s.trim()).filter(Boolean).map((s) => { const i = s.lastIndexOf(" "); return [s.slice(0, i), +s.slice(i + 1) * 1e6]; });

  // Rate templates: things each person does per year. The question asks per day, week, month or year.
  const RATES = [
    ["haircuts are given", "haircuts", [["Haircuts per person per year", 8]]], ["birthday cakes are bought", "cakes", [["Cakes bought per person per year", 0.4]]],
    ["eggs are eaten", "eggs", [["Eggs eaten per person per year", 200]]], ["cups of tea and coffee are drunk", "cups", [["Share who drink tea or coffee", 0.7], ["Cups per drinker per year (2 a day)", 730]]],
    ["litres of milk are drunk", "litres", [["Litres of milk per person per year", 60]]], ["bananas are eaten", "bananas", [["Bananas per person per year", 15]]],
    ["pizzas are eaten", "pizzas", [["Whole pizzas per person per year", 3]]], ["cinema tickets are sold", "tickets", [["Cinema visits per person per year", 1.5]]],
    ["books are bought", "books", [["Books bought per person per year", 3]]], ["pairs of shoes are bought", "pairs", [["Pairs bought per person per year", 3]]],
    ["umbrellas are bought", "umbrellas", [["Umbrellas bought per person per year", 0.3]]], ["toothbrushes are thrown away", "toothbrushes", [["Share who use a toothbrush", 0.9], ["Brushes replaced per year", 4]]],
    ["tubes of toothpaste are used up", "tubes", [["Share who brush with toothpaste", 0.9], ["Tubes per person per year", 6]]], ["bars of soap are used up", "bars", [["Bars of soap per person per year", 10]]],
    ["T-shirts are bought", "T-shirts", [["T-shirts bought per person per year", 5]]], ["kilometres are walked", "km", [["Kilometres walked per person per year (≈5 a day)", 1900]]],
    ["parcels are delivered", "parcels", [["Parcels received per person per year", 10]]], ["train journeys are made", "journeys", [["Train trips per person per year", 20]]],
    ["flights are taken", "flights", [["Flights per person per year", 0.5]]], ["babies are born", "babies", [["Births per person per year", 0.015]]],
    ["weddings take place", "weddings", [["Weddings per person per year", 0.004]]], ["visits to a doctor are made", "visits", [["Doctor visits per person per year", 4]]],
    ["ice creams are eaten", "ice creams", [["Ice creams per person per year", 20]]], ["chocolate bars are eaten", "bars", [["Chocolate bars per person per year", 25]]],
    ["apples are eaten", "apples", [["Apples per person per year", 20]]], ["loaves of bread (or the same in flatbreads) are eaten", "loaves", [["Loaves per person per year (1.5 a week)", 78]]],
    ["litres of water are drunk", "litres", [["Litres drunk per person per year (2 a day)", 730]]], ["smartphones are bought", "phones", [["Share who own a smartphone", 0.7], ["Phones bought per owner per year", 0.3]]],
    ["light bulbs are bought", "bulbs", [["Bulbs bought per person per year", 2]]], ["batteries are bought", "batteries", [["Batteries bought per person per year", 8]]],
    ["selfies are taken", "selfies", [["Share who take selfies", 0.5], ["Selfies per selfie-taker per year", 300]]], ["text messages are sent", "messages", [["Share with a phone", 0.8], ["Messages per owner per year (30 a day)", 10950]]],
    ["photos are taken", "photos", [["Share with a camera phone", 0.7], ["Photos per owner per year", 1000]]], ["kilograms of sugar are eaten", "kg", [["Kg of sugar per person per year", 25]]],
    ["songs are streamed", "streams", [["Share who stream music", 0.4], ["Songs streamed per listener per year", 3000]]], ["kilograms of rubbish are thrown away", "kg", [["Kg of household waste per person per year", 300]]],
  ];
  const PERIODS = [["each day", 365], ["each week", 52], ["each month", 12], ["each year", 1]];
  // Stock templates: how many of something exist.
  const STOCKS = [
    ["dentists work", "dentists", [["Dental visits per person per year", 0.8, "×"], ["Visits one dentist handles a year (8/day × 230 days)", 1840, "÷"]]],
    ["school buses would it take to carry every child aged 5–15", "buses", [["Share of people aged 5–15", 0.15, "×"], ["Seats per bus", 50, "÷"]]],
    ["hairdressers work", "hairdressers", [["Haircuts per person per year", 8, "×"], ["Haircuts one hairdresser gives a year (10/day × 300 days)", 3000, "÷"]]],
    ["doctors work", "doctors", [["Doctor visits per person per year", 4, "×"], ["Visits one doctor handles a year (25/day × 250 days)", 6250, "÷"]]],
    ["school teachers are there", "teachers", [["Share of people at school", 0.18, "×"], ["Students per teacher", 25, "÷"]]],
    ["schools are there", "schools", [["Share of people at school", 0.18, "×"], ["Students per school", 600, "÷"]]],
    ["pharmacies are there", "pharmacies", [["Prescriptions per person per year", 10, "×"], ["Prescriptions one pharmacy fills a year", 30000, "÷"]]],
    ["cinema screens are there", "screens", [["Cinema visits per person per year", 1.5, "×"], ["Tickets one screen sells a year", 50000, "÷"]]],
    ["bakeries would be needed to bake everyone's bread", "bakeries", [["Loaves per person per year", 78, "×"], ["Loaves one bakery bakes a year (500 a day)", 182500, "÷"]]],
  ];
  const withAnswer = (x) => ({ ...x, a: x.chain.reduce((acc, [, v, op]) => (op === "÷" ? acc / v : acc * v), 1) });
  function generate(r) {
    const [place, pop] = r.pick(PLACES);
    if (r() < 0.8) {
      const ti = r.int(0, RATES.length - 1), [what, u, f] = RATES[ti], pi = r.int(0, PERIODS.length - 1), [per, div] = PERIODS[pi];
      const chain = [[`People in ${place}`, pop, "×"], ...f.map(([l, v]) => [l, v, "×"])];
      if (div > 1) chain.push([`${per === "each day" ? "Days" : per === "each week" ? "Weeks" : "Months"} in a year`, div, "÷"]);
      return withAnswer({ id: `r:${ti}:${place}:${pi}`, q: `How many ${what} in ${place} ${per}?`, u, chain });
    }
    const si = r.int(0, STOCKS.length - 1), [what, u, f] = STOCKS[si];
    return withAnswer({ id: `s:${si}:${place}`, q: `How many ${what} in ${place}?`, u, chain: [[`People in ${place}`, pop, "×"], ...f] });
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
      // One classic question while any are left, the rest generated.
      const classic = ctx.rng.sample(CURATED.filter((c) => !ctx.isSeen(c.id)), 1).map(withAnswer);
      ctx.markSeen(classic.map((c) => c.id));
      const gen = ctx.draw(generate, ROUNDS - classic.length);
      if (!gen) return null;
      const qs = ctx.rng.shuffle([...classic, ...gen]);
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

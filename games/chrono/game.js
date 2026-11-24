/* Chrono — place historical moments on the timeline. */
const EVENTS = [
  ["Apollo 11 lands on the Moon", 1969], ["The Berlin Wall falls", 1989], ["The first iPhone goes on sale", 2007],
  ["Columbus reaches the Americas", 1492], ["The US Declaration of Independence is adopted", 1776], ["The storming of the Bastille", 1789],
  ["The Titanic sinks", 1912], ["World War I begins", 1914], ["World War II ends", 1945], ["India becomes independent", 1947],
  ["The Wright brothers' first powered flight", 1903], ["Darwin publishes On the Origin of Species", 1859], ["Newton publishes the Principia", 1687],
  ["The Magna Carta is sealed", 1215], ["Constantinople falls to the Ottomans", 1453], ["Luther posts his Ninety-five Theses", 1517],
  ["Galileo spots the moons of Jupiter", 1610], ["The first modern Olympic Games in Athens", 1896], ["Fleming discovers penicillin", 1928],
  ["Watson and Crick describe DNA's double helix", 1953], ["Sputnik 1 is launched", 1957], ["Tim Berners-Lee proposes the World Wide Web", 1989],
  ["The Chernobyl disaster", 1986], ["Euro notes and coins enter circulation", 2002], ["Wikipedia launches", 2001], ["Nelson Mandela is released from prison", 1990],
  ["The Soviet Union dissolves", 1991], ["The Battle of Hastings", 1066], ["Vesuvius buries Pompeii", 79], ["Gandhi leads the Salt March", 1930],
  ["Bell patents the telephone", 1876], ["Einstein publishes special relativity", 1905], ["The first human heart transplant", 1967],
  ["The Hubble Space Telescope is launched", 1990], ["The Eiffel Tower is completed", 1889], ["The Suez Canal opens", 1869], ["The Panama Canal opens", 1914],
  ["Yuri Gagarin becomes the first human in space", 1961], ["Pluto is discovered", 1930], ["Napoleon is defeated at Waterloo", 1815],
  ["The American Civil War ends", 1865], ["The Peace of Westphalia is signed", 1648], ["Chandrayaan-3 lands near the Moon's south pole", 2023],
  ["WHO declares COVID-19 a pandemic", 2020], ["The Bitcoin white paper is published", 2008], ["Google is founded", 1998],
  ["Ray Tomlinson sends the first network email", 1971], ["Construction of the Taj Mahal begins", 1632], ["The Black Death reaches Europe", 1347],
  ["Tokyo hosts the first Olympics held in Asia", 1964], ["Shakespeare is born", 1564], ["Magellan's expedition completes the first circumnavigation", 1522],
  ["The Great Fire of London", 1666], ["The Rosetta Stone is found", 1799], ["Queen Victoria takes the throne", 1837], ["The first Nobel Prizes are awarded", 1901],
].map(([e, y]) => ({ e, y }));
const ROUNDS = 5, NOW = 2026;

MG.css(`
.ch-card{font-size:24px;font-weight:650;letter-spacing:-.015em;padding:22px;border-radius:14px;background:var(--surface-2);margin-bottom:22px;line-height:1.3}
.ch-year{font:700 44px var(--mono);letter-spacing:-.03em;text-align:center;margin:4px 0}
.ch-line{position:relative;height:96px;margin-top:22px;border-top:2px solid var(--line)}
.ch-pin{position:absolute;top:-7px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;animation:fadeUp .4s var(--ease) both}
.ch-pin i{width:12px;height:12px;border-radius:50%;background:var(--accent);border:2px solid var(--surface)}
.ch-pin.you i{background:var(--ink-3)}
.ch-pin b{font:700 12px var(--mono)}
.ch-pin small{font-size:11px;color:var(--ink-2);max-width:110px;text-align:center;line-height:1.2}
`);

MG.game({
  slug: "chrono",
  howTo: `<p>Each card describes a moment in history. Slide to the year you think it happened.</p>
  <ul><li>The slider's window is randomized, so its edges don't give the answer away.</li>
  <li>Scoring is fair across eras: the further back an event is, the more slack you get (at least ±25 years, growing with age).</li>
  <li>${ROUNDS} cards per day.</li></ul>`,
  setup(ctx) {
    const { root, rng, h } = ctx;
    const evs = rng.sample(EVENTS, ROUNDS);
    const scores = [], guesses = [];
    let i = 0;

    function round() {
      const ev = evs[i];
      const span = ev.y < 1000 ? 1400 : ev.y < 1700 ? 700 : 400;
      let lo = ev.y - rng.int(Math.round(span * 0.15), Math.round(span * 0.85));
      let hi = lo + span;
      if (hi > NOW) { lo -= hi - NOW; hi = NOW; }
      if (lo < -500) lo = -500;
      root.innerHTML = "";
      const range = h("input", { type: "range", min: lo, max: hi, value: Math.round((lo + hi) / 2), step: 1 });
      const yr = h("div", { class: "ch-year" });
      const fmtY = (y) => (y < 0 ? `${-y} BCE` : `${y}`);
      const show = () => (yr.textContent = fmtY(+range.value));
      range.addEventListener("input", show); show();
      range.addEventListener("keydown", (e) => e.key === "Enter" && submit());
      const fb = h("div", { class: "feedback" });
      const btn = h("button", { class: "btn primary lg", onclick: submit }, "Place it");
      root.append(
        h("div", { class: "stage-top" }, h("div", { class: "dots" }, ...evs.map((_, k) => h("i", { class: k < i ? "on" : k === i ? "cur" : "" }))), h("span", { class: "faint mono" }, `${i + 1} / ${ROUNDS}`)),
        h("div", { class: "ch-card" }, ev.e), yr, range,
        h("div", { class: "row faint mono", style: "justify-content:space-between;font-size:12px" }, h("span", {}, fmtY(lo)), h("span", {}, fmtY(hi))),
        h("div", { class: "row", style: "margin-top:18px" }, btn), fb);
      range.focus();
      let locked = false;
      function submit() {
        if (locked) return; locked = true; range.disabled = true;
        const g = +range.value, err = Math.abs(g - ev.y);
        const tol = Math.max(25, (NOW - ev.y) / 6);
        const s = Math.max(0, Math.round(100 * (1 - err / tol)));
        scores.push(s); guesses.push(g);
        fb.innerHTML = `<div class="pop row" style="gap:18px"><span>It was <b class="mono" style="font-size:22px">${fmtY(ev.y)}</b></span>
          <span class="muted">${err === 0 ? "Exactly right!" : `${err} year${err > 1 ? "s" : ""} off`}</span><span class="mono" style="color:var(--accent);font-size:22px">+${s}</span></div>`;
        fb.append(timeline());
        const next = h("button", { class: "btn primary lg", onclick: () => { i++; i < ROUNDS ? round() : end(); } }, i + 1 < ROUNDS ? "Next" : "See result");
        btn.replaceWith(next); next.focus();
      }
    }
    function timeline() {
      const done = evs.slice(0, scores.length);
      const ys = done.map((e) => e.y).concat(guesses);
      const mn = Math.min(...ys) - 10, mx = Math.max(...ys) + 10, X = (y) => 4 + ((y - mn) / (mx - mn)) * 92;
      const line = h("div", { class: "ch-line" });
      const sorted = done.map((e, k) => ({ ...e, k })).sort((a, b) => a.y - b.y);
      sorted.forEach((e, idx) => line.append(h("div", { class: "ch-pin", style: `left:${X(e.y)}%;top:${idx % 2 ? 26 : -7}px` }, h("i"), h("b", {}, e.y < 0 ? `${-e.y} BCE` : e.y), h("small", {}, e.e.length > 34 ? e.e.slice(0, 32) + "…" : e.e))));
      return line;
    }
    function end() {
      ctx.finish(scores.reduce((a, b) => a + b, 0) / ROUNDS, {
        summary: evs.map((e, k) => `${e.y}: ${e.e} <span class="mono">(${guesses[k]}, +${scores[k]})</span>`).join("<br>"),
        share: MG.blocks(scores),
      });
    }
    round();
  },
});

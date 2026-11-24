/* Equilibrium — each symbol hides a digit; row and column sums reveal them. */
const SYMS = [
  { s: "▲", c: "#e8590c" }, { s: "●", c: "#1c7ed6" }, { s: "■", c: "#2f9e44" }, { s: "◆", c: "#ae3ec9" },
];
const SIZE = 4, MAX_CHECKS = 6;

function solutions(grid, rows, cols, limit = 2) {
  const found = [];
  const v = [0, 0, 0, 0];
  for (v[0] = 1; v[0] <= 9; v[0]++) for (v[1] = 1; v[1] <= 9; v[1]++) for (v[2] = 1; v[2] <= 9; v[2]++) for (v[3] = 1; v[3] <= 9; v[3]++) {
    let ok = true;
    for (let r = 0; r < SIZE && ok; r++) ok = grid[r].reduce((a, s) => a + v[s], 0) === rows[r];
    for (let c = 0; c < SIZE && ok; c++) ok = grid.reduce((a, row) => a + v[row[c]], 0) === cols[c];
    if (ok) { found.push(v.slice()); if (found.length >= limit) return found; }
  }
  return found;
}
function makePuzzle(rng) {
  for (let tries = 0; tries < 400; tries++) {
    const vals = SYMS.map(() => rng.int(1, 9));
    if (new Set(vals).size < 3) continue;
    const grid = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => rng.int(0, SYMS.length - 1)));
    const counts = [0, 0, 0, 0]; grid.flat().forEach((s) => counts[s]++);
    if (counts.some((n) => n < 2)) continue;
    const rows = grid.map((row) => row.reduce((a, s) => a + vals[s], 0));
    const cols = [0, 1, 2, 3].map((c) => grid.reduce((a, row) => a + vals[row[c]], 0));
    if (solutions(grid, rows, cols).length === 1) return { grid, rows, cols, vals };
  }
  throw new Error("no puzzle");
}

MG.css(`
.eq-wrap{display:grid;grid-template-columns:auto 1fr;gap:36px;align-items:start}
@media(max-width:760px){.eq-wrap{grid-template-columns:1fr;justify-items:stretch}.eq-grid{justify-content:center}}
.eq-grid{display:grid;grid-template-columns:repeat(${SIZE},56px) 56px;gap:6px}
.eq-cell{width:56px;height:56px;border-radius:12px;background:var(--surface-2);display:grid;place-items:center;font-size:26px;transition:transform .2s}
.eq-sum{display:grid;place-items:center;font:700 18px var(--mono);color:var(--ink-2);height:56px}
.eq-sum.col{height:40px}
.eq-cell.hl{transform:scale(1.1);box-shadow:0 0 0 2px currentColor}
.eq-vars{display:grid;gap:10px;min-width:0}
.eq-var{display:flex;align-items:center;gap:12px;background:var(--surface-2);border-radius:12px;padding:8px 10px}
.eq-var .sym{font-size:26px;width:34px;text-align:center;cursor:default}
.eq-var .val{font:700 24px var(--mono);width:34px;text-align:center}
.eq-var .digits{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;margin-left:auto;flex:1;max-width:260px}
.eq-var .digits button{height:30px;min-width:0;border-radius:6px;border:0;background:var(--surface);font:600 12px var(--mono);cursor:pointer;padding:0}
.eq-var .digits button.on{background:var(--accent);color:#fff}
.eq-log{font-size:13px;color:var(--ink-2);margin-top:6px}
`);

MG.game({
  slug: "equilibrium",
  howTo: `<p>Every symbol stands for a whole number from 1 to 9 (two symbols may share a value). The numbers at the end of each row and column are their sums.</p>
  <ul><li>Work out each symbol's value and set it with the digit buttons.</li>
  <li><b>Check</b> tells you only <i>how many</i> symbols are right, not which ones.</li>
  <li>Each puzzle has exactly one solution. Solving on the first check scores 100, and each extra check costs 15. You get ${MAX_CHECKS} checks.</li>
  <li>Hover a symbol on the right to light it up in the grid.</li></ul>`,
  setup(ctx) {
    const { root, rng, h } = ctx;
    const P = makePuzzle(rng);
    const guess = [null, null, null, null];
    let checks = 0, over = false;
    const log = [];

    const gridEl = h("div", { class: "eq-grid" });
    P.grid.forEach((row, r) => {
      row.forEach((s) => gridEl.append(h("div", { class: "eq-cell", "data-s": s, style: `color:${SYMS[s].c}` }, SYMS[s].s)));
      gridEl.append(h("div", { class: "eq-sum" }, `${P.rows[r]}`));
    });
    P.cols.forEach((v) => gridEl.append(h("div", { class: "eq-sum col" }, `${v}`)));
    gridEl.append(h("div"));

    const vars = h("div", { class: "eq-vars" });
    const logEl = h("div", { class: "eq-log mono" });
    const btn = h("button", { class: "btn primary lg", onclick: check }, "Check");
    const giveUp = h("button", { class: "btn ghost sm", onclick: () => !over && end(false) }, "Reveal answer");
    const fb = h("div", { class: "feedback" });

    function renderVars() {
      vars.innerHTML = "";
      SYMS.forEach((sym, k) => {
        const row = h("div", { class: "eq-var", onmouseenter: () => hl(k, true), onmouseleave: () => hl(k, false) },
          h("span", { class: "sym", style: `color:${sym.c}` }, sym.s), h("span", { class: "val" }, guess[k] ?? "?"));
        const dg = h("div", { class: "digits" });
        for (let d = 1; d <= 9; d++) dg.append(h("button", { class: guess[k] === d ? "on" : "", disabled: over, onclick: () => { guess[k] = d; renderVars(); } }, d));
        row.append(dg); vars.append(row);
      });
      btn.disabled = over || guess.some((g) => g == null);
    }
    const hl = (k, on) => gridEl.querySelectorAll(`[data-s="${k}"]`).forEach((c) => c.classList.toggle("hl", on));

    root.append(
      h("div", { class: "stage-top" }, h("span", { class: "pill" }, `Checks left `, h("b", { class: "mono", id: "eq-left" }, `${MAX_CHECKS}`)), giveUp),
      h("div", { class: "eq-wrap" }, gridEl, h("div", {}, vars, h("div", { class: "row", style: "margin-top:16px" }, btn), logEl)), fb);
    renderVars();

    function check() {
      if (over || guess.some((g) => g == null)) return;
      checks++;
      const right = guess.filter((g, k) => g === P.vals[k]).length;
      log.push(`${guess.join(" ")} → ${right}/4`);
      logEl.innerHTML = log.map((l) => `<div>${l}</div>`).join("");
      root.querySelector("#eq-left").textContent = MAX_CHECKS - checks;
      if (right === 4) return end(true);
      fb.innerHTML = `<span class="pop">${right} of 4 correct</span>`;
      if (checks >= MAX_CHECKS) end(false);
    }
    function end(won) {
      over = true;
      if (!won) P.vals.forEach((v, k) => (guess[k] = v));
      renderVars();
      const score = won ? Math.max(25, 100 - (checks - 1) * 15) : 0;
      fb.innerHTML = won ? `<span class="pop" style="color:var(--good)">Balanced in ${checks} check${checks > 1 ? "s" : ""}</span>` : `<span class="pop">Answer: ${SYMS.map((s, k) => `${s.s} = ${P.vals[k]}`).join(", ")}</span>`;
      ctx.finish(score, { summary: `${SYMS.map((s, k) => `${s.s} = ${P.vals[k]}`).join(" · ")}<br>${won ? `Solved with ${checks} check${checks > 1 ? "s" : ""}.` : "Not solved."}`, share: `${won ? checks : "X"}/${MAX_CHECKS} checks` });
    }
  },
});

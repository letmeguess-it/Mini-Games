/* Liar — find a number from 1–100 while the oracle lies exactly once. */
const MAXN = 100, MAXQ = 14, TRACKER_COST = 15;

MG.css(`
.lr-hist{display:flex;flex-direction:column;gap:6px;margin:16px 0;max-height:260px;overflow:auto}
.lr-item{display:flex;align-items:center;gap:12px;background:var(--surface-2);border-radius:10px;padding:8px 12px;animation:fadeUp .3s var(--ease)}
.lr-item .n{font:700 18px var(--mono);width:44px}
.lr-item .ans{font-weight:700}
.lr-item .ans.hi{color:var(--accent)}.lr-item .ans.lo{color:#e8590c}
.lr-item .k{color:var(--ink-3);font:12px var(--mono);width:24px}
.lr-track{display:grid;grid-template-columns:repeat(20,1fr);gap:3px;margin-top:14px}
.lr-track span{height:22px;border-radius:4px;background:var(--surface-2);font:9px var(--mono);display:grid;place-items:center;color:var(--ink-3);transition:all .3s}
.lr-track span.c0{background:color-mix(in srgb,var(--good) 30%,var(--surface-2));color:var(--ink)}
.lr-track span.c1{background:color-mix(in srgb,#e8590c 22%,var(--surface-2));color:var(--ink-2)}
.lr-track span.c2{opacity:.25}
`);

MG.game({
  slug: "liar",
  howTo: `<p>I'm thinking of a whole number from 1 to ${MAXN}. Ask about a number and I'll say <b>higher</b>, <b>lower</b> or <b>correct</b>.</p>
  <ul><li>Somewhere in the game <b>exactly one</b> "higher" or "lower" answer will be a lie. "Correct" is always true. If you find the number before the lie comes, lucky you.</li>
  <li>Plain binary search breaks. Ask again to cross-check, and keep track of which numbers would need one lie or two to be the answer.</li>
  <li>You have ${MAXQ} questions. Finding it in 8 or fewer scores 100, and each extra question costs 9.</li>
  <li>The <b>tracker</b> does the bookkeeping for you (green = no lie needed, orange = needs the lie) but costs ${TRACKER_COST} points.</li></ul>`,
  setup(ctx) {
    const { root, rng, h } = ctx;
    const secret = rng.int(1, MAXN);
    const lieAt = rng.int(2, 7); // the k-th non-correct answer is a lie
    const asked = [];
    let nonCorrect = 0, over = false, tracker = false;

    const input = h("input", { class: "input", type: "number", min: 1, max: MAXN, placeholder: `1 – ${MAXN}`, style: "max-width:160px" });
    const btn = h("button", { class: "btn primary lg", onclick: ask }, "Ask");
    const trackBtn = h("button", { class: "btn sm", onclick: () => { if (over) return; tracker = true; trackBtn.disabled = true; trackBtn.textContent = "Tracker on"; render(); } }, `Use tracker (−${TRACKER_COST})`);
    const hist = h("div", { class: "lr-hist" });
    const track = h("div", { class: "lr-track" });
    const fb = h("div", { class: "feedback" });
    root.append(
      h("div", { class: "stage-top" }, h("span", { class: "pill", id: "lr-q" }, `Questions left ${MAXQ}`), trackBtn),
      h("p", { class: "big-q" }, "Is it…"),
      h("div", { class: "row" }, input, btn), hist, track, fb);
    input.addEventListener("keydown", (e) => e.key === "Enter" && ask());
    input.focus();

    function contradictions(n) {
      return asked.reduce((acc, a) => acc + (a.ans === "higher" ? (n > a.n ? 0 : 1) : a.ans === "lower" ? (n < a.n ? 0 : 1) : 0), 0);
    }
    function render() {
      hist.innerHTML = "";
      asked.slice().reverse().forEach((a, k) => hist.append(h("div", { class: "lr-item" },
        h("span", { class: "k" }, `#${asked.length - k}`), h("span", { class: "n" }, a.n),
        h("span", { class: `ans ${a.ans === "higher" ? "hi" : a.ans === "lower" ? "lo" : ""}` }, a.ans === "higher" ? "↑ higher" : a.ans === "lower" ? "↓ lower" : "✓ correct"),
        a.lie ? h("span", { class: "faint", style: "margin-left:auto;font-size:12px" }, "that was the lie") : null)));
      track.innerHTML = "";
      if (tracker || over) for (let n = 1; n <= MAXN; n++) {
        const c = Math.min(2, contradictions(n));
        track.append(h("span", { class: `c${c}`, title: c === 0 ? "consistent" : c === 1 ? "possible only if one answer was the lie" : "impossible" }, n));
      }
      root.querySelector("#lr-q").textContent = `Questions left ${MAXQ - asked.length}`;
    }
    function ask() {
      if (over) return;
      const n = Math.round(+input.value);
      if (!(n >= 1 && n <= MAXN)) { input.classList.add("shake"); setTimeout(() => input.classList.remove("shake"), 300); return; }
      input.value = ""; input.focus();
      if (n === secret) { asked.push({ n, ans: "correct" }); render(); return end(true); }
      nonCorrect++;
      const truth = secret > n ? "higher" : "lower";
      const lie = nonCorrect === lieAt;
      asked.push({ n, ans: lie ? (truth === "higher" ? "lower" : "higher") : truth, lie: false, _lie: lie });
      render();
      if (asked.length >= MAXQ) end(false);
    }
    function end(won) {
      over = true; btn.disabled = input.disabled = true;
      asked.forEach((a) => (a.lie = a._lie));
      render();
      const q = asked.length;
      let score = won ? (q <= 8 ? 100 : Math.max(10, 100 - (q - 8) * 9)) : 0;
      if (tracker) score = Math.max(0, score - TRACKER_COST);
      const lieIdx = asked.findIndex((a) => a._lie);
      fb.innerHTML = won ? `<span class="pop" style="color:var(--good)">Got it: <b class="mono">${secret}</b> in ${q}</span>` : `<span class="pop">The number was <b class="mono">${secret}</b></span>`;
      ctx.finish(score, {
        summary: `${won ? `Found <b>${secret}</b> in ${q} questions` : `The number was <b>${secret}</b>`}. ${lieIdx >= 0 ? `The lie was answer #${lieIdx + 1}.` : "You won before the lie came."}${tracker ? " Tracker used." : ""}`,
        share: `${won ? q : "X"}/${MAXQ} questions${tracker ? " (tracker)" : ""}\n${asked.map((a) => (a.ans === "correct" ? "✅" : a._lie ? "🤥" : a.ans === "higher" ? "⬆️" : "⬇️")).join("")}`,
      });
    }
  },
});

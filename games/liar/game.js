/* Liar — find a number while the oracle lies exactly once. */
(function () {
  const MAXQ = 14, TRACKER_COST = 15, RANGES = [100, 120, 150, 200];
  MG.css(`
  .lr-hist{display:flex;flex-direction:column;gap:6px;margin:16px 0;max-height:260px;overflow:auto}
  .lr-item{display:flex;align-items:center;gap:12px;background:var(--surface-2);border-radius:10px;padding:8px 12px;animation:fadeUp .3s var(--ease)}
  .lr-item .n{font:700 18px var(--mono);width:48px}.lr-item .ans{font-weight:700}
  .lr-item .ans.hi{color:var(--accent)}.lr-item .ans.lo{color:#e8590c}.lr-item .k{color:var(--ink-3);font:12px var(--mono);width:26px}
  .lr-track{display:grid;grid-template-columns:repeat(20,1fr);gap:3px;margin-top:14px}
  .lr-track span{height:22px;border-radius:4px;background:var(--surface-2);font:9px var(--mono);display:grid;place-items:center;color:var(--ink-3)}
  .lr-track span.c0{background:color-mix(in srgb,var(--good) 30%,var(--surface-2));color:var(--ink)}
  .lr-track span.c1{background:color-mix(in srgb,#e8590c 22%,var(--surface-2));color:var(--ink-2)}.lr-track span.c2{opacity:.25}`);

  MG.define({
    slug: "liar",
    howTo: `<p>I'm thinking of a whole number in the range shown. Ask about a number and I'll say <b>higher</b>, <b>lower</b> or <b>correct</b>.</p>
    <ul><li>Somewhere in the game <b>exactly one</b> "higher" or "lower" answer will be a lie. "Correct" is always true. Find the number before the lie comes and it never happens.</li>
    <li>Plain binary search breaks. Cross-check, and keep track of which numbers would need one lie, or two, to be the answer.</li>
    <li>You have ${MAXQ} questions. Finding it in 8 or fewer scores 100, and each extra question costs 9.</li>
    <li>The <b>tracker</b> does the bookkeeping for you but costs ${TRACKER_COST} points. No puzzle ever repeats.</li></ul>`,
    progress: (s) => `${s.asked.length} of ${MAXQ} questions asked`,
    init(ctx) {
      for (let t = 0; t < 2000; t++) {
        const max = ctx.rng.pick(RANGES), secret = ctx.rng.int(1, max), lieAt = ctx.rng.int(2, 7), sig = `${max}:${secret}:${lieAt}`;
        if (!ctx.isSeen(sig)) { ctx.markSeen([sig]); return { max, secret, lieAt, asked: [], nonCorrect: 0, tracker: false }; }
      }
      return null;
    },
    render(ctx, st) {
      const { root, h } = ctx;
      let over = false;
      const input = h("input", { class: "input", type: "number", min: 1, max: st.max, placeholder: `1 – ${st.max}`, style: "max-width:160px", "aria-label": "Your guess" });
      const btn = h("button", { class: "btn primary lg", onclick: ask }, "Ask");
      const trackBtn = h("button", { class: "btn sm", onclick: () => { if (over || st.tracker) return; st.tracker = true; ctx.save(); draw(); } });
      const qLeft = h("span", { class: "pill" }), hist = h("div", { class: "lr-hist" }), track = h("div", { class: "lr-track" }), fb = h("div", { class: "feedback" });
      root.append(h("div", { class: "stage-top" }, qLeft, trackBtn), h("p", { class: "big-q" }, `Is it… `, h("span", { class: "faint", style: "font-size:16px;font-weight:500" }, `(a number from 1 to ${st.max})`)),
        h("div", { class: "row" }, input, btn), hist, track, fb);
      input.addEventListener("keydown", (e) => e.key === "Enter" && ask());
      const contradictions = (n) => st.asked.reduce((a, q) => a + (q.ans === "higher" ? (n > q.n ? 0 : 1) : q.ans === "lower" ? (n < q.n ? 0 : 1) : 0), 0);
      function draw() {
        hist.innerHTML = "";
        st.asked.slice().reverse().forEach((a, k) => hist.append(h("div", { class: "lr-item" }, h("span", { class: "k" }, `#${st.asked.length - k}`), h("span", { class: "n" }, a.n),
          h("span", { class: `ans ${a.ans === "higher" ? "hi" : a.ans === "lower" ? "lo" : ""}` }, a.ans === "higher" ? "↑ higher" : a.ans === "lower" ? "↓ lower" : "✓ correct"),
          over && a.lie ? h("span", { class: "faint", style: "margin-left:auto;font-size:12px" }, "that was the lie") : null)));
        track.innerHTML = "";
        if (st.tracker || over) for (let n = 1; n <= st.max; n++) { const c = Math.min(2, contradictions(n)); track.append(h("span", { class: `c${c}`, title: ["consistent", "possible only if one answer was the lie", "impossible"][c] }, n)); }
        qLeft.textContent = `Questions left ${MAXQ - st.asked.length}`;
        trackBtn.textContent = st.tracker ? "Tracker on" : `Use tracker (−${TRACKER_COST})`; trackBtn.disabled = st.tracker || over;
      }
      function ask() {
        if (over) return;
        const n = Math.round(+input.value);
        if (!(n >= 1 && n <= st.max)) { input.classList.add("shake"); setTimeout(() => input.classList.remove("shake"), 300); return; }
        input.value = ""; input.focus();
        if (n === st.secret) { st.asked.push({ n, ans: "correct" }); ctx.save(); return end(true); }
        st.nonCorrect++;
        const truth = st.secret > n ? "higher" : "lower", lie = st.nonCorrect === st.lieAt;
        st.asked.push({ n, ans: lie ? (truth === "higher" ? "lower" : "higher") : truth, lie }); ctx.save(); draw();
        if (st.asked.length >= MAXQ) end(false);
      }
      function end(won) {
        over = true; btn.disabled = input.disabled = true; draw();
        const q = st.asked.length, lieIdx = st.asked.findIndex((a) => a.lie);
        let score = won ? (q <= 8 ? 100 : Math.max(10, 100 - (q - 8) * 9)) : 0;
        if (st.tracker) score = Math.max(0, score - TRACKER_COST);
        fb.innerHTML = won ? `<span class="pop" style="color:var(--good)">Got it: <b class="mono">${st.secret}</b> in ${q}</span>` : `<span class="pop">The number was <b class="mono">${st.secret}</b></span>`;
        ctx.finish(score, {
          summary: `${won ? `Found <b>${st.secret}</b> in ${q} questions` : `The number was <b>${st.secret}</b>`}. ${lieIdx >= 0 ? `The lie was answer #${lieIdx + 1}.` : "You won before the lie came."}${st.tracker ? " Tracker used." : ""}`,
          share: `${won ? q : "X"}/${MAXQ} questions${st.tracker ? " (tracker)" : ""}\n${st.asked.map((a) => (a.ans === "correct" ? "✅" : a.lie ? "🤥" : a.ans === "higher" ? "⬆️" : "⬇️")).join("")}` });
      }
      draw();
      if (st.asked.some((a) => a.ans === "correct")) end(true); else if (st.asked.length >= MAXQ) end(false); else input.focus({ preventScroll: true });
    },
  });
})();

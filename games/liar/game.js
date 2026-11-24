/* Liar — find the hidden number. The oracle answers "higher" or "lower",
 * but exactly one of those answers will be a lie. A live number line shows
 * which numbers are still possible, so the puzzle is about choosing good questions. */
(function () {
  const budgetFor = (max) => Math.ceil(Math.log2(max)) + 7, parFor = (max) => Math.ceil(Math.log2(max)) + 1;
  MG.css(`
  .lr-rules{background:var(--surface-2);border-radius:14px;padding:14px 16px;margin-bottom:18px;font-size:14.5px;line-height:1.5}
  .lr-rules b{color:var(--accent)}
  .lr-ask{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .lr-ask .q{font-size:22px;font-weight:650}
  .lr-line{position:relative;margin:30px 0 8px;padding-top:26px}
  .lr-bar{display:flex;height:34px;border-radius:10px;overflow:hidden;cursor:crosshair;box-shadow:inset 0 0 0 1px var(--line)}
  .lr-bar span{height:100%;transition:background .3s}
  .lr-bar .c0{background:color-mix(in srgb,var(--good) 55%,var(--surface))}
  .lr-bar .c1{background:color-mix(in srgb,#f59f00 45%,var(--surface))}
  .lr-bar .c2{background:var(--surface-2)}
  .lr-tick{position:absolute;top:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;font:700 11px var(--mono);pointer-events:none}
  .lr-tick i{width:2px;height:48px;background:var(--ink-2);margin-top:2px}
  .lr-tick.hi{color:var(--accent)}.lr-tick.lo{color:#e8590c}.lr-tick.lie{text-decoration:line-through}
  .lr-ends{display:flex;justify-content:space-between;font:600 12px var(--mono);color:var(--ink-3);margin-top:6px}
  .lr-hover{position:absolute;top:-4px;transform:translateX(-50%);font:700 12px var(--mono);background:var(--ink);color:var(--bg);padding:2px 6px;border-radius:6px;pointer-events:none;display:none}
  .lr-legend{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--ink-2);margin:10px 0 4px}
  .lr-legend i{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-1px;margin-right:6px}
  .lr-count{font-size:13px;color:var(--ink-2)}
  .lr-hist{display:flex;flex-direction:column;gap:6px;margin-top:16px}
  .lr-item{display:flex;align-items:center;gap:10px;background:var(--surface-2);border-radius:10px;padding:9px 12px;font-size:14px;animation:fadeUp .3s var(--ease)}
  .lr-item .k{color:var(--ink-3);font:12px var(--mono);width:28px}.lr-item b{font-family:var(--mono)}
  .lr-item .hi{color:var(--accent);font-weight:700}.lr-item .lo{color:#e8590c;font-weight:700}.lr-item .ok{color:var(--good);font-weight:700}
  .lr-item .lie{margin-left:auto;font-size:12px;color:var(--bad);font-weight:700}`);

  MG.define({
    slug: "liar",
    howTo: `<p>I've picked a secret whole number. Ask "Is it <i>n</i>?" and I'll answer <b>higher</b>, <b>lower</b> or <b>correct</b>.</p>
    <ul><li><b>The twist:</b> exactly one of my "higher"/"lower" answers during the game is a lie. I won't tell you which one. ("Correct" is always true.)</li>
    <li>The coloured bar shows what's still possible. <b>Green</b> numbers fit every answer so far. <b>Amber</b> numbers would fit only if one particular answer was the lie. <b>Grey</b> numbers are ruled out, because they'd need two lies.</li>
    <li>Asking about the same region twice catches the lie. Tap the bar to pick a number.</li>
    <li>Win by asking the exact number. Finding it within par scores 100, and each extra question costs 9. The range (up to 1–300) and question budget change every game.</li></ul>`,
    progress: (s) => `1–${s.max} · ${s.asked.length} of ${budgetFor(s.max)} questions asked`,
    init(ctx) {
      const seen = ctx.seen();
      for (let t = 0; t < 2000; t++) {
        const max = 10 * ctx.rng.int(5, 30), secret = ctx.rng.int(1, max), lieAt = ctx.rng.int(2, 6), sig = `${max}:${secret}:${lieAt}`;
        if (!seen.has(sig)) { ctx.markSeen([sig]); return { max, secret, lieAt, asked: [], nonCorrect: 0 }; }
      }
      return null;
    },
    render(ctx, st) {
      const { root, h } = ctx;
      const MAXQ = budgetFor(st.max), PAR = parFor(st.max);
      let over = false;
      const input = h("input", { class: "input", type: "number", min: 1, max: st.max, placeholder: `1 – ${st.max}`, style: "max-width:140px", "aria-label": "Your guess" });
      const btn = h("button", { class: "btn primary lg", onclick: ask }, "Ask");
      const pill = h("span", { class: "pill" });
      const bar = h("div", { class: "lr-bar", title: "Tap to choose a number" });
      const hover = h("div", { class: "lr-hover" });
      const ticks = h("div");
      const line = h("div", { class: "lr-line" }, ticks, hover, bar, h("div", { class: "lr-ends" }, h("span", {}, "1"), h("span", {}, `${st.max}`)));
      const count = h("div", { class: "lr-count" });
      const hist = h("div", { class: "lr-hist" }), fb = h("div", { class: "feedback" });
      root.append(
        h("div", { class: "stage-top" }, pill, h("span", { class: "faint mono", style: "font-size:13px" }, `par ${PAR}`)),
        h("div", { class: "lr-rules", html: `I've picked a number from <b>1 to ${st.max}</b>. Ask me about any number and I'll say if mine is <b>higher</b> or <b>lower</b>. But <b>one</b> of my answers will be a <b>lie</b>, and I won't say which. The bar below keeps track of what's still possible.` }),
        h("div", { class: "lr-ask" }, h("span", { class: "q" }, "Is it"), input, h("span", { class: "q" }, "?"), btn),
        line,
        h("div", { class: "lr-legend" }, h("span", { html: `<i style="background:color-mix(in srgb,var(--good) 55%,var(--surface))"></i>fits every answer` }),
          h("span", { html: `<i style="background:color-mix(in srgb,#f59f00 45%,var(--surface))"></i>fits if one answer was the lie` }),
          h("span", { html: `<i style="background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line)"></i>ruled out` })),
        count, hist, fb);
      input.addEventListener("keydown", (e) => e.key === "Enter" && ask());
      const numAt = (e) => { const b = bar.getBoundingClientRect(); return Math.min(st.max, Math.max(1, Math.ceil(((e.clientX - b.left) / b.width) * st.max))); };
      bar.addEventListener("pointermove", (e) => { if (over) return; const n = numAt(e); hover.style.display = "block"; hover.style.left = `${((n - 0.5) / st.max) * 100}%`; hover.textContent = n; });
      bar.addEventListener("pointerleave", () => (hover.style.display = "none"));
      bar.addEventListener("click", (e) => { if (over) return; input.value = numAt(e); input.focus(); });

      const contradictions = (n) => st.asked.reduce((a, q) => a + (q.ans === "higher" ? (n > q.n ? 0 : 1) : q.ans === "lower" ? (n < q.n ? 0 : 1) : 0), 0);
      function draw() {
        // Number line: runs of numbers with the same status become one coloured segment.
        const c = Array.from({ length: st.max }, (_, k) => Math.min(2, contradictions(k + 1)));
        bar.innerHTML = "";
        let start = 0;
        for (let k = 1; k <= st.max; k++) if (k === st.max || c[k] !== c[start]) { bar.append(h("span", { class: `c${c[start]}`, style: `width:${((k - start) / st.max) * 100}%` })); start = k; }
        ticks.innerHTML = "";
        st.asked.forEach((q) => ticks.append(h("div", { class: `lr-tick ${q.ans === "higher" ? "hi" : q.ans === "lower" ? "lo" : ""} ${over && q.lie ? "lie" : ""}`, style: `left:${((q.n - 0.5) / st.max) * 100}%` },
          `${q.ans === "higher" ? "↑" : q.ans === "lower" ? "↓" : "✓"}${q.n}`, h("i"))));
        const green = c.filter((x) => x === 0).length, amber = c.filter((x) => x === 1).length;
        count.textContent = over ? "" : `Still possible: ${green} green${amber ? ` + ${amber} amber` : ""} number${green + amber === 1 ? "" : "s"}.`;
        hist.innerHTML = "";
        st.asked.slice().reverse().forEach((q, k) => hist.append(h("div", { class: "lr-item" }, h("span", { class: "k" }, `Q${st.asked.length - k}`),
          h("span", { html: `Is it <b>${q.n}</b>? → ${q.ans === "higher" ? `<span class="hi">Higher</span> (mine is above ${q.n})` : q.ans === "lower" ? `<span class="lo">Lower</span> (mine is below ${q.n})` : `<span class="ok">Correct!</span>`}` }),
          over && q.lie ? h("span", { class: "lie" }, "← this was the lie") : null)));
        pill.textContent = `Questions left ${MAXQ - st.asked.length}`;
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
        const score = won ? (q <= PAR ? 100 : Math.max(10, 100 - (q - PAR) * 9)) : 0;
        fb.innerHTML = won ? `<span class="pop" style="color:var(--good)">Got it: <b class="mono">${st.secret}</b> in ${q} questions</span>` : `<span class="pop">Out of questions. The number was <b class="mono">${st.secret}</b></span>`;
        ctx.finish(score, {
          summary: `${won ? `Found <b>${st.secret}</b> in ${q} questions (par ${PAR})` : `The number was <b>${st.secret}</b>`}. ${lieIdx >= 0 ? `The lie was question ${lieIdx + 1}.` : "You found it before the lie came."}`,
          share: `${won ? q : "X"}/${MAXQ} questions, par ${PAR}\n${st.asked.map((a) => (a.ans === "correct" ? "✅" : a.lie ? "🤥" : a.ans === "higher" ? "⬆️" : "⬇️")).join("")}` });
      }
      draw();
      if (st.asked.some((a) => a.ans === "correct")) end(true); else if (st.asked.length >= MAXQ) end(false); else input.focus({ preventScroll: true });
    },
  });
})();

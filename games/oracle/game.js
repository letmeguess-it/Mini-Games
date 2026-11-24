/* Oracle — discover a secret rule about numbers 1–99 by testing them. */
(function () {
  const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
  const ds = (n) => String(n).split("").reduce((a, b) => a + +b, 0);
  const divisors = (n) => { let c = 0; for (let d = 1; d <= n; d++) if (n % d === 0) c++; return c; };
  const FIB = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]), TRI = new Set(Array.from({ length: 13 }, (_, k) => ((k + 1) * (k + 2)) / 2));
  const NUMS = Array.from({ length: 99 }, (_, k) => k + 1);

  // Every rule gets a stable id; rules with an identical set of members are merged.
  function buildRules() {
    const raw = [];
    const add = (id, label, f) => raw.push({ id, label, f });
    for (let k = 2; k <= 13; k++) add(`mul:${k}`, `is a multiple of ${k}`, (n) => n % k === 0);
    for (let k = 3; k <= 9; k++) for (let r = 1; r < k; r++) add(`rem:${k}:${r}`, `leaves remainder ${r} when divided by ${k}`, (n) => n % k === r);
    for (let N = 20; N <= 80; N += 10) { add(`gt:${N}`, `is greater than ${N}`, (n) => n > N); add(`lt:${N}`, `is less than ${N}`, (n) => n < N); }
    for (let a = 10; a <= 60; a += 10) for (const w of [20, 30, 40]) if (a + w <= 95) add(`btw:${a}:${a + w}`, `is between ${a} and ${a + w}`, (n) => n >= a && n <= a + w);
    for (let d = 0; d <= 9; d++) { add(`has:${d}`, `contains the digit ${d}`, (n) => String(n).includes(String(d))); add(`end:${d}`, `ends in ${d}`, (n) => n % 10 === d); }
    for (let s = 5; s <= 14; s++) add(`ds:${s}`, `has digits adding up to exactly ${s}`, (n) => ds(n) === s);
    for (let s = 8; s <= 12; s++) add(`dsgt:${s}`, `has digits adding up to more than ${s}`, (n) => ds(n) > s);
    add("dsev", "has an even digit sum", (n) => ds(n) % 2 === 0); add("dsod", "has an odd digit sum", (n) => ds(n) % 2 === 1);
    add("prime", "is prime", isPrime); add("sq", "is a perfect square", (n) => Number.isInteger(Math.sqrt(n))); add("cube", "is a perfect cube", (n) => [1, 8, 27, 64].includes(n));
    add("fib", "is a Fibonacci number", (n) => FIB.has(n)); add("tri", "is a triangular number", (n) => TRI.has(n)); add("pow2", "is a power of 2", (n) => (n & (n - 1)) === 0);
    add("pal", "reads the same backwards", (n) => String(n) === [...String(n)].reverse().join("")); add("twin", "has two identical digits", (n) => n > 9 && n % 11 === 0);
    add("tgto", "has a tens digit bigger than its ones digit", (n) => Math.floor(n / 10) > n % 10); add("tlto", "has a tens digit smaller than its ones digit", (n) => n > 9 && Math.floor(n / 10) < n % 10);
    add("allodd", "has only odd digits", (n) => [...String(n)].every((c) => +c % 2 === 1)); add("alleven", "has only even digits", (n) => [...String(n)].every((c) => +c % 2 === 0));
    for (const k of [3, 4, 6]) add(`div:${k}`, `has exactly ${k} divisors`, (n) => divisors(n) === k);
    for (const k of [2, 3, 5]) for (const N of [30, 50, 70]) add(`mulgt:${k}:${N}`, `is a multiple of ${k} and greater than ${N}`, (n) => n % k === 0 && n > N);
    for (const N of [30, 50, 70]) { add(`evlt:${N}`, `is even and less than ${N}`, (n) => n % 2 === 0 && n < N); add(`odgt:${N}`, `is odd and greater than ${N}`, (n) => n % 2 === 1 && n > N); }
    for (let k = 3; k <= 12; k++) add(`notmul:${k}`, `is not a multiple of ${k}`, (n) => n % k !== 0);
    for (const k of [2, 3, 4, 5]) for (let d = 1; d <= 9; d++) add(`mulhas:${k}:${d}`, `is a multiple of ${k} and contains the digit ${d}`, (n) => n % k === 0 && String(n).includes(String(d)));
    for (let d = 1; d <= 9; d++) { add(`oddhas:${d}`, `is odd and contains the digit ${d}`, (n) => n % 2 === 1 && String(n).includes(String(d))); add(`primehas:${d}`, `is prime and contains the digit ${d}`, (n) => isPrime(n) && String(n).includes(String(d))); }
    for (let c = 20; c <= 80; c += 10) for (const w of [5, 10]) add(`near:${c}:${w}`, `is within ${w} of ${c}`, (n) => Math.abs(n - c) <= w);
    add("primeend3", "is prime and ends in 3", (n) => isPrime(n) && n % 10 === 3); add("sqeven", "is an even perfect square", (n) => n % 2 === 0 && Number.isInteger(Math.sqrt(n)));
    const seen = new Map();
    raw.forEach((r) => { r.set = NUMS.filter(r.f); const key = r.set.join(","); if (!seen.has(key)) seen.set(key, r); });
    return [...seen.values()];
  }
  const RULES = buildRules(), BASE_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));
  const BASE_SETS = new Set(RULES.map((r) => r.set.join(",")));
  // Compound rules: two simple rules joined by "and" / "or". Tens of thousands of distinct rules.
  const SIMPLE = RULES.filter((r) => !/^(mulgt|evlt|odgt|primeend3|sqeven|mulhas|oddhas|primehas)/.test(r.id));
  function compound(op, a, b) {
    const [x, y] = [a, b].sort((m, n) => (m.id < n.id ? -1 : 1));
    const f = op === "and" ? (n) => x.f(n) && y.f(n) : (n) => x.f(n) || y.f(n);
    return { id: `${op}(${x.id}|${y.id})`, label: `${x.label} ${op} ${y.label}`, f, set: NUMS.filter(f) };
  }
  const cache = new Map();
  function ruleById(id) {
    if (BASE_ID[id]) return BASE_ID[id];
    if (cache.has(id)) return cache.get(id);
    const m = id.match(/^(and|or)\((.+)\|(.+)\)$/);
    const r = m ? compound(m[1], BASE_ID[m[2]], BASE_ID[m[3]]) : null;
    cache.set(id, r); return r;
  }
  function randomCompound(rnd) {
    const [a, b] = rnd.sample(SIMPLE, 2), r = compound(rnd() < 0.6 ? "and" : "or", a, b);
    const k = r.set.join(",");
    if (r.set.length < 4 || r.set.length > 85 || BASE_SETS.has(k)) return null; // too small/large, or same as a simple rule
    return r;
  }
  const BY_ID = new Proxy({}, { get: (_, id) => ruleById(id) });
  const ROUNDS = 3, MAX_TESTS = 8, OPTIONS = 6;

  MG.css(`
  .or-ex{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}
  .or-chip{font:700 16px var(--mono);height:38px;min-width:48px;padding:0 12px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;gap:6px;animation:pop .25s var(--ease) both}
  .or-chip.yes{background:color-mix(in srgb,var(--good) 18%,var(--surface-2));color:var(--good)}.or-chip.no{background:color-mix(in srgb,var(--bad) 13%,var(--surface-2));color:var(--bad)}
  .or-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}@media(max-width:600px){.or-opts{grid-template-columns:1fr}}
  .or-opt{text-align:left;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface);cursor:pointer;font-weight:600;transition:all .2s}
  .or-opt:hover:not(:disabled){border-color:var(--accent)}
  .or-opt.right{background:color-mix(in srgb,var(--good) 16%,var(--surface));border-color:var(--good)}.or-opt.wrong{background:color-mix(in srgb,var(--bad) 12%,var(--surface));border-color:var(--bad)}
  .or-sec{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3);margin:18px 0 8px}`);

  MG.define({
    slug: "oracle",
    howTo: `<p>The Oracle has a secret rule about whole numbers from 1 to 99. You start with three numbers that fit (✓) and one that doesn't (✗).</p>
    <ul><li>Test up to ${MAX_TESTS} numbers of your own. The Oracle says ✓ or ✗.</li>
    <li>Then pick the rule from ${OPTIONS} options. Most of the options fit the starting clues, so test to tell them apart.</li>
    <li>Rules can be simple ("is prime") or compound ("is prime and contains the digit 7", "is a multiple of 4 or ends in 5").</li>
    <li>The first 2 tests are free. Each test after that costs 10 points, and a wrong pick scores 0. You'll never get the same secret rule twice.</li></ul>`,
    progress: (s) => `Rule ${s.ans.length + 1} of ${s.R.length}`,
    partial: (s) => s.ans.reduce((a, b) => a + b.s, 0) / s.R.length,
    init(ctx) {
      const r = ctx.rng, seen = ctx.seen(), R = [], used = new Set();
      const simpleLeft = RULES.filter((x) => x.set.length >= 4 && x.set.length <= 90 && !seen.has(x.id));
      for (let t = 0; t < 3000 && R.length < ROUNDS; t++) {
        // Mix: one simple rule per game while any are left, the rest compound.
        const rule = R.length === 0 && simpleLeft.length ? r.pick(simpleLeft) : randomCompound(r);
        if (!rule || seen.has(rule.id) || used.has(rule.id)) continue;
        const pos = r.sample(rule.set, 3), neg = r.sample(NUMS.filter((n) => !rule.f(n)), 1);
        const fitsRule = (x) => x.set.join() !== rule.set.join() && pos.every(x.f) && neg.every((n) => !x.f(n));
        const candidates = RULES.concat(Array.from({ length: 400 }, () => randomCompound(r)).filter(Boolean));
        const fits = [], fitSets = new Set();
        for (const x of r.shuffle(candidates)) { const k = x.set.join(); if (fitsRule(x) && !fitSets.has(k)) { fitSets.add(k); fits.push(x); } if (fits.length >= OPTIONS - 1) break; }
        if (fits.length < 2) continue;
        const others = r.shuffle(RULES.filter((x) => !fitSets.has(x.set.join()) && x.set.join() !== rule.set.join()));
        const opts = fits.concat(others).slice(0, OPTIONS - 1);
        used.add(rule.id);
        R.push({ id: rule.id, pos, neg, opts: r.shuffle([rule.id, ...opts.map((o) => o.id)]) });
      }
      if (R.length < ROUNDS) return null;
      ctx.markSeen(R.map((x) => x.id));
      return { R, ans: [], tests: [] };
    },
    render(ctx, st) {
      const { root, h } = ctx;
      function round() {
        const i = st.ans.length, Q = st.R[i], rule = BY_ID[Q.id];
        let locked = false;
        root.innerHTML = "";
        const chip = (n, yes) => h("span", { class: `or-chip ${yes ? "yes" : "no"}` }, `${n}`, h("small", {}, yes ? "✓" : "✗"));
        const testList = h("div", { class: "or-ex" }, ...st.tests.map((n) => chip(n, rule.f(n))));
        const input = h("input", { class: "input", type: "number", min: 1, max: 99, placeholder: "1 – 99", style: "max-width:140px", "aria-label": "Number to test" });
        const testBtn = h("button", { class: "btn", onclick: test }, "Test");
        const left = h("span", { class: "pill" });
        const setLeft = () => { left.textContent = `Tests left ${MAX_TESTS - st.tests.length}`; testBtn.disabled = input.disabled = locked || st.tests.length >= MAX_TESTS; };
        input.addEventListener("keydown", (e) => e.key === "Enter" && test());
        const optsEl = h("div", { class: "or-opts" }, ...Q.opts.map((id) => h("button", { class: "or-opt", onclick: (e) => choose(id, e.currentTarget) }, `The number ${BY_ID[id].label}`)));
        const fb = h("div", { class: "feedback" });
        root.append(MG.roundTop(i, st.R.length, left), h("p", { class: "big-q", style: "margin-bottom:10px" }, "What's the rule?"),
          h("div", { class: "or-sec" }, "Clues"), h("div", { class: "or-ex" }, ...Q.pos.map((n) => chip(n, true)), ...Q.neg.map((n) => chip(n, false))),
          h("div", { class: "or-sec" }, "Your tests"), h("div", { class: "row" }, input, testBtn), testList, h("div", { class: "or-sec" }, "Name the rule"), optsEl, fb);
        setLeft(); input.focus({ preventScroll: true });
        function test() {
          if (locked || st.tests.length >= MAX_TESTS) return;
          const n = Math.round(+input.value);
          if (!(n >= 1 && n <= 99)) { input.classList.add("shake"); setTimeout(() => input.classList.remove("shake"), 300); return; }
          input.value = ""; input.focus();
          if (st.tests.includes(n) || Q.pos.includes(n) || Q.neg.includes(n)) return ctx.toast("Already known");
          st.tests.push(n); ctx.save();
          testList.append(chip(n, rule.f(n))); setLeft();
        }
        function choose(id, el) {
          if (locked) return; locked = true; setLeft();
          const ok = id === Q.id, used = st.tests.length, s = ok ? Math.max(30, 100 - Math.max(0, used - 2) * 10) : 0;
          st.ans.push({ s, pick: id, tests: used }); st.tests = []; ctx.save();
          optsEl.querySelectorAll("button").forEach((b, k) => { b.disabled = true; if (Q.opts[k] === Q.id) b.classList.add("right"); });
          if (!ok) el.classList.add("wrong");
          fb.innerHTML = `<div class="pop row" style="gap:18px"><span>${ok ? "Correct!" : `The rule: the number <b>${rule.label}</b>`}</span><span class="muted">${used} test${used === 1 ? "" : "s"}</span><span class="gain">+${s}</span></div>`;
          const last = st.ans.length >= st.R.length;
          const next = h("button", { class: "btn primary lg", style: "margin-top:14px", onclick: () => (last ? end() : round()) }, last ? "See result" : "Next rule");
          fb.append(next); next.focus();
        }
      }
      const end = () => { const sc = st.ans.map((a) => a.s); ctx.finish(sc.reduce((a, b) => a + b, 0) / st.R.length, { summary: st.R.map((q, k) => `${sc[k]} · the number ${BY_ID[q.id].label}`).join("<br>"), share: MG.blocks(sc) }); };
      st.ans.length >= st.R.length ? end() : round();
    },
  });
})();

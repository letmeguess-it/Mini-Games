/* Oracle — discover a secret rule about numbers by testing them. */
const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
const ds = (n) => String(n).split("").reduce((a, b) => a + +b, 0);
const FIB = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);
const TRI = new Set(Array.from({ length: 13 }, (_, k) => ((k + 1) * (k + 2)) / 2));
const RULES = [
  ["is even", (n) => n % 2 === 0], ["is odd", (n) => n % 2 === 1], ["is a multiple of 3", (n) => n % 3 === 0],
  ["is a multiple of 4", (n) => n % 4 === 0], ["is a multiple of 5", (n) => n % 5 === 0], ["is a multiple of 6", (n) => n % 6 === 0],
  ["is a multiple of 7", (n) => n % 7 === 0], ["is prime", isPrime], ["is a perfect square", (n) => Number.isInteger(Math.sqrt(n))],
  ["is greater than 50", (n) => n > 50], ["is less than 30", (n) => n < 30], ["is between 20 and 60", (n) => n >= 20 && n <= 60],
  ["has an even digit sum", (n) => ds(n) % 2 === 0], ["has a digit sum above 9", (n) => ds(n) > 9],
  ["contains the digit 7", (n) => String(n).includes("7")], ["contains the digit 3", (n) => String(n).includes("3")],
  ["ends in 0–4", (n) => n % 10 < 5], ["has a tens digit bigger than its ones digit", (n) => Math.floor(n / 10) > n % 10],
  ["has only odd digits", (n) => [...String(n)].every((c) => +c % 2 === 1)], ["reads the same backwards", (n) => String(n) === [...String(n)].reverse().join("")],
  ["leaves remainder 1 when divided by 5", (n) => n % 5 === 1], ["leaves remainder 2 when divided by 3", (n) => n % 3 === 2],
  ["is a Fibonacci number", (n) => FIB.has(n)], ["is a triangular number", (n) => TRI.has(n)], ["is a power of 2", (n) => (n & (n - 1)) === 0],
  ["contains the digit 0", (n) => String(n).includes("0")], ["has two identical digits", (n) => n > 9 && n % 11 === 0],
  ["is one less than a multiple of 10", (n) => n % 10 === 9], ["has digits that add up to exactly 10", (n) => ds(n) === 10],
].map(([label, f]) => ({ label, f, set: Array.from({ length: 99 }, (_, k) => k + 1).filter(f) }));

const ROUNDS = 3, MAX_TESTS = 8, OPTIONS = 6;

MG.css(`
.or-ex{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}
.or-chip{font:700 16px var(--mono);height:38px;min-width:48px;padding:0 12px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;gap:6px;animation:pop .25s var(--ease) both}
.or-chip.yes{background:color-mix(in srgb,var(--good) 18%,var(--surface-2));color:var(--good)}
.or-chip.no{background:color-mix(in srgb,var(--bad) 13%,var(--surface-2));color:var(--bad)}
.or-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
@media(max-width:560px){.or-opts{grid-template-columns:1fr}}
.or-opt{text-align:left;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface);cursor:pointer;font-weight:600;transition:all .2s}
.or-opt:hover:not(:disabled){border-color:var(--accent)}
.or-opt.right{background:color-mix(in srgb,var(--good) 16%,var(--surface));border-color:var(--good)}
.or-opt.wrong{background:color-mix(in srgb,var(--bad) 12%,var(--surface));border-color:var(--bad)}
.or-sec{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);margin:18px 0 8px}
`);

MG.game({
  slug: "oracle",
  howTo: `<p>The Oracle has a secret rule about whole numbers from 1 to 99. You start with a few numbers that fit (✓) and one or two that don't (✗).</p>
  <ul><li>Test up to ${MAX_TESTS} numbers of your own. The Oracle says ✓ or ✗.</li>
  <li>Then pick the rule from ${OPTIONS} options. Most of the options fit the starting clues, so you have to test to tell them apart.</li>
  <li>The first 2 tests are free. Each test after that costs 10 points, and a wrong pick scores 0.</li></ul>`,
  setup(ctx) {
    const { root, rng, h } = ctx;
    const scores = [], labels = [];
    let i = 0;
    const used = new Set();

    function makeRound() {
      for (;;) {
        const rule = rng.pick(RULES.filter((r) => !used.has(r.label) && r.set.length >= 4 && r.set.length <= 90));
        const pos = rng.sample(rule.set, 3);
        const negPool = Array.from({ length: 99 }, (_, k) => k + 1).filter((n) => !rule.f(n));
        const neg = rng.sample(negPool, 1);
        const same = (a, b) => a.set.length === b.set.length && a.set.every((x, k) => x === b.set[k]);
        const fits = RULES.filter((r) => r !== rule && !same(r, rule) && pos.every(r.f) && neg.every((n) => !r.f(n)));
        const others = rng.shuffle(RULES.filter((r) => r !== rule && !same(r, rule) && !fits.includes(r)));
        const opts = rng.sample(fits, OPTIONS - 1).concat(others).slice(0, OPTIONS - 1);
        if (fits.length < 2) continue;
        used.add(rule.label);
        return { rule, pos, neg, opts: rng.shuffle([rule, ...opts]) };
      }
    }
    const R = Array.from({ length: ROUNDS }, makeRound);

    function round() {
      const { rule, pos, neg, opts } = R[i];
      const tests = [];
      let locked = false;
      root.innerHTML = "";
      const chip = (n, yes) => h("span", { class: `or-chip ${yes ? "yes" : "no"}` }, `${n}`, h("small", {}, yes ? "✓" : "✗"));
      const testList = h("div", { class: "or-ex" });
      const input = h("input", { class: "input", type: "number", min: 1, max: 99, placeholder: "1 – 99", style: "max-width:140px" });
      const testBtn = h("button", { class: "btn", onclick: test }, "Test");
      const left = h("span", { class: "pill" }, `Tests left ${MAX_TESTS}`);
      input.addEventListener("keydown", (e) => e.key === "Enter" && test());
      const optsEl = h("div", { class: "or-opts" });
      opts.forEach((o) => optsEl.append(h("button", { class: "or-opt", onclick: (e) => choose(o, e.currentTarget) }, `The number ${o.label}`)));
      const fb = h("div", { class: "feedback" });
      root.append(
        h("div", { class: "stage-top" }, h("div", { class: "dots" }, ...R.map((_, k) => h("i", { class: k < i ? "on" : k === i ? "cur" : "" }))), left),
        h("p", { class: "big-q", style: "margin-bottom:10px" }, "What's the rule?"),
        h("div", { class: "or-sec" }, "Clues"), h("div", { class: "or-ex" }, ...pos.map((n) => chip(n, true)), ...neg.map((n) => chip(n, false))),
        h("div", { class: "or-sec" }, "Your tests"), h("div", { class: "row" }, input, testBtn), testList,
        h("div", { class: "or-sec" }, "Name the rule"), optsEl, fb);
      input.focus();

      function test() {
        if (locked || tests.length >= MAX_TESTS) return;
        const n = Math.round(+input.value);
        if (!(n >= 1 && n <= 99)) { input.classList.add("shake"); setTimeout(() => input.classList.remove("shake"), 300); return; }
        input.value = ""; input.focus();
        if (tests.includes(n) || pos.includes(n) || neg.includes(n)) return MG.toast("Already known");
        tests.push(n);
        testList.append(chip(n, rule.f(n)));
        left.textContent = `Tests left ${MAX_TESTS - tests.length}`;
        if (tests.length >= MAX_TESTS) { testBtn.disabled = input.disabled = true; }
      }
      function choose(o, el) {
        if (locked) return; locked = true;
        testBtn.disabled = input.disabled = true;
        const ok = o === rule;
        const s = ok ? Math.max(30, 100 - Math.max(0, tests.length - 2) * 10) : 0;
        scores.push(s); labels.push(rule.label);
        optsEl.querySelectorAll("button").forEach((b, k) => { b.disabled = true; if (opts[k] === rule) b.classList.add("right"); });
        if (!ok) el.classList.add("wrong");
        fb.innerHTML = `<div class="pop row" style="gap:18px"><span>${ok ? "Correct!" : `The rule: the number <b>${rule.label}</b>`}</span><span class="muted">${tests.length} test${tests.length === 1 ? "" : "s"}</span><span class="mono" style="color:var(--accent);font-size:22px">+${s}</span></div>`;
        const next = h("button", { class: "btn primary lg", style: "margin-top:14px", onclick: () => { i++; i < ROUNDS ? round() : end(); } }, i + 1 < ROUNDS ? "Next rule" : "See result");
        fb.append(next); next.focus();
      }
    }
    function end() {
      ctx.finish(scores.reduce((a, b) => a + b, 0) / ROUNDS, { summary: labels.map((l, k) => `${scores[k]} · the number ${l}`).join("<br>"), share: MG.blocks(scores) });
    }
    round();
  },
});

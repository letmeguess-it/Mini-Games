/* Sonar — find hidden wrecks using distance pings. */
const N = 9, WRECKS = 3, BUDGET = 18;

MG.css(`
.sn-grid{display:grid;grid-template-columns:repeat(${N},1fr);gap:5px;max-width:470px;margin:0 auto;aspect-ratio:1}
.sn-cell{border:0;border-radius:9px;background:var(--surface-2);font:700 15px var(--mono);cursor:pointer;position:relative;
  transition:transform .15s var(--ease),background .3s;display:grid;place-items:center;padding:0}
.sn-cell:hover:not(:disabled){transform:scale(1.07);background:color-mix(in srgb,var(--accent) 14%,var(--surface-2))}
.sn-cell:disabled{cursor:default}
.sn-cell.ping{color:#fff;animation:pop .3s var(--ease)}
.sn-cell.ping.stale{opacity:.45}
.sn-cell.hit{background:var(--ink);color:var(--bg);animation:pop .4s var(--ease)}
.sn-cell.miss-reveal{outline:2px dashed var(--accent);outline-offset:-3px}
.sn-cell.ping::after{content:"";position:absolute;inset:0;border-radius:9px;border:2px solid currentColor;opacity:0;animation:ripple .7s ease-out}
@keyframes ripple{from{opacity:.8;transform:scale(1)}to{opacity:0;transform:scale(2.2)}}
.sn-hud{display:flex;gap:10px;flex-wrap:wrap}
`);

MG.game({
  slug: "sonar",
  howTo: `<p>${WRECKS} wrecks lie hidden on a ${N}×${N} seabed. Tap a cell to ping it.</p>
  <ul><li>A ping shows the <b>number of steps</b> (up, down, left, right, no diagonals) to the nearest wreck you <b>haven't found yet</b>.</li>
  <li>When you find a wreck, older pings fade because they may have been measuring to that one.</li>
  <li>You have ${BUDGET} pings. Finding all ${WRECKS} in 7 or fewer scores 100, and each extra ping costs 5.</li></ul>`,
  setup(ctx) {
    const { root, rng, h } = ctx;
    const wrecks = [];
    while (wrecks.length < WRECKS) {
      const c = { r: rng.int(0, N - 1), c: rng.int(0, N - 1) };
      if (wrecks.every((w) => Math.abs(w.r - c.r) + Math.abs(w.c - c.c) >= 3)) wrecks.push(c);
    }
    const found = new Set(), pinged = new Map();
    let used = 0, over = false;
    const key = (r, c) => r * N + c;
    const nearest = (r, c) => Math.min(...wrecks.filter((w) => !found.has(key(w.r, w.c))).map((w) => Math.abs(w.r - r) + Math.abs(w.c - c)));
    const colorFor = (d) => `color-mix(in srgb, var(--accent) ${Math.max(18, 100 - d * 9)}%, #4a4f5a)`;

    const hud = h("div", { class: "sn-hud" });
    const grid = h("div", { class: "sn-grid" });
    const fb = h("div", { class: "feedback center" });
    root.append(h("div", { class: "stage-top" }, hud, h("span", { class: "faint", style: "font-size:13px" }, "Numbers = steps to nearest unfound wreck")), grid, fb);

    const cells = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const b = h("button", { class: "sn-cell", "aria-label": `row ${r + 1} column ${c + 1}`, onclick: () => ping(r, c, b) });
      cells.push(b); grid.append(b);
    }
    function renderHud() {
      hud.innerHTML = `<span class="pill">Pings left <b class="mono">${BUDGET - used}</b></span><span class="pill">Wrecks found <b class="mono">${found.size}/${WRECKS}</b></span>`;
    }
    function ping(r, c, b) {
      if (over || pinged.has(key(r, c))) return;
      used++;
      const isWreck = wrecks.some((w) => w.r === r && w.c === c);
      if (isWreck) {
        found.add(key(r, c)); pinged.set(key(r, c), "hit");
        b.className = "sn-cell hit"; b.textContent = "◆"; b.disabled = true;
        cells.forEach((x, k) => pinged.get(k) !== "hit" && pinged.has(k) && x.classList.add("stale"));
        if (navigator.vibrate) navigator.vibrate(30);
      } else {
        const d = nearest(r, c);
        pinged.set(key(r, c), d);
        b.className = "sn-cell ping"; b.style.background = colorFor(d); b.textContent = d; b.disabled = true;
      }
      renderHud();
      if (found.size === WRECKS) return end(true);
      if (used >= BUDGET) return end(false);
    }
    function end(won) {
      over = true;
      cells.forEach((b) => (b.disabled = true));
      wrecks.forEach((w) => { if (!found.has(key(w.r, w.c))) { const b = cells[key(w.r, w.c)]; b.classList.add("miss-reveal"); b.textContent = "◇"; } });
      const score = won ? Math.max(20, Math.min(100, 100 - (used - 7) * 5)) : found.size * 12;
      fb.innerHTML = won ? `<span class="pop">All wrecks found with <b class="mono">${used}</b> pings</span>` : `<span class="pop">Out of pings · ${found.size}/${WRECKS} found</span>`;
      const trail = [...pinged.values()].map((v) => (v === "hit" ? "◆" : "·")).join("");
      ctx.finish(score, { summary: won ? `Found all ${WRECKS} wrecks in ${used} pings.` : `Found ${found.size} of ${WRECKS} wrecks before running out.`, share: `${won ? used : "X"}/${BUDGET} pings  ${trail}` });
    }
    renderHud();
  },
});

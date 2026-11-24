/* Sonar — find hidden wrecks using distance pings. */
(function () {
  MG.css(`
  .sn-grid{display:grid;gap:5px;max-width:470px;margin:0 auto;aspect-ratio:1;padding:10px;border-radius:16px;
    background:radial-gradient(circle at 50% 50%,#0b3a52,#04202f);box-shadow:inset 0 0 40px rgba(0,0,0,.5)}
  .sn-cell{border:0;border-radius:8px;background:rgba(120,210,235,.10);font:700 15px var(--mono);color:#dff6fc;cursor:pointer;position:relative;
    transition:transform .15s var(--ease),background .3s;display:grid;place-items:center;padding:0}
  .sn-cell:hover:not(:disabled){transform:scale(1.08);background:rgba(120,210,235,.25)}
  .sn-cell:disabled{cursor:default}
  .sn-cell.ping{animation:pop .3s var(--ease)}.sn-cell.ping.stale{opacity:.4}
  .sn-cell.hit{background:#f8f9fa;color:#04202f;animation:pop .4s var(--ease)}
  .sn-cell.miss-reveal{outline:2px dashed #7fdcf0;outline-offset:-3px}
  .sn-cell.ping::after{content:"";position:absolute;inset:0;border-radius:8px;border:2px solid #7fdcf0;opacity:0;animation:ripple .7s ease-out}
  @keyframes ripple{from{opacity:.8;transform:scale(1)}to{opacity:0;transform:scale(2.2)}}`);

  MG.define({
    slug: "sonar",
    howTo: `<p>3 or 4 wrecks lie hidden on a seabed of 8×8 to 10×10 cells. Tap a cell to ping it.</p>
    <ul><li>A ping shows the <b>number of steps</b> (up, down, left, right, no diagonals) to the nearest wreck you <b>haven't found yet</b>.</li>
    <li>When you find a wreck, older pings fade because they may have been measuring to that one.</li>
    <li>The ping budget and the par score depend on the board: the counter shows pings left. Finding everything within par scores 100, and each extra ping costs 5.</li>
    <li>Every seabed layout is new.</li></ul>`,
    progress: (s) => `${s.pings.length} of ${s.budget} pings used · ${s.pings.filter((p) => p.hit).length}/${s.W} wrecks found`,
    partial: (s) => Math.round((s.pings.filter((p) => p.hit).length / s.W) * 36),
    init(ctx) {
      const seen = ctx.seen(), r = ctx.rng;
      for (let t = 0; t < 500; t++) {
        const N = r.int(8, 10), W = r.pick([3, 3, 4]), w = [];
        while (w.length < W) { const c = { r: r.int(0, N - 1), c: r.int(0, N - 1) }; if (w.every((x) => Math.abs(x.r - c.r) + Math.abs(x.c - c.c) >= 3)) w.push(c); }
        const sig = `${N}:` + w.map((x) => x.r * N + x.c).sort((a, b) => a - b).join(",");
        if (!seen.has(sig)) { ctx.markSeen([sig]); return { N, W, budget: 2 * N + (W - 3) * 4, par: 7 + (W - 3) * 3 + (N - 9), wrecks: w, pings: [] }; }
      }
      return null;
    },
    render(ctx, st) {
      const { root, h } = ctx;
      const N = st.N, WRECKS = st.W, BUDGET = st.budget;
      const key = (r, c) => r * N + c, found = () => new Set(st.pings.filter((p) => p.hit).map((p) => key(p.r, p.c)));
      const hud = h("div", { class: "row" }), grid = h("div", { class: "sn-grid", style: `grid-template-columns:repeat(${N},1fr)` }), fb = h("div", { class: "feedback center" });
      root.append(h("div", { class: "stage-top" }, hud, h("span", { class: "faint", style: "font-size:13px" }, "Numbers = steps to nearest unfound wreck")), grid, fb);
      const cells = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const b = h("button", { class: "sn-cell", "aria-label": `row ${r + 1} column ${c + 1}`, onclick: () => ping(r, c) }); cells.push(b); grid.append(b); }
      const shade = (d) => `rgba(127,220,240,${Math.max(0.12, 0.85 - d * 0.09).toFixed(2)})`;
      function draw() {
        let lastHit = -1; st.pings.forEach((p, k) => p.hit && (lastHit = k));
        st.pings.forEach((p, k) => {
          const b = cells[key(p.r, p.c)]; b.disabled = true;
          if (p.hit) { b.className = "sn-cell hit"; b.textContent = "◆"; b.style.background = ""; }
          else { b.className = `sn-cell ping${k < lastHit ? " stale" : ""}`; b.textContent = p.d; b.style.background = shade(p.d); b.style.color = p.d <= 3 ? "#04202f" : "#dff6fc"; }
        });
        const f = found().size;
        hud.innerHTML = `<span class="pill">${N}×${N} · par ${st.par}</span><span class="pill">Pings left <b class="mono">${BUDGET - st.pings.length}</b></span><span class="pill">Wrecks found <b class="mono">${f}/${WRECKS}</b></span>`;
      }
      let over = false;
      function ping(r, c) {
        if (over || st.pings.some((p) => p.r === r && p.c === c)) return;
        const f = found(), hit = st.wrecks.some((w) => w.r === r && w.c === c);
        const d = hit ? 0 : Math.min(...st.wrecks.filter((w) => !f.has(key(w.r, w.c))).map((w) => Math.abs(w.r - r) + Math.abs(w.c - c)));
        st.pings.push({ r, c, d, hit }); ctx.save();
        if (hit && navigator.vibrate) navigator.vibrate(30);
        draw(); check();
      }
      function check() {
        const f = found().size;
        if (f === WRECKS) end(true); else if (st.pings.length >= BUDGET) end(false);
      }
      function end(won) {
        over = true; cells.forEach((b) => (b.disabled = true));
        const f = found(), used = st.pings.length;
        st.wrecks.forEach((w) => { if (!f.has(key(w.r, w.c))) { const b = cells[key(w.r, w.c)]; b.classList.add("miss-reveal"); b.textContent = "◇"; } });
        fb.innerHTML = won ? `<span class="pop">All wrecks found with <b class="mono">${used}</b> pings</span>` : `<span class="pop">Out of pings · ${f.size}/${WRECKS} found</span>`;
        ctx.finish(won ? Math.max(20, Math.min(100, 100 - (used - st.par) * 5)) : Math.round((f.size / WRECKS) * 36), {
          summary: won ? `Found all ${WRECKS} wrecks in ${used} pings.` : `Found ${f.size} of ${WRECKS} wrecks before running out.`,
          share: `${won ? used : "X"}/${BUDGET} pings  ${st.pings.map((p) => (p.hit ? "◆" : "·")).join("")}` });
      }
      draw(); check();
    },
  });
})();

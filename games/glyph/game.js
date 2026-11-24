/* Glyph — deduce a hidden 5-letter word from overlap counts alone. */
(function () {
  const WORDS = [...new Set(`about above actor acute adopt after agent alert alien alone along alter amber angel anger angle ankle apron arise aside
audio avoid badge baker basin beach begin being below birth black blade blame blank blast blend blind block blond board brain brand brave
bread break brick bride brief bring broad brown brush built burst cabin cable camel candy cargo carve chain chair chalk charm chart chase
cheap chest chief child chips choir chord claim clamp clear climb cloud coast comet coral could count court cover crane crash cream crime
crisp crowd crown crust curve dance death delta depth dirty doubt dough draft drain dream drink drive earth empty enjoy equal fable faith
false feast fiber field fight final first flame flash flint float flock flour fluid focus forge forth frame frank fresh front frost fruit
ghost giant glare globe glory glove grace grade grain grand grant graph grasp grave great grief group guard guest guide habit handy harsh
heart horse hotel house human humor ideal image index input joint judge juice knife laser later lemon light limbs local lunar magic major
maple march match metal might minor model money month moral mount mouse mouth music night noble noise north novel ocean olive opera orbit
other ounce owner paint panel party patch peach pearl phone piano pilot pitch place plain plane plant plate point polar pound power price
pride prime print prism prize proud pulse punch quiet quilt quote radio raise ranch range rapid reach realm rhyme ridge rival roast robin
rocky round route royal rusty saint sauce scale scarf scope score scout shade shake shape share shark sharp shine shirt shock shore short
shout sight sigma sixth skate slate slice smart smile smoke snake solar solve sound south space spade spare spark spear spend spice spike
spine spoke sport stack stage stair stake stamp stand steam stern stick stone storm story stove strap straw style sugar table taken teach
thick thing think third thorn throw thumb tiger token topic torch touch tower toxic trace track trade trail train trend tribe trick truck
truly ultra uncle under unite upset urban valid value vapor vital vocal voice waist waste watch water whale wheat white whole width windy
world worst wound wrist write yacht young youth zebra blaze brisk bunch chime clown cobra crumb dwarf elbow fancy flair fling frown glide
gloat gourd hinge jumbo knelt lofty mango mirth moist nudge perch plumb prank quirk relax rumba scowl slept smirk snack spout stomp swift
sworn tango thump tweak vixen waltz wharf yield zesty badly bison blunt borax chomp crypt debug dingo dusky epoch fjord frisk gusty hazel
ivory jumpy latch lemur macho nymph pixel prowl quart risky satin shady sulky tempo thong umbra vouch wagon wield wrath yeast`
    .split(/\s+/))].filter((w) => w.length === 5 && new Set(w).size === 5);
  const MAX = 10, L = 5;

  MG.css(`
  .gl-board{display:grid;gap:8px;margin-bottom:18px}
  .gl-row{display:flex;gap:6px;align-items:center}
  .gl-tile{width:46px;height:50px;border-radius:10px;border:1.5px solid var(--line);display:grid;place-items:center;font:700 22px var(--mono);text-transform:uppercase;
    background:var(--surface);cursor:pointer;transition:all .2s var(--ease);user-select:none}
  @media(max-width:420px){.gl-tile{width:40px;height:44px;font-size:19px}}
  .gl-tile.out{color:var(--ink-3);background:var(--surface-2);text-decoration:line-through;border-color:transparent}
  .gl-tile.in{background:color-mix(in srgb,var(--good) 18%,var(--surface));border-color:var(--good);color:var(--good)}
  .gl-row.current .gl-tile{border-color:var(--ink-3);cursor:default}
  .gl-row.current .gl-tile.filled{border-color:var(--accent);animation:pop .18s}
  .gl-fb{display:flex;gap:6px;margin-left:10px}
  .gl-fb span{font:700 14px var(--mono);height:30px;min-width:40px;padding:0 8px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center}
  .gl-fb .sh{background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)}
  .gl-fb .pl{background:color-mix(in srgb,var(--good) 16%,transparent);color:var(--good)}
  .kb{display:grid;gap:6px;max-width:520px}.kb-row{display:flex;gap:5px;justify-content:center}
  .kb button{flex:1;min-width:0;height:46px;border-radius:8px;border:0;background:var(--surface-2);font:700 14px var(--mono);text-transform:uppercase;cursor:pointer;transition:all .15s}
  .kb button:active{transform:scale(.94)}.kb button.out{opacity:.28}.kb button.in{background:color-mix(in srgb,var(--good) 25%,var(--surface-2));color:var(--good)}
  .kb button.wide{flex:1.6;font-size:12px}
  .legend{display:flex;gap:14px;font-size:13px;color:var(--ink-2);flex-wrap:wrap}`);

  MG.define({
    slug: "glyph",
    howTo: `<p>A hidden 5-letter word uses five <b>different</b> letters. Type any 5 different letters (it doesn't have to be a real word) and you get two numbers back:</p>
    <ul><li><b style="color:var(--accent)">shared</b>: how many of your letters are in the word, anywhere.</li>
    <li><b style="color:var(--good)">placed</b>: how many are in exactly the right spot.</li>
    <li>You never learn <i>which</i> letters. Tap a letter tile, or a key in <b>Mark</b> mode, to note it as out or in.</li>
    <li>${MAX} tries. Solving in 4 or fewer scores 100, and each extra try costs 12. You'll never get the same word twice.</li></ul>`,
    progress: (s) => `${s.guesses.length} of ${MAX} tries used`,
    init(ctx) {
      const pick = ctx.pick(WORDS.map((w) => ({ id: w })), 1);
      return pick ? { secret: pick[0].id, guesses: [], marks: {}, cur: "" } : null;
    },
    render(ctx, st) {
      const { root, h } = ctx;
      let markMode = false, over = false;
      const board = h("div", { class: "gl-board" }), kb = h("div", { class: "kb" }), fb = h("div", { class: "feedback" });
      const modeBtn = h("button", { class: "btn sm", onclick: () => { markMode = !markMode; modeBtn.textContent = markMode ? "Mode: Mark" : "Mode: Type"; modeBtn.classList.toggle("primary", markMode); } }, "Mode: Type");
      root.append(h("div", { class: "stage-top" }, h("div", { class: "legend" }, h("span", { html: `<b style="color:var(--accent)">●</b> shared` }), h("span", { html: `<b style="color:var(--good)">●</b> placed` }),
        h("span", { class: "faint" }, "Guesses need 5 different letters")), modeBtn), board, kb, fb);
      const cycle = (ch) => { const m = st.marks[ch]; if (!m) st.marks[ch] = "out"; else if (m === "out") st.marks[ch] = "in"; else delete st.marks[ch]; ctx.save(); draw(); };
      function draw() {
        board.innerHTML = "";
        st.guesses.forEach((g) => board.append(h("div", { class: "gl-row" }, ...[...g.w].map((ch) => h("div", { class: `gl-tile ${st.marks[ch] || ""}`, title: "Tap to mark", onclick: () => !over && cycle(ch) }, ch)),
          h("div", { class: "gl-fb" }, h("span", { class: "sh", title: "shared" }, `${g.s}`), h("span", { class: "pl", title: "placed" }, `${g.p}`)))));
        if (!over && st.guesses.length < MAX) board.append(h("div", { class: "gl-row current" }, ...Array.from({ length: L }, (_, k) => h("div", { class: `gl-tile ${st.cur[k] ? "filled" : ""}` }, st.cur[k] || "")),
          h("span", { class: "faint mono", style: "margin-left:10px;font-size:12px" }, `${st.guesses.length + 1}/${MAX}`)));
        kb.innerHTML = "";
        ["qwertyuiop", "asdfghjkl", "⏎zxcvbnm⌫"].forEach((line) => kb.append(h("div", { class: "kb-row" }, ...[...line].map((ch) =>
          h("button", { class: `${ch === "⏎" || ch === "⌫" ? "wide" : ""} ${st.marks[ch] || ""}`, onclick: () => press(ch) }, ch === "⏎" ? "enter" : ch)))));
      }
      function press(ch, physical) {
        if (over) return;
        if (ch === "⌫") { st.cur = st.cur.slice(0, -1); ctx.save(); return draw(); }
        if (ch === "⏎") return submit();
        if (markMode && !physical) return cycle(ch);
        if (st.cur.length >= L) return;
        if (st.cur.includes(ch)) return ctx.toast("Letters must all be different");
        st.cur += ch; ctx.save(); draw();
      }
      function submit() {
        if (st.cur.length < L) { const r = board.lastChild; r?.classList.add("shake"); setTimeout(() => r?.classList.remove("shake"), 300); return; }
        const w = st.cur, s = [...w].filter((c) => st.secret.includes(c)).length, p = [...w].filter((c, k) => st.secret[k] === c).length;
        st.guesses.push({ w, s, p });
        if (s === 0) [...w].forEach((c) => (st.marks[c] = "out"));
        if (s === 5) { Object.keys(st.marks).forEach((c) => { if (!w.includes(c)) st.marks[c] = "out"; }); [...w].forEach((c) => (st.marks[c] = "in")); }
        st.cur = ""; ctx.save();
        if (p === 5) return end(true);
        if (st.guesses.length >= MAX) return end(false);
        draw();
      }
      function end(won) {
        over = true; draw();
        const n = st.guesses.length, W = st.secret.toUpperCase(), trail = st.guesses.map((g) => `${g.s}·${g.p}`).join(" ");
        fb.innerHTML = won ? `<span class="pop" style="color:var(--good)">Solved: <b class="mono">${W}</b> in ${n}</span>` : `<span class="pop">The word was <b class="mono">${W}</b></span>`;
        ctx.finish(won ? (n <= 4 ? 100 : Math.max(28, 100 - (n - 4) * 12)) : 0, {
          summary: won ? `The word was <b>${W}</b>. Solved in ${n} ${n === 1 ? "try" : "tries"}.` : `Out of tries. The word was <b>${W}</b>.`, share: `${won ? n : "X"}/${MAX} tries\n${trail}` });
      }
      const onKey = (e) => {
        if (!root.isConnected) return removeEventListener("keydown", onKey);
        if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input,textarea")) return;
        if (e.key === "Enter") { e.preventDefault(); press("⏎"); } else if (e.key === "Backspace") press("⌫"); else if (/^[a-z]$/i.test(e.key)) press(e.key.toLowerCase(), true);
      };
      addEventListener("keydown", onKey);
      const last = st.guesses[st.guesses.length - 1];
      if (last && last.p === 5) return end(true);
      if (st.guesses.length >= MAX) return end(false);
      draw();
    },
  });
})();

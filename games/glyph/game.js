/* Glyph — deduce a hidden 5-letter word from overlap counts alone. */
const WORDS = `about above actor acute adopt after agent alert alien alone along alter amber angel anger angle ankle apron arise aside
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
world worst wound wrist write yacht young youth zebra`.split(/\s+/).filter((w) => w.length === 5 && new Set(w).size === 5);

const MAX = 10, L = 5;

MG.css(`
.gl-board{display:grid;gap:8px;margin-bottom:18px}
.gl-row{display:flex;gap:6px;align-items:center}
.gl-tile{width:46px;height:50px;border-radius:10px;border:1.5px solid var(--line);display:grid;place-items:center;
  font:700 22px var(--mono);text-transform:uppercase;background:var(--surface);cursor:pointer;transition:all .2s var(--ease);user-select:none}
.gl-tile.out{color:var(--ink-3);background:var(--surface-2);text-decoration:line-through;border-color:transparent}
.gl-tile.in{background:color-mix(in srgb,var(--good) 18%,var(--surface));border-color:var(--good);color:var(--good)}
.gl-row.current .gl-tile{border-color:var(--ink-3);cursor:default}
.gl-row.current .gl-tile.filled{border-color:var(--accent);animation:pop .18s}
.gl-fb{display:flex;gap:6px;margin-left:10px}
.gl-fb span{font:700 14px var(--mono);height:30px;min-width:46px;padding:0 8px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;gap:4px}
.gl-fb .sh{background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)}
.gl-fb .pl{background:color-mix(in srgb,var(--good) 16%,transparent);color:var(--good)}
.kb{display:grid;gap:6px;max-width:520px}
.kb-row{display:flex;gap:5px;justify-content:center}
.kb button{flex:1;min-width:0;height:46px;border-radius:8px;border:0;background:var(--surface-2);font:700 14px var(--mono);text-transform:uppercase;cursor:pointer;transition:all .15s}
.kb button:active{transform:scale(.94)}
.kb button.out{opacity:.28}
.kb button.in{background:color-mix(in srgb,var(--good) 25%,var(--surface-2));color:var(--good)}
.kb button.wide{flex:1.6;font-size:12px}
.legend{display:flex;gap:14px;font-size:13px;color:var(--ink-2);margin-bottom:14px;flex-wrap:wrap}
`);

MG.game({
  slug: "glyph",
  howTo: `<p>A hidden 5-letter word uses five <b>different</b> letters. Type any 5 different letters (it doesn't have to be a real word) and you get two numbers back:</p>
  <ul><li><b style="color:var(--accent)">shared</b>: how many of your letters are in the word, anywhere.</li>
  <li><b style="color:var(--good)">placed</b>: how many are in exactly the right spot.</li>
  <li>You never learn <i>which</i> letters. Tap any letter tile or key in <b>Mark</b> mode to note it as out or in.</li>
  <li>${MAX} tries. Solving in 4 or fewer scores 100, and each extra try costs 12.</li></ul>`,
  setup(ctx) {
    const { root, rng, h } = ctx;
    const secret = rng.pick(WORDS);
    const marks = {}; // letter -> "in" | "out"
    const guesses = [];
    let cur = "", markMode = false, over = false;

    const board = h("div", { class: "gl-board" });
    const kb = h("div", { class: "kb" });
    const modeBtn = h("button", { class: "btn sm", onclick: () => { markMode = !markMode; modeBtn.textContent = markMode ? "Mode: Mark" : "Mode: Type"; modeBtn.classList.toggle("primary", markMode); } }, "Mode: Type");
    const fb = h("div", { class: "feedback" });
    root.append(
      h("div", { class: "stage-top" }, h("div", { class: "legend" },
        h("span", { html: `<b style="color:var(--accent)">●</b> shared` }), h("span", { html: `<b style="color:var(--good)">●</b> placed` }),
        h("span", { class: "faint" }, "Guesses need 5 different letters")), modeBtn),
      board, kb, fb);

    const cycle = (ch) => { marks[ch] = marks[ch] === undefined ? "out" : marks[ch] === "out" ? "in" : undefined; if (!marks[ch]) delete marks[ch]; render(); };

    function render() {
      board.innerHTML = "";
      guesses.forEach((g) => {
        const row = h("div", { class: "gl-row" }, ...[...g.w].map((ch) => h("div", { class: `gl-tile ${marks[ch] || ""}`, title: "Tap to mark", onclick: () => cycle(ch) }, ch)),
          h("div", { class: "gl-fb" }, h("span", { class: "sh", title: "shared" }, `${g.s}`), h("span", { class: "pl", title: "placed" }, `${g.p}`)));
        board.append(row);
      });
      if (!over && guesses.length < MAX) {
        const row = h("div", { class: "gl-row current" }, ...Array.from({ length: L }, (_, k) => h("div", { class: `gl-tile ${cur[k] ? "filled" : ""}` }, cur[k] || "")),
          h("span", { class: "faint mono", style: "margin-left:10px;font-size:12px" }, `${guesses.length + 1}/${MAX}`));
        board.append(row);
      }
      kb.innerHTML = "";
      ["qwertyuiop", "asdfghjkl", "⏎zxcvbnm⌫"].forEach((line) => {
        const r = h("div", { class: "kb-row" });
        [...line].forEach((ch) => {
          const wide = ch === "⏎" || ch === "⌫";
          r.append(h("button", { class: `${wide ? "wide" : ""} ${marks[ch] || ""}`, onclick: () => press(ch) }, ch === "⏎" ? "enter" : ch));
        });
        kb.append(r);
      });
    }

    function press(ch, physical) {
      if (over) return;
      if (ch === "⌫") { cur = cur.slice(0, -1); return render(); }
      if (ch === "⏎") return submit();
      if (markMode && !physical) return cycle(ch);
      if (cur.length >= L) return;
      if (cur.includes(ch)) { MG.toast("Letters must all be different"); return; }
      cur += ch; render();
    }

    function submit() {
      if (cur.length < L) { board.lastChild?.classList.add("shake"); setTimeout(() => board.lastChild?.classList.remove("shake"), 300); return; }
      const s = [...cur].filter((c) => secret.includes(c)).length;
      const p = [...cur].filter((c, k) => secret[k] === c).length;
      guesses.push({ w: cur, s, p });
      if (s === 0) [...cur].forEach((c) => (marks[c] = "out"));
      if (s === 5) Object.keys(marks).forEach((c) => !cur.includes(c) && (marks[c] = "out")), [...cur].forEach((c) => (marks[c] = "in"));
      cur = "";
      if (p === 5) return win();
      if (guesses.length >= MAX) return lose();
      render();
    }

    const share = () => guesses.map((g) => `${g.s}·${g.p}`).join(" ");
    function win() {
      over = true; render();
      const n = guesses.length, score = n <= 4 ? 100 : Math.max(28, 100 - (n - 4) * 12);
      fb.innerHTML = `<span class="pop" style="color:var(--good)">Solved: <b class="mono">${secret.toUpperCase()}</b> in ${n}</span>`;
      ctx.finish(score, { summary: `The word was <b>${secret.toUpperCase()}</b>. Solved in ${n} ${n === 1 ? "try" : "tries"}.`, share: `${n}/${MAX} tries\n${share()}` });
    }
    function lose() {
      over = true; render();
      fb.innerHTML = `<span class="pop">The word was <b class="mono">${secret.toUpperCase()}</b></span>`;
      ctx.finish(0, { summary: `Out of tries. The word was <b>${secret.toUpperCase()}</b>.`, share: `X/${MAX}\n${share()}` });
    }

    const onKey = (e) => {
      if (!root.isConnected) return removeEventListener("keydown", onKey);
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") { e.preventDefault(); press("⏎"); }
      else if (e.key === "Backspace") press("⌫");
      else if (/^[a-z]$/i.test(e.key)) press(e.key.toLowerCase(), true);
    };
    addEventListener("keydown", onKey);
    render();
  },
});

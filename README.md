# Mini Games

Ten original guessing, estimation and logic games in a single-page dashboard. It's pure static HTML, CSS and JavaScript, with no build step, no server and no accounts.

**Play:** https://letmeguess-it.github.io/Mini-Games/

## How it works

- **One page.** All games are listed down the left. Clicking one opens it in the main area on the right, and the dashboard stays one click away. Each game has a direct link too, e.g. `…/Mini-Games/#sonar`.
- **Pause and resume.** Leaving a game (the **← Dashboard** button, the browser's Back button, or closing the tab) pauses it. Coming back, whether a minute or a year later, offers **Resume** or **Start a new game**. Paused games also appear under "Continue where you left off" on the dashboard.
- **Questions never repeat.** Every question, puzzle or layout a player has seen is remembered, and new games only draw unseen ones. Across the ten games there are millions of distinct questions. If a player ever exhausts one game's pool, it says so instead of repeating.
- **Daily + practice.** Each game has one daily challenge per day and unlimited practice rounds. Ending a daily early ("Start a new game") records the points earned so far.
- **Themed backdrops.** Each game has its own background, such as log graph paper for Ballpark, a nautical chart for Compass, the deep sea for Sonar and parchment for Chrono.

Everything is stored in the browser's `localStorage` on the player's device.

## The games

| Game | Skill | The idea | Question supply |
|---|---|---|---|
| **Ballpark** | Estimation | Guess quantities on a log slider; scored in orders of magnitude | ~690,000 (70 curated facts, comparisons between them, and 15 kinds of exact computed quantity) |
| **Compass** | Geography | Turn a dial to the heading from one country or island to another, then guess the distance | ~50,000 (226 countries and islands; A→B and B→A count separately) |
| **Fermi** | Reasoning | Estimate the "impossible", optionally buying hidden factors of the reasoning chain | ~20,800 (45 templates × 130 countries and cities × day/week/month/year) |
| **Glyph** | Words | Find a hidden 4-, 5- or 6-letter word from *shared* / *placed* counts only | ~4,300 common English words with no repeated letters |
| **Sonar** | Deduction | Ping a seabed; each ping gives steps to the nearest unfound wreck | Millions of layouts (8×8 to 10×10, 3–4 wrecks) |
| **Equilibrium** | Logic | Symbols hide digits; row and column sums give them away | Effectively unlimited, each with exactly one solution |
| **Liar** | Logic | Higher/lower hunt where one answer is a lie, with a live number line of what's still possible | ~22,700 (range 1–50 up to 1–300 × number × lie position) |
| **Chrono** | History | Place an event, judge the gap between two, or put three in order | ~2.4 million (244 dated events → 28,760 pairs and ~2.39 million triples) |
| **Eyeball** | Perception | Dot counts, angles, fill levels, length ratios | Unlimited (every picture is generated) |
| **Oracle** | Induction | Test numbers against a secret rule, then pick it | ~12,400 distinct rules (simple and "and"/"or" compounds) |

## Files

```
index.html             The single page: sidebar + main pane
assets/logo.svg        The Mini Games logo (also the browser-tab icon)
assets/core.js         Engine: storage, seeded RNG, pause/resume, no-repeat tracking, game pane
assets/app.js          Sidebar, routing (#game-name), home dashboard
assets/core.css        Layout and components (light + dark)
assets/themes.css      One background per game
assets/home.css        Dashboard styles
games/<name>/game.js   One folder per game (index.html there redirects to the main page)
games/<name>/icon.svg  Each game's illustrated icon
games/glyph/words.js   Glyph's word lists (from the wordfreq frequency list, checked against Webster's dictionary)
```

### Adding a game
Create `games/<name>/game.js`. In it, call `MG.define({ slug, howTo, init(ctx), render(ctx, state), progress?(state), partial?(state) })`, then add the script to `index.html` and an entry to `GAMES` in `assets/core.js`.
- `init` builds the game's starting state. Use `ctx.pick(pool, k)` for a list, `ctx.draw(generatorFn, k)` for a generated question space, or `ctx.seen()` / `ctx.markSeen`, so questions never repeat.
- `render` draws from the state. Call `ctx.save()` after every move and `ctx.finish(score, { summary, share })` at the end.

## Running locally

```
python3 -m http.server 8000
# open http://localhost:8000
```

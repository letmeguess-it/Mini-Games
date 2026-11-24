# Mini Games

Ten original guessing, estimation and logic games in a single-page dashboard. It's pure static HTML, CSS and JavaScript, with no build step, no server and no accounts.

**Play:** https://letmeguess-it.github.io/Mini-Games/

## How it works

- **One page.** All games are listed down the left. Clicking one opens it in the main area on the right, and the dashboard stays one click away. Each game has a direct link too, e.g. `…/Mini-Games/#sonar`.
- **Pause and resume.** Leaving a game (the **← Dashboard** button, the browser's Back button, or closing the tab) pauses it. Coming back, whether a minute or a year later, offers **Resume** or **Start a new game**. Paused games also appear under "Continue where you left off" on the dashboard.
- **Questions never repeat.** Every question, puzzle or layout a player has seen is remembered, and new games only draw unseen ones. The procedural games (Sonar, Equilibrium, Liar, Eyeball, Compass) effectively never run out. The fact-based games have large pools, and if a player ever exhausts one, the game says so instead of repeating.
- **Daily + practice.** Each game has one daily challenge per day and unlimited practice rounds. Ending a daily early ("Start a new game") records the points earned so far.
- **Themed backdrops.** Each game has its own background, such as log graph paper for Ballpark, a nautical chart for Compass, the deep sea for Sonar and parchment for Chrono.

Everything is stored in the browser's `localStorage` on the player's device.

## The games

| Game | Skill | The idea | Question supply |
|---|---|---|---|
| **Ballpark** | Estimation | Guess quantities on a log slider; scored in orders of magnitude | ~70 curated facts + ~640 exact computed quantities |
| **Compass** | Geography | Turn a dial to the great-circle heading between two cities, then guess the distance | ~125 cities → thousands of pairs |
| **Fermi** | Reasoning | Estimate the "impossible", optionally buying hidden factors of the reasoning chain | 18 classics + 12 templates × 30 places |
| **Glyph** | Words | Find a hidden word from *shared* / *placed* counts only | ~400 words |
| **Sonar** | Deduction | Ping a seabed; each ping gives steps to the nearest unfound wreck | Generated layouts |
| **Equilibrium** | Logic | Symbols hide digits; row and column sums give them away | Generated, each with exactly one solution |
| **Liar** | Logic | Higher/lower hunt where one answer is a lie | Generated (range × number × lie position) |
| **Chrono** | History | Place historical moments on a timeline | ~240 dated events |
| **Eyeball** | Perception | Dot counts, angles, fill levels, length ratios | Generated pictures |
| **Oracle** | Induction | Test numbers against a secret rule, then pick it | ~195 generated rules |

## Files

```
index.html             The single page: sidebar + main pane
assets/core.js         Engine: storage, seeded RNG, pause/resume, no-repeat tracking, game pane
assets/app.js          Sidebar, routing (#game-name), home dashboard
assets/core.css        Layout and components (light + dark)
assets/themes.css      One background per game
assets/home.css        Dashboard styles
games/<name>/game.js   One folder per game (index.html there redirects to the main page)
```

### Adding a game
Create `games/<name>/game.js`. In it, call `MG.define({ slug, howTo, init(ctx), render(ctx, state), progress?(state), partial?(state) })`, then add the script to `index.html` and an entry to `GAMES` in `assets/core.js`.
- `init` builds the game's starting state. Use `ctx.pick(pool, k)`, or `ctx.isSeen` / `ctx.markSeen`, so questions never repeat.
- `render` draws from the state. Call `ctx.save()` after every move and `ctx.finish(score, { summary, share })` at the end.

## Running locally

```
python3 -m http.server 8000
# open http://localhost:8000
```

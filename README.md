# Let Me Guess

*(This repository is called Mini-Games; the site itself is named **Let Me Guess**.)*

Ten original guessing, estimation and logic games in a single-page dashboard. It's pure static HTML, CSS and JavaScript, with no build step, no server and no accounts.

**Play:** https://letmeguess-it.github.io/Mini-Games/

## How it works

- **One page.** All games are listed down the left. Clicking one opens it in the main area on the right, and the dashboard stays one click away. Each game has a direct link too, e.g. `…/Mini-Games/#sonar`.
- **Pause and resume.** Leaving a game (the **← Dashboard** button, the browser's Back button, or closing the tab) pauses it. Coming back, whether a minute or a year later, offers **Resume** or **Start a new game**. Paused games also appear under "Continue where you left off" on the dashboard.
- **Questions never repeat.** Every question, puzzle or layout a player has seen is remembered, and new games only draw unseen ones. Across the ten games there are millions of distinct questions. If a player ever exhausts one game's pool, it says so instead of repeating.
- **Daily calendar.** The dashboard has a calendar. Pick any day up to today (never a future one) to see and play that day's ten dailies. Each date gets its own fresh questions, and direct links work too (e.g. `#sonar-2026-11-20`). Playing a past day records the score for that day but doesn't extend your streak.
- **Daily + practice.** Each game has one daily challenge per day and unlimited practice rounds. Ending a daily early ("Start a new game") records the points earned so far.
- **Themed backdrops.** Each game has its own background, such as log graph paper for Ballpark, a nautical chart for Compass, the deep sea for Sonar and parchment for Chrono.

Progress is stored in the browser's `localStorage`. Players can also **sign in with Google** (button at the top of the dashboard): their progress is then kept in a hidden app-data file in *their own* Google Drive, and every device they sign in on merges with it. That covers history, streaks, paused games and the questions they've already seen. There's still no server of our own.

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
privacy.html           Privacy Policy
terms.html             Terms of Service
assets/logo.svg        The Let Me Guess logo (also the browser-tab icon)
assets/config.js       Site settings (Google client ID)
assets/cloud.js        Google sign-in and Drive sync
assets/leaderboard.js  Opt-in global leaderboard (Firebase Auth + Firestore REST)
firestore.rules        Firestore security rules for the leaderboard
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

## Turning on Google sign-in

Sign-in stays switched off until `assets/config.js` has a Google OAuth **client ID**. Here's how to get one:

1. **Create a project.** In [Google Cloud console](https://console.cloud.google.com/), create a project called "Let Me Guess" and select it.
2. **Enable the Drive API.** Go to *APIs & Services → Library*, open **Google Drive API** and click **Enable**.
3. **Set up the consent screen.** Open *Google Auth Platform*, click **Get started** and enter the app name *Let Me Guess*, your support email and audience **External**. Under *Branding*, add the home page `https://letmeguess-it.github.io/Mini-Games/` and the authorized domain `letmeguess-it.github.io`.
4. **Add the scopes.** Under *Data access → Add or remove scopes*, add `.../auth/drive.appdata`, `openid`, `.../auth/userinfo.email` and `.../auth/userinfo.profile`, then save.
5. **Create the client.** Under *Clients → Create client*, choose **Web application**. Under *Authorized JavaScript origins*, add `https://letmeguess-it.github.io` (optionally also `http://localhost:8000` for local testing). Redirect URIs aren't needed. Click **Create** and copy the **Client ID**.
6. **Add the legal pages.** Under *Branding*, set the privacy policy link to `https://letmeguess-it.github.io/Mini-Games/privacy.html` and the terms of service link to `https://letmeguess-it.github.io/Mini-Games/terms.html`.
7. **Publish.** Under *Audience*, add yourself as a test user to try it, then click **Publish app** so anyone can sign in. All the scopes are non-sensitive, so no review is needed.
8. **Add the ID.** Paste the Client ID into `assets/config.js` → `googleClientId`.

The client ID is public by design, so it's safe to commit. There is no client secret in this setup; never put one in the repo.

## Global leaderboard (Firebase)

An opt-in leaderboard on the dashboard has **Overall** and **This week** tabs, for all games or any single game. Players who join publish only a display name and point totals; everyone can read the boards. Points are daily-challenge scores played on their own day (calendar catch-ups don't count). Data lives in Cloud Firestore and is protected by `firestore.rules`.

Setup (uses the same Google Cloud project as sign-in):
1. In the [Firebase console](https://console.firebase.google.com/), click **Create a project**, choose your existing **Let Me Guess** Google Cloud project, and skip Analytics.
2. **Authentication → Get started → Sign-in method → Google → Enable**, then save. Under **Settings → Authorized domains**, add `letmeguess-it.github.io`.
3. **Firestore Database → Create database** in production mode, at a location near your players. On the **Rules** tab, paste in `firestore.rules`, then **Publish**.
4. **Project settings → General → Your apps → Web (</>)**: register "Let Me Guess" (no Hosting), then copy `apiKey`, `authDomain`, `projectId` and `appId` into `assets/config.js` → `firebase`.

These Firebase values are public identifiers, not secrets. The security rules control access.

## Running locally

```
python3 -m http.server 8000
# open http://localhost:8000
```

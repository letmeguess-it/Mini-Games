# Mini Games

Ten original guessing, estimation and logic games with a daily challenge in each, and a dashboard that pulls every game's stats together. It's pure static HTML, CSS and JavaScript, with no build step and no server.

**Play:** https://letmeguess-it.github.io/Mini-Games/ (once GitHub Pages is on)

## The games

| Game | Skill | The idea |
|---|---|---|
| **Ballpark** | Estimation | Guess quantities from 0.5 to 10⁶⁷ on a log slider. Scored in orders of magnitude. |
| **Compass** | Geography | Turn a dial to the great-circle heading between two cities, then guess the distance. |
| **Fermi** | Reasoning | "How many pairs of shoes are sold a day?" Estimate, optionally buy hidden factors of the reasoning chain, then see the full breakdown. |
| **Glyph** | Words | Find a hidden 5-letter word. Each guess only tells you how many letters are *shared* and how many are *placed*. |
| **Sonar** | Deduction | Ping cells on a 9×9 seabed. Each ping gives the step distance to the nearest unfound wreck. |
| **Equilibrium** | Logic | Symbols hide digits and the row and column sums give them away. "Check" only says how many you have right. |
| **Liar** | Logic | Higher/lower number hunt where the oracle lies exactly once. Has an optional consistency tracker. |
| **Chrono** | History | Place five historical moments on a timeline. Tolerance scales with how long ago they happened. |
| **Eyeball** | Perception | Flash dot counts, angles, fill percentages and length ratios. |
| **Oracle** | Induction | Test numbers against a secret rule, then pick it from look-alike candidates. |

Every game has:
- **Daily**: one attempt per day, seeded from the date, so everyone gets the same puzzle.
- **Practice**: unlimited random rounds.
- **Score history, streaks and a trend line** in the game's own tab.
- **Share result**, which copies an emoji summary.

## How it fits together

```
index.html            Dashboard (landing page): today's progress, insights, leaderboard
assets/core.js        Shared engine: localStorage history, seeded RNG, game shell, widgets
assets/core.css       Design system (light + dark mode)
assets/dashboard.js   Dashboard rendering; live-updates when a game tab records a score
assets/cloud.js       Optional Google sign-in, Drive sync and Firestore leaderboard
assets/config.js      Optional keys. Everything works with these left empty
games/<name>/         One folder per game: index.html + game.js
```

Games open in their own named tab. Each one writes to `localStorage`, and the dashboard listens for `storage` events, so its numbers update while you play in other tabs.

Adding a game means adding a folder with `index.html` and `game.js` (call `MG.game({ slug, howTo, setup(ctx) })` and finish with `ctx.finish(score0to100, { summary, share })`), plus one entry in `GAMES` in `assets/core.js`.

## Deploying (GitHub Pages)

Settings → Pages → *Deploy from a branch* → `main` / `(root)`. That's it.

## Turning on sign-in and the leaderboard (optional)

The site has no server, so the cloud features lean on Google services that browsers can talk to directly.

### 1. Google sign-in + Drive backup
Stats are saved to a hidden **app-data file in each player's own Google Drive** (scope `drive.appdata`, which can only see files this app created).

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project, then enable the **Google Drive API**.
2. *APIs & Services → OAuth consent screen*: set it up (External), and add the `.../auth/drive.appdata` scope.
3. *Credentials → Create OAuth client ID → Web application*. Under **Authorized JavaScript origins**, add `https://letmeguess-it.github.io` (and `http://localhost:8000` for local testing).
4. Paste the client ID into `assets/config.js` → `googleClientId`.

### 2. Global leaderboard (Firebase Firestore, free tier)
1. Create a [Firebase](https://console.firebase.google.com/) project. It's easiest to reuse the Google Cloud project from step 1.
2. *Authentication → Sign-in method → Google*: enable it. Under *Settings → Authorized domains*, add `letmeguess-it.github.io`.
3. *Firestore Database*: create it, then paste in these rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /players/{uid} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == uid
           && request.resource.data.total is int && request.resource.data.total <= 400000;
       }
       match /daily/{day}/players/{uid} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == uid
           && request.resource.data.points is int && request.resource.data.points <= 1000;
       }
     }
   }
   ```
4. *Project settings → Your apps → Web app*: copy `apiKey`, `authDomain`, `projectId` and `appId` into `assets/config.js` → `firebase`.

With Firebase set, sign-in goes through Firebase Auth and also grants the Drive scope, so both features work from one button. The leaderboard shows only first name + last initial and the Google profile photo.

> **Honest caveat:** with no server, scores are computed in the browser, so a determined player could submit fake numbers. The rules above cap the damage. Real anti-cheat would need a server that replays games.

## Running locally

```
python3 -m http.server 8000
# open http://localhost:8000
```

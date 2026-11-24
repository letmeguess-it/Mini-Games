/* Let Me Guess — site settings.
 *
 * googleClientId: the OAuth client ID from your Google Cloud project
 * (Google Auth Platform → Clients → your Web client). It looks like
 * "1234567890-abc123def456.apps.googleusercontent.com".
 *
 * Leave it empty and the site still works: progress just stays in each browser.
 *
 * firebase: the web-app config from your Firebase project (Project settings → Your apps).
 * It powers the opt-in global leaderboard. Leave it null to hide the leaderboard data.
 * These values are public identifiers, not secrets; access is controlled by the
 * Firestore security rules in firestore.rules.
 * A client ID is public by design; it is safe to commit. Never put a client SECRET here.
 */
window.LMG_CONFIG = {
  googleClientId: "689728352062-2f0i69ver7ggshobaphe7g513s2ec03l.apps.googleusercontent.com",
  firebase: null,
  // firebase: { apiKey: "…", authDomain: "….firebaseapp.com", projectId: "…", appId: "…" },
};

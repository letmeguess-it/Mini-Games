/* Mini Games — optional cloud configuration.
 *
 * Everything works with both values empty: stats stay in this browser.
 *
 * 1. googleClientId: enables "Sign in with Google". Stats are saved to a hidden
 *    app-data file in the player's own Google Drive (scope: drive.appdata).
 * 2. firebase: enables the global leaderboard (Firestore). When set, sign-in goes
 *    through Firebase Auth (Google provider) and Drive sync keeps working.
 *
 * See README.md → "Turning on sign-in and the leaderboard".
 */
window.MG_CONFIG = {
  googleClientId: "",
  firebase: null,
  // firebase: { apiKey: "…", authDomain: "….firebaseapp.com", projectId: "…", appId: "…" },
};

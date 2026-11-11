/* =========================================================
   Shared helpers used by the lobby AND every game page.
   Everything is saved in localStorage for now. When you add
   a multiplayer backend (Firebase, Supabase, etc.), only the
   functions in this file need to change.
   ========================================================= */

const Store = {
  KEY_NAME: "er_player_name",
  KEY_SCORES: "er_scores", // array of { name, game, score, date }

  safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked (private mode etc.) – game still works */
    }
  },

  getName() {
    return this.safeGet(this.KEY_NAME, "") || "Guest";
  },

  setName(name) {
    this.safeSet(this.KEY_NAME, name.trim().slice(0, 16));
  },

  getScores() {
    return this.safeGet(this.KEY_SCORES, []);
  },

  addScore(game, score) {
    const scores = this.getScores();
    scores.push({ name: this.getName(), game, score, date: Date.now() });
    this.safeSet(this.KEY_SCORES, scores);
  },

  bestFor(game) {
    const mine = this.getScores().filter(
      (s) => s.game === game && s.name === this.getName()
    );
    return mine.length ? Math.max(...mine.map((s) => s.score)) : null;
  },

  topScores(limit = 10) {
    return [...this.getScores()].sort((a, b) => b.score - a.score).slice(0, limit);
  },

  // "single" or "party" – set by the switch on the main menu, games read it
  KEY_MODE: "er_mode",
  getMode() {
    return this.safeGet(this.KEY_MODE, "single");
  },
  setMode(mode) {
    this.safeSet(this.KEY_MODE, mode === "party" ? "party" : "single");
  },

  // [dev] wipe every saved value this game created (all keys start with "er_")
  resetAll() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("er_"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* storage blocked */
    }
  },
};

/* ---------------------------------------------------------
   Keyboard: Esc = go back.
   Call onEscape(fn) on a page with what "back" means there.
   - If a pop-up is open, the browser closes it instead.
   - If you're typing in a box, Esc just leaves the box.
   --------------------------------------------------------- */
function onEscape(handler) {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.querySelector("dialog[open]")) return;
    const el = document.activeElement;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
      el.blur();
      return;
    }
    e.preventDefault();
    handler(e);
  });
}

const GAME_LABELS = {
  detective: "Detective Lie Detector",
  understand: "Understand",
  evaluate: "Evaluate",
};

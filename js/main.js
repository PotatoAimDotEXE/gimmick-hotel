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

  // [dev] AI grading switch (title screen). On by default.
  KEY_AI: "er_ai_grading",
  getAIGrading() {
    return this.safeGet(this.KEY_AI, true) !== false;
  },
  setAIGrading(on) {
    this.safeSet(this.KEY_AI, !!on);
  },

  // [dev] wipe every saved value this game created (all keys start with "er_")
  resetAll() {
    try {
      Object.keys(localStorage)
        // keep each room's "last case" (so a reset brings a different case) and the AI switch
        .filter((k) => k.startsWith("er_") && !k.endsWith("_last_case") && k !== "er_ai_grading")
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
  detective: "Effective Detective",
  interrogation: "Interrogation Station",
  paralegal: "Paranormal Paralegal",
};

/* ---------------------------------------------------------
   Daily helpers – for "of the day" modes (one try per day).
   --------------------------------------------------------- */
const Daily = {
  // "2026-11-22" in the player's local time
  key(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },
  // whole days from start to d (0 on the start day)
  daysSince(start, d = new Date()) {
    const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.max(0, Math.floor((b - a) / 86400000));
  },
  // "November 22nd 2026"
  pretty(d = new Date()) {
    const n = d.getDate();
    const suf = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
    return d.toLocaleString("en-GB", { month: "long" }) + " " + n + suf + " " + d.getFullYear();
  },
  // "7h 14m" until midnight
  timeLeft() {
    const t = new Date();
    const mid = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
    const mins = Math.ceil((mid - t) / 60000);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  },
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

//test

/* ---------------------------------------------------------
   Character sprites – one list for every game.
   Add a character here once and every suspect file, portrait
   and interrogation uses it. Paths are from the project root.
   --------------------------------------------------------- */
// A sprite is a path, or { src, focus, zoom }:
//   focus = the point across the picture's width that sits in the middle of
//           the frame ("77%" = right of centre, shifts the sprite left)
//   zoom  = size in the detective portrait frames (1.08 = default, smaller = zoomed out)
//   y     = move up/down, in % of the frame's height (5 = up a bit, -5 = down a bit)
//   tilt  = rotate in degrees (3 = tilt right/clockwise, -3 = tilt left)
//   y and tilt work in both the detective game and the interrogation room.
//   file  = separate settings for the big picture on a person's interview page
//           in the detective game, e.g. file: { zoom: 1.1, y: -2, tilt: 1, focus: "55%" }
//           (that page shows the whole picture; these don't change the small cards)
const SPRITES = {
  "Tung Tung Tung Sahur": { src: "assets/characters/tung.png", zoom: 0.97, y: -3, tilt:-1.5, file: {y: -3}},
  "Jane Maid": { src: "assets/characters/jane-maid.png", focus: "74%", zoom: 1.22, y: -14},
  "Jack O'Lantern": { src: "assets/characters/jack-olantern.png", focus: "47%", zoom: 1.02, y: -3, tilt:-2 },
  "Tralalero Tralala": { src: "assets/characters/tralalero.png", zoom: 1.1, y: -10, file: {zoom: 0.95, y: 3} },
  "Atten Dan": { src: "assets/characters/atten-dan.png", zoom: 0.99, y: -4, file: {zoom: 1.02, y: -3} },
  "Capybara": { src: "assets/characters/capybara.png" },
  "Sue Pervisor": { src: "assets/characters/sue-pervisor.png", zoom: 1.2, y: -19.5, file: {y: -13, zoom: 1.1} },
  // Kit and Bea share one sprite (they never appear in the same case)
  "Kit": { src: "assets/characters/kit-bea.png", y: -10, file: {y: -3} },
  "Bea": { src: "assets/characters/kit-bea.png", y: -10, file: {y: -3} },
};
// pages inside games/ need "../" in front
function spriteFor(name, root = "../") {
  const s = SPRITES[name];
  return s ? root + (typeof s === "string" ? s : s.src) : "";
}
function spriteFocus(name) {
  const s = SPRITES[name];
  return s && typeof s === "object" && s.focus ? s.focus : "50%";
}
function spriteZoom(name) {
  const s = SPRITES[name];
  return s && typeof s === "object" && s.zoom ? s.zoom : 1.08;
}
// settings for the big interview-page picture (detective game), as CSS variables
function spriteFile(name) {
  const s = SPRITES[name];
  const f = (s && typeof s === "object" && s.file) || {};
  return `--fzoom: ${Number(f.zoom) || 1}; --fy: ${Number(f.y) || 0}; --ftilt: ${Number(f.tilt) || 0}deg; --ffx: ${f.focus || "50%"};`;
}
// y / tilt as CSS variables, for a style="" attribute
function spriteMove(name) {
  const s = SPRITES[name];
  const o = s && typeof s === "object" ? s : {};
  return `--y: ${Number(o.y) || 0}; --tilt: ${Number(o.tilt) || 0}deg;`;
}

/* ---------------------------------------------------------
   AI grader (DeepSeek, through your Cloudflare Worker).
   Paste the Worker's address between the quotes, e.g.
     const AI_GRADER_URL = "https://hotel-grader.yourname.workers.dev";
   Leave it "" to keep using the built-in placeholder graders.
   Setup steps: worker/README.md. Never put the API key here.
   --------------------------------------------------------- */
const AI_GRADER_URL = "https://hotel-grader.arthiprasertsuk.workers.dev";

// true when the AI grader should be used: an address is set AND the
// [dev] switch on the title screen is on
function aiGradingOn() {
  return !!AI_GRADER_URL && Store.getAIGrading();
}

async function askAIGrader(payload, timeoutMs = 30000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(AI_GRADER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Grader error " + res.status);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

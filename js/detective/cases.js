/* =========================================================
   DETECTIVE LIE DETECTOR – CASE DATA
   ---------------------------------------------------------
   The writing team fills this in. Everything here is
   placeholder (lorem ipsum).

   One case is picked per day (Case of the Day). The cases
   rotate in order, so add as many as you like.

   Each case needs:
     id          unique string
     title       case name
     briefing    the opened case file (left + right page)
     suspects    exactly 5 suspects
     difficulty  which suspects appear on each difficulty
                 (easy = 3, medium = 4, hard = 5)
                 -> the culprit MUST be in all three lists
     culprit     id of the guilty suspect
     rubric      how the AI should grade the reasoning (later)
   ========================================================= */

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
const LOREM_LONG =
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";

function placeholderSuspect(id, letter) {
  return {
    id,
    name: "Suspect " + letter,
    role: "Occupation (placeholder)",
    image: "", // e.g. "../assets/suspects/" + id + ".png" – leave empty for the placeholder figure
    statement: LOREM,
    alibi: LOREM_LONG,
    evidence: [LOREM, "Sed ut perspiciatis unde omnis iste natus error sit voluptatem."],
  };
}

const CASES = [
  {
    id: "case-a",
    title: "The Case of the Placeholder",
    briefing: {
      left: {
        heading: "Case Summary",
        body: [LOREM, LOREM_LONG],
      },
      right: {
        heading: "Witness Statements",
        body: [
          "Witness 1: “" + LOREM + "”",
          "Witness 2: “Nemo enim ipsam voluptatem quia voluptas sit aspernatur.”",
          "Log 21:04 – " + LOREM,
        ],
      },
    },
    suspects: [
      placeholderSuspect("a1", "A"),
      placeholderSuspect("a2", "B"),
      placeholderSuspect("a3", "C"),
      placeholderSuspect("a4", "D"),
      placeholderSuspect("a5", "E"),
    ],
    difficulty: {
      easy: ["a1", "a2", "a3"],
      medium: ["a1", "a2", "a3", "a4"],
      hard: ["a1", "a2", "a3", "a4", "a5"],
    },
    culprit: "a2",
    rubric:
      "PLACEHOLDER RUBRIC. 10 = cites the key contradiction between the alibi and the 21:04 log. 6 = cites relevant evidence but misses the contradiction. 3 = vague reasoning. 0 = no reasoning.",
  },

  {
    id: "case-b",
    title: "The Second Placeholder Case",
    briefing: {
      left: { heading: "Case Summary", body: [LOREM_LONG, LOREM] },
      right: { heading: "Evidence Log", body: [LOREM, LOREM_LONG] },
    },
    suspects: [
      placeholderSuspect("b1", "A"),
      placeholderSuspect("b2", "B"),
      placeholderSuspect("b3", "C"),
      placeholderSuspect("b4", "D"),
      placeholderSuspect("b5", "E"),
    ],
    difficulty: {
      easy: ["b1", "b3", "b4"],
      medium: ["b1", "b2", "b3", "b4"],
      hard: ["b1", "b2", "b3", "b4", "b5"],
    },
    culprit: "b3",
    rubric: "PLACEHOLDER RUBRIC.",
  },
];

/* Fun facts shown on the game menu (placeholder). */
const FUN_FACTS = [
  "Fun fact placeholder #1: lorem ipsum dolor sit amet.",
  "Fun fact placeholder #2: consectetur adipiscing elit.",
  "Fun fact placeholder #3: sed do eiusmod tempor.",
];

/* =========================================================
   PARANORMAL PARALEGAL – CASE DATA
   ---------------------------------------------------------
   The writing team fills this in. Everything here is
   placeholder (lorem ipsum).

   One case is picked per day (Case of the Day). Cases rotate
   in order, so add as many as you like.

   Each case needs:
     id            unique string
     debrief       what Jane Debrief says about TODAY's case
                   (shown after the general intro lines below)
     pages         exactly 5 pages of case info
                   (highlights are hidden on hard mode)
                     easy = pages 1-3, medium = 1-4, hard = 1-5
                     pages 4 and 5 should be the harder ones
                   - wrap key words in [[double brackets]] to
                     highlight them (the hints)
                   - image: path to a picture/chart, or "" for a
                     placeholder box, or leave it out for none
     keywords      what a good description should mention.
                   words = the keyword + accepted synonyms.
                   page  = the page it comes from (keywords from
                           pages 4-5 only count on medium/hard)
     titleKeywords words a good case title would use
     rubric        how the AI should grade (later)
   ========================================================= */

/* General intro Jane gives before every case. */
const PARALEGAL_INTRO = [
  "Welcome to the firm. I'm Jane Debrief, and I'll be your supervisor.",
  "You'll be given a written description of events that transpired in the hotel... Your boss needs an executive summary of it.",
  // a line can have a different version for hard mode
  {
    normal: "Read every page in the case file. Highlighted words are the key points.",
    hard: "Read every page in the case file. On hard mode nothing is highlighted, so you'll have to spot the key points yourself.",
  },
  "On the last page, give the case a short, fitting title and write a description that covers all the key points.",
  "Your title is worth 5 points and your description 10. Mention every key point to get full marks.",
];

const PARALEGAL_CASES = [
  {
    id: "pp-a",
    debrief: [
      "Today's case is... lorem ipsum dolor sit amet, something ridiculous in the hotel ballroom.",
      "Good luck. The boss hates long summaries.",
    ],
    pages: [
      {
        heading: "Incident Report",
        body: [
          "So here's what happened... Lorem ipsum dolor sit amet, a [[ghost]] was seen in the ballroom at midnight.",
          "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
        ],
        image: "",
      },
      {
        heading: "Witness Statement",
        body: [
          "“Ut enim ad minim veniam, the [[chandelier]] started swinging on its own.”",
          "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.",
        ],
      },
      {
        heading: "Staff Log",
        body: [
          "23:58 – Duis aute irure dolor in reprehenderit.",
          "00:04 – Guests [[evacuated]] the ballroom.",
          "00:30 – Excepteur sint occaecat cupidatat non proident.",
        ],
        image: "",
      },
      {
        heading: "Insurance Assessment",
        body: [
          "Sed ut perspiciatis unde omnis iste natus error sit voluptatem: [[damages]] estimated at lorem ipsum.",
          "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
        ],
      },
      {
        heading: "Expert Opinion",
        body: [
          "Neque porro quisquam est, qui dolorem ipsum: the [[paranormal]] activity is consistent with lorem.",
          "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae.",
        ],
        image: "",
      },
    ],
    keywords: [
      { words: ["ghost", "spirit", "phantom", "apparition"], page: 1 },
      { words: ["chandelier", "light"], page: 2 },
      { words: ["evacuated", "evacuation", "left", "fled"], page: 3 },
      { words: ["damages", "damage", "cost"], page: 4 },
      { words: ["paranormal", "supernatural"], page: 5 },
    ],
    titleKeywords: ["ghost", "ballroom", "chandelier", "haunting", "midnight"],
    rubric:
      "PLACEHOLDER RUBRIC. Title (5): short, specific, mentions the ghost/ballroom. Description (10): covers every keyword for the difficulty, in the right order, without extra detail.",
  },

  {
    id: "pp-b",
    debrief: ["Today's case is... sed ut perspiciatis, a placeholder disaster in the kitchen."],
    pages: [
      { heading: "Incident Report", body: ["Lorem ipsum: the [[soup]] began to glow."], image: "" },
      { heading: "Witness Statement", body: ["“Dolor sit amet, the [[chef]] screamed.”"] },
      { heading: "Staff Log", body: ["12:00 – The kitchen was [[closed]]."] },
      { heading: "Health Inspection", body: ["Consectetur: a [[contamination]] report was filed."], image: "" },
      { heading: "Expert Opinion", body: ["Adipiscing elit: possibly [[cursed]] ingredients."] },
    ],
    keywords: [
      { words: ["soup", "food"], page: 1 },
      { words: ["chef", "cook"], page: 2 },
      { words: ["closed", "shut"], page: 3 },
      { words: ["contamination", "contaminated"], page: 4 },
      { words: ["cursed", "curse", "hex"], page: 5 },
    ],
    titleKeywords: ["soup", "kitchen", "glowing", "chef"],
    rubric: "PLACEHOLDER RUBRIC.",
  },
];

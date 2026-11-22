/* =========================================================
   INTERROGATION ROOM – LOG DATA
   ---------------------------------------------------------
   The writing team fills this in. Everything here is
   placeholder (lorem ipsum).

   One log is picked per day (Log of the Day). Logs rotate
   in order, so add as many as you like.

   Each log needs:
     id          unique string
     suspect     name shown in the dialogue box
     summary     short text shown on the CRT TV
     briefing    the case file (left + right page)
     statements  what the suspect says, per difficulty, in order
                   easy   = 3 statements, 1 lie
                   medium = 4 statements, 1 lie
                   hard   = 5 statements, 2 lies
                 mark each lie with  lie: true
   ========================================================= */

const LOGS = [
  {
    id: "log-a",
    suspect: "Suspect (placeholder)",
    image: "", // e.g. "../assets/suspects/log-a.png" – empty = placeholder figure
    summary: "Lorem ipsum dolor sit amet. Incident at 21:04, room 3B.",
    briefing: {
      left: {
        heading: "Case Summary",
        body: [
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
          "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        ],
      },
      right: {
        heading: "Notes",
        body: [
          "Note 1: Duis aute irure dolor in reprehenderit in voluptate velit esse.",
          "Note 2: Excepteur sint occaecat cupidatat non proident, at 21:04.",
          "Note 3: Sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ],
      },
    },
    statements: {
      easy: [
        { text: "My name is Lorem Ipsum." },
        { text: "I checked into the hotel in the morning.", lie: true },
        { text: "I was in my room all evening." },
      ],
      medium: [
        { text: "My name is Lorem Ipsum." },
        { text: "I was born in 2005. My mom is from Ohio." },
        { text: "I checked into the hotel in the morning.", lie: true },
        { text: "I was in my room all evening." },
      ],
      hard: [
        { text: "My name is Lorem Ipsum." },
        { text: "I was born in 2005. My mom is from Ohio." },
        { text: "I checked into the hotel in the morning.", lie: true },
        { text: "I never left my room after dinner.", lie: true },
        { text: "I heard a noise from the hallway around nine." },
      ],
    },
  },

  {
    id: "log-b",
    suspect: "Second Suspect (placeholder)",
    image: "",
    summary: "Sed ut perspiciatis unde omnis. Missing item from the lobby.",
    briefing: {
      left: { heading: "Case Summary", body: ["Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium."] },
      right: { heading: "Notes", body: ["Note 1: Nemo enim ipsam voluptatem quia voluptas sit aspernatur.", "Note 2: Neque porro quisquam est."] },
    },
    statements: {
      easy: [
        { text: "Lorem statement one." },
        { text: "Lorem statement two." },
        { text: "Lorem statement three.", lie: true },
      ],
      medium: [
        { text: "Lorem statement one." },
        { text: "Lorem statement two.", lie: true },
        { text: "Lorem statement three." },
        { text: "Lorem statement four." },
      ],
      hard: [
        { text: "Lorem statement one.", lie: true },
        { text: "Lorem statement two." },
        { text: "Lorem statement three." },
        { text: "Lorem statement four.", lie: true },
        { text: "Lorem statement five." },
      ],
    },
  },
];

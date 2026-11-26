/* =========================================================
   PARANORMAL PARALEGAL – CASE DATA
   ---------------------------------------------------------
   One case is picked AT RANDOM each day (never the same as
   last time). It changes when the day changes or on a dev reset.
   Case names are NEVER shown to players (some are the model
   answer title).

   Each case:
     id, name        internal only
     debrief         John D'Brief's lines about today's case (after the intro)
     versions        one full version per difficulty: easy / medium / hard
       report        case report paragraphs (page 1)
       evidence      one page per item, in order. Add more items to add pages.
                       label   heading, e.g. "A. Yellow umbrella, lobby camera still"
                       kind    "picture" (art to come), "table" or "note"
                       text    the description / quote
                       table   { head: [...], rows: [[...], ...] }  for logs
       task          { title: "...", summary: "..." } shown on the summary sheet
       rubric        1-point checks, scored out of 5 (title 1 + summary 4).
                       what    what earns the point (shown in the breakdown)
                       field   "title" or "summary"
                       need    groups of words; EVERY group needs one match.
                               A word matches the start of a word, so
                               "float" also matches "floated", "floating".
                       blame   words that LOSE the point if the player blames
                               them (e.g. the loose nail). A sentence with
                               "not / wasn't / ruled out..." doesn't count.
                     The AI grader will get these plus the sample answer.
       sample        { title, summary }  a full-marks answer
       traps         (hard) { name, field, blame or titleMiss } shown in results
   Highlights: wrap key words in [[double brackets]] (easy + medium only;
   they're hidden on hard). Pick the words the rubric grades.
   ========================================================= */

/* General intro John D'Brief (the bellboy) gives before every case. */
const PARALEGAL_INTRO = [
  "Welcome to the firm. I'm John D'Brief. Most guests just call me the bellboy, but tonight I'm your supervisor.",
  "Something strange has happened in the hotel, and your boss needs a short summary of it.",
  "Read the case report first, then every piece of evidence in the file.",
  {
    normal: "Highlighted words are the important details. Make sure your summary covers them.",
    hard: "On hard mode nothing is highlighted, so you'll have to decide what matters yourself.",
  },
  "On the last page, give the case a short title and write a one or two sentence summary. You're scored out of 5: 1 point for the title and 4 for the summary.",
];

const PARALEGAL_CASES = [
  /* =========================================================
     CASE 1 – Floaty 'Breller
     ========================================================= */
  {
    id: "floaty-breller",
    name: "Floaty 'Breller",
    debrief: ["Tonight's case: something odd happened in the lobby just after midnight. Read carefully."],
    versions: {
      easy: {
        report: [
          "Just after midnight, Tung Tung Tung Sahur was carrying a wooden bat across the hotel lobby. The bell at the empty coat-check desk rang, so he went to look. A yellow [[umbrella]] rose out of the stand, [[opened by itself]], and floated past him. [[Nobody was holding it]].",
          "Tung jumped and [[dropped the bat]]. It [[chipped]] when it hit the floor. When he picked it up, a [[splinter cut his thumb]], and a little [[blood got on the bat]].",
          "The [[elevator]] doors opened. The umbrella [[floated inside]] and closed itself just before the doors shut.",
        ],
        evidence: [
          { label: "A. Yellow umbrella, lobby camera still", kind: "picture", text: "The umbrella is open and floating above the elevator floor. Its handle hangs in midair." },
          { label: "B. Chipped wooden bat, item description", kind: "picture", text: "A piece of wood is missing from one end. There is a [[small smear of blood]] on the edge of the chip." },
        ],
        task: { title: "Give the incident a short title.", summary: "In one or two sentences, describe what Tung saw and explain how blood got on the bat." },
        rubric: [
          { what: "Gives a short title about the umbrella", field: "title", need: [["umbrella", "brolly", "breller", "parasol"]] },
          { what: "Says the umbrella moved by itself", field: "summary", need: [["itself", "its own", "nobody", "no one", "float", "flew", "fly", "flying", "hover", "drift", "levitat"]] },
          { what: "Says the umbrella went into the elevator", field: "summary", need: [["elevator", "lift"]] },
          { what: "Says Tung dropped the bat in surprise and it chipped", field: "summary", need: [["drop", "fell", "slip", "let go"], ["chip", "broke", "broken", "crack", "damage"]] },
          { what: "Says a splinter cut Tung's thumb when he picked the bat up, leaving blood on it", field: "summary", need: [["splinter"], ["thumb", "finger", "hand", "cut", "nick"]] },
        ],
        sample: {
          title: "The Umbrella That Took the Elevator",
          summary: "Tung saw a yellow umbrella float by itself into the elevator. He dropped his bat in surprise and it chipped, and then a splinter cut his thumb when he picked it up.",
        },
      },

      medium: {
        report: [
          "Just after midnight, Tung Tung Tung Sahur was returning a wooden bat to the hotel storeroom when the bell at the empty coat-check desk rang. He went over to check. A yellow [[umbrella]] rose out of the stand, [[snapped open]], and floated past him. [[Nobody was holding it]].",
          "Tung jumped back and [[dropped the bat]]. It [[chipped when it hit the tile]], and a [[splinter nicked his thumb]] when he picked it up. Across the lobby, the [[elevator]] doors opened. The umbrella [[drifted inside]] and folded itself just before the doors closed.",
        ],
        evidence: [
          { label: "A. Yellow umbrella, lobby camera still", kind: "picture", text: "The umbrella is open and floating above the elevator floor. Its handle hangs in midair." },
          { label: "B. Chipped and bloodied wooden bat, item description", kind: "picture", text: "A piece of wood is missing from one end. A [[small smear of blood]] marks the edge of the chip." },
          {
            label: "C. Front desk incident log",
            kind: "table",
            table: {
              head: ["Time", "Event"],
              rows: [
                ["12:02 a.m.", "The front desk clerk hears the coat-check bell ring."],
                ["12:03 a.m.", "The lobby camera shows the umbrella entering the elevator."],
                ["12:05 a.m.", "The front desk clerk gives Tung a [[bandage for his thumb]]."],
              ],
            },
          },
        ],
        task: { title: "Give the incident a short title.", summary: "In one or two sentences, describe what Tung saw and explain how blood got on the bat." },
        rubric: [
          { what: "Gives the case a short title that captures the main event (the umbrella)", field: "title", need: [["umbrella", "brolly", "breller", "parasol"]] },
          { what: "Says the umbrella moved on its own", field: "summary", need: [["itself", "its own", "nobody", "no one", "float", "flew", "fly", "flying", "hover", "drift", "levitat"]] },
          { what: "Says the umbrella entered the elevator", field: "summary", need: [["elevator", "lift"]] },
          { what: "Explains that Tung dropped the bat in surprise and it chipped when it hit the tile", field: "summary", need: [["drop", "fell", "slip", "let go"], ["chip", "broke", "broken", "crack", "damage"]] },
          { what: "Explains that Tung nicked his thumb on a splinter when he picked up the bat, leaving blood on it", field: "summary", need: [["splinter"], ["thumb", "finger", "hand", "cut", "nick"]] },
        ],
        sample: {
          title: "The Umbrella That Took the Elevator",
          summary: "Tung heard the coat-check bell and saw a yellow umbrella float into the elevator on its own. He dropped his bat in surprise and it chipped, then he nicked his thumb on a splinter when he picked it up.",
        },
      },

      hard: {
        report: [
          "Just after midnight, the lobby was empty apart from Tung Tung Tung Sahur, who was carrying a wooden bat back toward the storeroom at the far end of the east corridor. Halfway across the lobby, he heard the bell at the coat-check desk ring, although no attendant had been on duty there since eleven. He went over to investigate.",
          "As he reached the counter, a yellow umbrella rose out of the stand, snapped open, and floated past him at head height. There was no one holding it. Tung leapt backward, and the bat slipped from his grip and struck the tiled floor. He snatched it up again almost at once, wincing, and stared across the lobby.",
          // last sentence added so the loose nail (storeroom, 12:20) is clearly ruled out
          "The elevator doors had slid open. The umbrella drifted inside, folded itself neatly, and the doors closed behind it. Tung never made it to the storeroom that night.",
        ],
        evidence: [
          { label: "A. Yellow umbrella, lobby camera still", kind: "picture", text: "The umbrella is open and floating above the elevator floor. Its handle hangs in midair." },
          { label: "B. Chipped wooden bat, item description", kind: "picture", text: "A piece of wood is missing from one end, and a sharp splinter sticks out from the broken edge. A small smear of blood marks the edge of the chip." },
          {
            label: "C. Front desk incident log",
            kind: "table",
            table: {
              head: ["Time", "Event"],
              rows: [
                ["12:02 a.m.", "The front desk clerk hears the coat-check bell ring."],
                ["12:03 a.m.", "The lobby camera shows the umbrella entering the elevator."],
                ["12:05 a.m.", "The front desk clerk gives Tung a bandage for his thumb."],
                ["12:20 a.m.", "Maintenance reports a loose nail on a storeroom shelf, east corridor."],
              ],
            },
          },
        ],
        task: { title: "Give the incident a short title.", summary: "In one or two sentences, describe what Tung saw and explain how blood got on the bat." },
        rubric: [
          { what: "Gives a short title that captures the main event: the umbrella, not the bat (a title about the bat or the blood earns 0)", field: "title", need: [["umbrella", "brolly", "breller", "parasol"]] },
          { what: "Says the umbrella moved on its own", field: "summary", need: [["itself", "its own", "nobody", "no one", "float", "flew", "fly", "flying", "hover", "drift", "levitat"]] },
          { what: "Says the umbrella entered the elevator", field: "summary", need: [["elevator", "lift"]] },
          { what: "Explains that Tung dropped the bat in shock and it chipped on the tiles", field: "summary", need: [["drop", "fell", "slip", "let go"], ["chip", "broke", "broken", "crack", "damage"]] },
          {
            what: "Works out that Tung cut his thumb on the splinter when he snatched the bat up, which left the blood at the chip (blaming the loose nail loses this point)",
            field: "summary",
            need: [["splinter"], ["thumb", "finger", "hand", "cut", "nick"]],
            blame: ["nail"],
          },
        ],
        sample: {
          title: "The Umbrella That Took the Elevator",
          summary: "Just after midnight, Tung saw a yellow umbrella open by itself, float across the lobby and fold itself inside the elevator. He dropped his bat in shock and chipped it, then cut his thumb on the splinter when he grabbed it again, which explains the blood at the chip and the bandage he got at 12:05.",
        },
        traps: [
          { name: "The title trap", info: "The bat and the blood are vivid, but the main event is the umbrella.", field: "title", titleMiss: true },
          { name: "The loose nail", info: "The nail was reported on a storeroom shelf at 12:20. The splinter and blood on the bat explain the cut.", field: "summary", blame: ["nail"] },
        ],
      },
    },
  },

  /* =========================================================
     CASE 2 – The Cat That Left Its Painting (name = model title: never shown)
     ========================================================= */
  {
    id: "cat-painting",
    name: "The Cat That Left Its Painting",
    debrief: ["Today's case: one of the paintings on the third floor has been acting strangely."],
    versions: {
      easy: {
        report: [
          "Jane Maid was cleaning a hallway in the hotel. She saw a painting of a garden with a little black cat on a stone bench. She left her cleaning cart near the painting and went to get more spray.",
          "When Jane came back, [[the cat was gone from the painting]]. [[Wet paw prints]] went from the wall under the painting [[to her cart]]. The [[blue-striped towel]] she had left on the cart [[was gone]].",
          "Then Jane looked at the painting again. [[The cat was back]], curled up on a [[blue-striped towel]].",
        ],
        evidence: [
          { label: "A. Hotel inventory photo, garden painting", kind: "picture", text: "The photo shows a black cat sitting on a [[bare stone bench]]." },
          { label: "B. Wet paw prints, hallway photo", kind: "picture", text: "Small paw prints cross the carpet between the wall under the painting and Jane's cleaning cart." },
        ],
        task: { title: "Give the incident a short title.", summary: "In one or two sentences, explain what happened to the cat and how the paw prints and towel help explain it." },
        rubric: [
          { what: "Gives a short title about the cat leaving the painting", field: "title", need: [["cat", "kitty", "kitten", "feline"]] },
          { what: "Says the cat disappeared from the painting", field: "summary", need: [["gone", "disappear", "vanish", "left", "leave", "out of", "escape", "missing", "stepped out", "walked out"]] },
          { what: "Says the cat came back", field: "summary", need: [["back", "return", "reappear", "again"]] },
          { what: "Says the paw prints show the cat walked from the painting to the cart", field: "summary", need: [["paw", "print", "footprint", "track"], ["cart"]] },
          { what: "Says the cat took Jane's towel, because the towel in the painting matches the one missing from the cart", field: "summary", need: [["towel"], ["took", "take", "stole", "jane's", "her", "match", "same", "missing"]] },
        ],
        sample: {
          title: "The Cat That Left Its Painting",
          summary: "The cat walked out of the painting and left wet paw prints to Jane's cart. It took her blue-striped towel and came back to sleep on it in the painting.",
        },
      },

      medium: {
        report: [
          "Jane Maid was cleaning the hotel's third-floor hallway. As she passed a painting of the hotel garden, she noticed the little black cat painted on a stone bench. She parked her cleaning cart nearby and went to refill her spray bottle.",
          "When Jane came back, [[the bench in the painting was empty]]. A trail of [[wet paw prints]] led from the wall below the frame [[to her cart]], and the [[blue-striped hand towel]] she'd left on the top shelf [[was gone]].",
          "Jane looked back at the painting. [[The cat was on the bench again]], curled up on a [[blue-striped towel]].",
        ],
        evidence: [
          { label: "A. Hotel inventory photo, garden painting", kind: "picture", text: "The photo shows a black cat sitting on a [[bare stone bench]]." },
          { label: "B. Wet paw prints, hallway photo", kind: "picture", text: "Small paw prints cross the carpet between the wall beneath the painting and Jane's cleaning cart." },
          { label: "C. Jane's cleaning cart, item description", kind: "picture", text: "The top shelf holds a stack of plain white towels. Jane says she left a single [[blue-striped towel]] on top of the stack before she went to refill her bottle." },
        ],
        task: { title: "Give the incident a short title.", summary: "In one or two sentences, explain what happened to the cat and how the paw prints and towel help explain it." },
        rubric: [
          { what: "Gives the incident a short title that captures the main event (the cat)", field: "title", need: [["cat", "kitty", "kitten", "feline"]] },
          { what: "Says the cat disappeared from the painting", field: "summary", need: [["gone", "disappear", "vanish", "left", "leave", "out of", "escape", "missing", "stepped out", "walked out", "empty"]] },
          { what: "Says the cat reappeared", field: "summary", need: [["back", "return", "reappear", "again"]] },
          { what: "Explains how the paw prints suggest the cat stepped out of the painting and went to the cart", field: "summary", need: [["paw", "print", "footprint", "track"], ["cart"]] },
          { what: "Connects the towel missing from the cart with the towel that appeared in the painting", field: "summary", need: [["towel"], ["took", "take", "stole", "jane's", "her", "match", "same", "missing"]] },
        ],
        sample: {
          title: "The Cat That Left Its Painting",
          summary: "The painted cat disappeared, and wet paw prints led from its frame to Jane's cart. It reappeared in the painting curled up on a towel that matched the one missing from her cart, suggesting it had stepped out to take it.",
        },
      },

      hard: {
        report: [
          "Late in the afternoon, Jane Maid was cleaning the third-floor hallway, where a large painting of the hotel garden hangs between Rooms 304 and 306. As she passed it, she noticed the little black cat painted on a stone bench and smiled; she had always liked that detail. She parked her cleaning cart a few steps away and went down the hall to refill her spray bottle.",
          "When she returned, she stopped short. The stone bench in the painting was empty. She looked up and down the hallway, then down at the carpet, which was still damp from her mopping.",
          "By the time she looked back at the painting, the cat was on the bench once more, curled up on something blue and white.",
        ],
        evidence: [
          { label: "A. Hotel inventory photo, garden painting", kind: "picture", text: "The photo shows a black cat sitting on a bare stone bench." },
          { label: "B. Wet paw prints, hallway photo", kind: "picture", text: "Small paw prints run across the damp carpet from the wall beneath the painting to Jane's cleaning cart, then turn and lead back to the wall." },
          { label: "C. Jane's cleaning cart, item description", kind: "picture", text: "The top shelf holds a stack of plain white towels. Jane says she left a single blue-striped hand towel on top of the stack before she went to refill her bottle." },
          { label: "D. Housekeeping notice board", kind: "note", text: "“Reminder: Mochi, the hotel's ginger cat, naps in the lobby every afternoon. Please don't let her upstairs.”" },
        ],
        task: { title: "Give the incident a short title.", summary: "In one or two sentences, explain what happened to the cat and how the paw prints and towel help explain it." },
        rubric: [
          { what: "Gives a short title that captures the main event: the cat leaving the painting (a title about only the towel or the paw prints earns 0)", field: "title", need: [["cat", "kitty", "kitten", "feline"]] },
          { what: "Says the cat disappeared from the painting", field: "summary", need: [["gone", "disappear", "vanish", "left", "leave", "out of", "escape", "missing", "stepped out", "walked out", "empty"]] },
          { what: "Says the cat reappeared", field: "summary", need: [["back", "return", "reappear", "again", "once more"]] },
          {
            what: "Explains that the paw prints run from the wall under the painting to the cart and back, so the cat left the painting and returned (blaming Mochi loses this point)",
            field: "summary",
            need: [["paw", "print", "footprint", "track"], ["cart"]],
            blame: ["mochi", "ginger"],
          },
          { what: "Works out that the cat is lying on Jane's towel: her blue-striped towel is no longer on the cart, and the inventory photo shows the bench was bare before", field: "summary", need: [["towel"], ["took", "take", "stole", "jane's", "her", "match", "same", "missing"]] },
        ],
        sample: {
          title: "The Cat That Left Its Painting",
          summary: "The painted cat vanished from its bench, and wet paw prints ran from the wall under the painting to Jane's cart and back. When it reappeared, it was curled on Jane's blue-striped towel, because that towel is missing from her cart and the inventory photo shows the bench used to be bare.",
        },
        traps: [
          { name: "The title trap", info: "A title about only the towel or the paw prints misses the main event: the cat leaving the painting.", field: "title", titleMiss: true },
          { name: "Mochi, the hotel cat", info: "Mochi is ginger, she naps in the lobby, and the prints start at the wall under the painting.", field: "summary", blame: ["mochi", "ginger"] },
        ],
      },
    },
  },

  /* =========================================================
     CASE 3 – Lost, Found & Floating
     ========================================================= */
  {
    id: "lost-found-floating",
    name: "Lost, Found & Floating",
    debrief: ["Today's case: Rosa found something unusual while sorting the lost-and-found."],
    versions: {
      easy: {
        report: [
          "Rosa was sorting the hotel's lost-and-found. She found a yellow smiley-face plushie and an old music box. She put the plushie on the counter and turned the key on the music box.",
          "[[When the music played]], the plushie [[floated up and sang]], “Hey, it's me, it's Verity! Ask me anything!” [[When the music stopped]], it [[went quiet and fell]] back onto the counter.",
          "Rosa [[played the music again]]. The plushie [[floated up and sang the same line again]].",
        ],
        evidence: [
          { label: "A. Verity, plushie tag", kind: "picture", text: "The name VERITY is stitched onto the back of the plushie." },
          {
            label: "B. Rosa's lost-and-found log",
            kind: "table",
            table: {
              head: ["Time", "Music box", "Verity"],
              rows: [
                ["9:06 p.m.", "[[Music starts.]]", "[[Floats up and sings.]]"],
                ["9:07 p.m.", "[[Music stops.]]", "[[Goes quiet]] and falls onto the counter."],
                ["9:08 p.m.", "[[Music starts again.]]", "Floats up and sings the [[same line]]."],
              ],
            },
          },
        ],
        task: { title: "Give the incident a short title.", summary: "In one or two sentences, describe what Verity did and explain what Rosa's second test suggests." },
        rubric: [
          { what: "Gives a short title about Verity floating and singing", field: "title", need: [["float", "sing", "sang", "song", "encore", "levitat", "hover", "fly", "flying"]] },
          { what: "Says Verity floated and sang when the music played", field: "summary", need: [["float", "rose", "fly", "flew", "hover", "lift", "levitat"], ["sing", "sang", "song"]] },
          { what: "Says Verity fell quiet when the music stopped", field: "summary", need: [["quiet", "silent", "stop", "dropped", "fell", "fall", "drop"]] },
          { what: "Says Verity did the same thing when Rosa played the music again", field: "summary", need: [["again", "second", "same", "both", "twice", "repeat", "restart", "9:08"]] },
          { what: "Says the music makes Verity float and sing", field: "summary", need: [["music", "tune", "song", "melody"], ["make", "made", "cause", "because", "so ", "suggest", "means"]] },
        ],
        sample: {
          title: "The Singing Plushie",
          summary: "Verity floated up and sang when the music played, and fell quiet when it stopped. She did it again the second time, so the music makes her float and sing.",
        },
      },

      medium: {
        report: [
          "While sorting the hotel's lost-and-found, Rosa found a yellow smiley-face plushie and an old music box. She set the plushie on the counter and wound the box to see if it still worked.",
          "[[As soon as the music played]], the plushie [[floated up]] to eye level, turned to face Rosa, and [[sang]], “Hey, it's me, it's Verity! Ask me anything!” [[When the tune stopped]], it [[went quiet and dropped]] onto the counter, still smiling.",
          "Rosa [[wound the music box again]]. The plushie [[rose and sang the same line]].",
        ],
        evidence: [
          { label: "A. Verity, plushie tag", kind: "picture", text: "The name VERITY is stitched onto the back of the plushie." },
          {
            label: "B. Rosa's lost-and-found log",
            kind: "table",
            table: {
              head: ["Time", "Music box", "Verity"],
              rows: [
                ["9:06 p.m.", "[[Tune starts.]]", "[[Floats up and sings.]]"],
                ["9:07 p.m.", "[[Tune ends.]]", "[[Goes quiet]] and drops onto the counter."],
                ["9:08 p.m.", "[[Tune starts again.]]", "Floats up and sings the [[same line]]."],
              ],
            },
          },
        ],
        task: { title: "Give the incident a short title.", summary: "In one or two sentences, describe what Verity did and explain what Rosa's second test suggests." },
        rubric: [
          { what: "Gives the incident a short title that captures the main event", field: "title", need: [["float", "sing", "sang", "song", "encore", "levitat", "hover", "fly", "flying"]] },
          { what: "Says Verity floated and sang when the music started", field: "summary", need: [["float", "rose", "fly", "flew", "hover", "lift", "levitat"], ["sing", "sang", "song"]] },
          { what: "Says she went quiet and dropped when it stopped", field: "summary", need: [["quiet", "silent", "stop", "dropped", "fell", "fall", "drop"]] },
          { what: "Mentions that Verity floated and sang again when Rosa restarted the music", field: "summary", need: [["again", "second", "same", "both", "twice", "repeat", "restart", "9:08"]] },
          { what: "Explains that the repeated pattern suggests the music made Verity float and sing", field: "summary", need: [["music", "tune", "song", "melody"], ["make", "made", "cause", "because", "so ", "suggest", "means"]] },
        ],
        sample: {
          title: "Verity's Floating Encore",
          summary: "Verity floated up and sang when the music box played, then went quiet and dropped when it stopped. She did the same thing when Rosa restarted the tune, suggesting the music made her float and sing.",
        },
      },

      hard: {
        report: [
          "Shortly after nine, Rosa was working through the crate of unclaimed items in the hotel's lost-and-found, a job she had been putting off for weeks. Near the bottom she found a yellow smiley-face plushie and a scratched wooden music box. The room was stuffy, so she opened the window, set the plushie on the counter, and wound the music box to see whether it still worked.",
          "The moment the tune began, the plushie lifted off the counter, rose to eye level, turned to face her, and sang, “Hey, it's me, it's Verity! Ask me anything!” It kept smiling as the melody played. When the last note faded, it fell silent and dropped back onto the counter.",
          "Rosa stared at it for a long moment. Then, to be sure, she wound the music box a second time and watched closely.",
        ],
        evidence: [
          { label: "A. Verity, plushie tag", kind: "picture", text: "The name VERITY is stitched onto the back of the plushie." },
          {
            label: "B. Rosa's lost-and-found log",
            kind: "table",
            table: {
              head: ["Time", "Window", "Music box", "Verity"],
              rows: [
                ["9:05 p.m.", "Opened", "—", "On the counter"],
                ["9:06 p.m.", "Open", "Tune starts.", "Floats up and sings."],
                ["9:07 p.m.", "Open", "Tune ends.", "Goes quiet and drops onto the counter."],
                ["9:08 p.m.", "Open", "Tune starts again.", "Floats up and sings the same line."],
              ],
            },
          },
        ],
        task: { title: "Give the incident a short title.", summary: "In one or two sentences, describe what Verity did and explain what Rosa's second test suggests." },
        rubric: [
          { what: "Gives a short title that captures the main event: Verity floating and singing to the music (a title about only the music box or the lost-and-found earns 0)", field: "title", need: [["float", "sing", "sang", "song", "encore", "levitat", "hover", "fly", "flying"]] },
          { what: "Says Verity floated and sang when the music started", field: "summary", need: [["float", "rose", "fly", "flew", "hover", "lift", "levitat"], ["sing", "sang", "song"]] },
          { what: "Says she went quiet and dropped when it stopped", field: "summary", need: [["quiet", "silent", "stop", "dropped", "fell", "fall", "drop"]] },
          { what: "Uses the log to say Verity floated and sang the same line again when the tune restarted at 9:08", field: "summary", need: [["again", "second", "same", "both", "twice", "repeat", "restart", "9:08"]] },
          {
            what: "Explains that the music made Verity float and sing, because the same thing happened in both tests (blaming the open window loses this point)",
            field: "summary",
            need: [["music", "tune", "song", "melody"], ["make", "made", "cause", "because", "so ", "suggest", "means"]],
            blame: ["window", "breeze", "wind"],
          },
        ],
        sample: {
          title: "Verity's Floating Encore",
          summary: "Verity floated up and sang while Rosa's music box played, then fell silent and dropped when the tune ended. The log shows she did it again when the tune restarted at 9:08, and the window stayed open even when she dropped, so the music, not the breeze, seems to make her float and sing.",
        },
        traps: [
          { name: "The title trap", info: "A title about only the music box or the lost-and-found misses the main event: Verity floating and singing.", field: "title", titleMiss: true },
          { name: "The open window", info: "The window was open the whole time, even at 9:07 when Verity dropped, so only the music matches every change.", field: "summary", blame: ["window", "breeze", "wind"] },
        ],
      },
    },
  },
];

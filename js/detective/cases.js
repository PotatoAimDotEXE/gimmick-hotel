/* =========================================================
   DETECTIVE LIE DETECTOR – CASE DATA
   ---------------------------------------------------------
   One case is picked AT RANDOM each day (never the same as
   yesterday's). It changes when the day changes or when a dev
   reset is pressed.

   Each case:
     id            unique string
     title         case name (shown on the folder + case file)
     question      the big question the player answers
     instructions  shown in the answer box
     report        case report paragraphs (left page)
                     {count}  -> "Three" / "Four" / "Five", the number
                                 of people shown on that difficulty
                     **text** -> bold
     evidence      evidence items (right page)
                     label  heading line
                     note   small italic line under it (optional)
                   plus ONE of these for the body:
                     text     a quote
                     lines    [...] a bullet list
                     table    { head: [...], rows: [[...], ...] }
                     form     [["Field", "value"], ...] (two columns)
                     chat     [{ from, time, text }, ...] (phone chat bubbles)
                     receipt  [...] lines, printed like a till receipt
                     notice   text on a pinned sign
                     picture  what the picture shows. A square frame with
                              this inside until image: "path" is added.
                              caption: text under the picture (optional)
     suspects      exactly 5 people of interest
                     q = the detective's question, a = their answer
                     hardExtra = extra sentence only on hard mode
     versions      (optional) a different version per difficulty:
                     versions: { easy: {...}, medium: {...}, hard: {...} }
                   works on a whole case (report, evidence, rubric,
                   sample...) and on a person (q, a, role). Anything
                   not in the version uses the normal field.
     difficulty    who appears on each difficulty (easy 3, medium 4,
                   hard 5). The answer MUST be in all three lists.
     culprit       id of the right answer
     rubric        the 6 reasoning points the AI grades (the 4 points
                   for choosing the right person are automatic)
     sample        a full-marks answer, as a reference for the AI
   ========================================================= */

const CASES = [
  /* ---------------------------------------------------------
     CASE 1 – The Missing Mallet        answer: Tung Tung Tung Sahur
     --------------------------------------------------------- */
  {
    id: "missing-mallet",
    title: "The Missing Mallet",
    question: "Who lied?",
    instructions:
      "Name the liar, quote the claim you're challenging, and use two pieces of evidence to explain why it's false.",
    report: [
      "At 6:42 p.m., five knocks played over the hotel speakers. That was the signal for guests to head to the ballroom for the gala. The Golden Mallet, the evening's top prize, was on display in a small room beside the ballroom.",
      "A hotel attendant checked the display at 6:40. When he returned at 6:43, the glass case was open and the mallet was gone.",
      "{count} people gave statements. One of them lied. Read the interview logs and use the evidence to decide whose story falls apart.",
    ],
    evidence: [
      {
        label: "A. Gala check-in log, lobby desk",
        table: {
          head: ["Time", "Name", "Given out"],
          rows: [
            ["6:31 p.m.", "Dana Whitlow", "Guest wristband"],
            ["6:36 p.m.", "Mr. and Mrs. Okafor", "2 guest wristbands"],
            ["6:42 p.m.", "Tung Tung Tung Sahur", "Volunteer badge"],
            ["6:48 p.m.", "Priya Nand", "Guest wristband"],
          ],
        },
        note: "Kept by the front desk clerk, who checked each name in person and handed over the badge or wristband.",
      },
      {
        label: "B. Hotel floor plan, ground floor",
        picture: "Floor plan of the ground floor",
        image: "../assets/detective/evidence/missing-mallet-floor-plan.png",
        caption: "The pool terrace is at the back of the hotel, opposite the lobby. The display room's only door opens onto the ballroom hallway. A solid wall blocks the view of that door from the pool terrace.",
      },
      {
        label: "C. Hotel guest group chat, 6:46 p.m.",
        chat: [{ from: "Room 214", time: "6:46 p.m.", text: "Pretty sure Tralalero took it. My cousin said one of the guests saw blue shoes near the ballroom." }],
      },
    ],
    suspects: [
      {
        id: "tralalero",
        name: "Tralalero Tralala",
        role: "Hotel guest",
        q: "Why were you near the display room?",
        a: "I wanted a photo with the mallet. The attendant told me to come back after the gala opened, so I went to the hotel café. And yes, I wear blue shoes. So does half my dance team.",
      },
      {
        id: "tung",
        name: "Tung Tung Tung Sahur",
        role: "Gala volunteer",
        q: "Where were you when the five knocks played?",
        a: "On the pool terrace. I was there the whole time, from 6:40 to 6:45. Right after the knocks, I saw Tralalero run out of the display room with the mallet. I watched him from the terrace.",
      },
      {
        id: "jane",
        name: "Jane Maid",
        role: "Hotel café attendant",
        q: "Did you see Tralalero at the café?",
        a: "He bought a lime soda around the time the gala opened. I remember because he asked for three straws for one drink. I didn't check the clock.",
      },
      {
        id: "john",
        name: "Atten Dan",
        role: "Hotel attendant",
        q: "What did you see when you checked the display room?",
        a: "The mallet was in the case at 6:40. When I came back at 6:43, the case was open. I heard someone running, but by the time I looked into the hallway, it was empty.",
      },
      {
        id: "bea",
        name: "Bea",
        role: "Hotel guest",
        q: "Did you see anyone near the ballroom when the five knocks played?",
        a: "I was waiting by the elevators. Someone in a black jacket hurried past me toward the lobby. I only saw them from behind, so I couldn't tell who it was.",
      },
    ],
    difficulty: {
      easy: ["tralalero", "tung", "jane"],
      medium: ["tralalero", "tung", "jane", "john"],
      hard: ["tralalero", "tung", "jane", "john", "bea"],
    },
    culprit: "tung",
    rubric: [
      { points: 2, criterion: "Quotes a specific claim from Tung's statement." },
      {
        points: 2,
        criterion:
          "Uses the check-in log (or the floor plan) to explain where Tung was during the five knocks / why he couldn't have seen the display room door.",
      },
      { points: 2, criterion: "Explains why the clerk's firsthand account is stronger than the group-chat rumor." },
    ],
    sample:
      "Tung Tung Tung Sahur lied when he said, “I was there the whole time, from 6:40 to 6:45.” The hotel's check-in log says the clerk handed him his volunteer badge at the lobby desk at 6:42, while the five knocks were playing. That puts him in the lobby during the time he claimed to be on the pool terrace. The clerk saw Tung in person. The group-chat post passes along a rumor about blue shoes, and several people on Tralalero's dance team wear them.",
  },

  /* ---------------------------------------------------------
     CASE 2 – The False Alarm           answer: Jack O'Lantern
     Each difficulty has its own version of the case (versions),
     and each person has their own answer per difficulty.
     --------------------------------------------------------- */
  {
    id: "false-alarm",
    title: "The False Alarm",
    question: "Who lied about where they were?",
    instructions: "Name the liar, quote the claim you're challenging, and explain which source gives you the strongest evidence.",
    versions: {
      easy: {
        report: [
          "At 8:15 p.m., Jane Maid, a housekeeper, brought a blanket to Milo, a guest reading on the second floor. Jane left her cleaning cart in the hallway.",
          "At 8:21 p.m., someone pulled the fire alarm on the second floor. Everyone had to leave the hotel. There was no fire.",
          "Some guests say Jane did it.",
          "{count} people gave statements. One of them lied about where they were. Find the lie and explain which evidence exposes it.",
        ],
        evidence: [
          {
            label: "A. Security footage, 8:20 p.m.",
            picture: "Second-floor camera still, 20:20",
            image: "../assets/detective/evidence/false-alarm-cam.png",
            caption: "The second-floor camera shows Jack O'Lantern walking down the hall at 8:20 p.m. You can see his face.",
            note: "Recorded by Sue Pervisor, the night supervisor.",
          },
          {
            label: "B. Guest group chat, 8:35 p.m.",
            chat: [{ from: "Room 118", time: "8:35 p.m.", text: "Jane's cart was right next to the fire alarm. It must be her!" }],
          },
        ],
        rubric: [
          { points: 2, criterion: "Quotes Jack's claim that he stayed in the lobby the whole time." },
          { points: 2, criterion: "Uses Evidence A to show Jack was on the second floor at 8:20, without saying the camera shows him pulling the alarm." },
          { points: 2, criterion: "Explains that the group chat only says where the cart was, not who pulled the alarm." },
        ],
        sample:
          "Jack O'Lantern lied when he said, “I was in the lobby the whole time.” The security footage shows him on the second floor at 8:20. The group chat is weaker because it only says where Jane's cart was. It doesn't show who pulled the alarm.",
      },
      medium: {
        report: [
          "At 8:15 p.m., Jane Maid dropped off a blanket for Milo, a young hotel guest reading in the second-floor reading room. He asked her to leave the lamp on so he could finish his chapter. Jane left her cart in the hallway outside the room.",
          "At 8:21 p.m., the fire alarm went off. Everyone left the building and waited in the car park while firefighters searched the hotel. There was no fire. Someone had pulled the alarm at the stairwell end of the second-floor hallway, and the hotel now has to pay for the false alarm.",
          "By the time guests were allowed back inside, people in the car park were already blaming Jane.",
          "{count} people gave statements. One of them lied about where they were. Find the lie and explain which evidence exposes it.",
        ],
        evidence: [
          {
            label: "A. Security footage review, 8:20 p.m.",
            picture: "Second-floor hallway camera still, 20:20",
            image: "../assets/detective/evidence/false-alarm-cam.png",
            caption: "The second-floor hallway camera shows Jack O'Lantern walking past the reading room toward the stairwell at 8:20 p.m. His face is clearly visible when he looks behind him.",
            note: "Recorded by Sue Pervisor, the night supervisor.",
          },
          {
            label: "B. Hotel guest directory",
            notice: "The second floor, including the reading room, is open to all hotel guests until 10 p.m.",
          },
          {
            label: "C. Hotel guest group chat, 8:40 p.m.",
            chat: [{ from: "Room 118", time: "8:40 p.m.", text: "My friend says Jane's cart was right next to the fire alarm. Only staff are allowed on the second floor at night, so it had to be her." }],
          },
        ],
        rubric: [
          { points: 2, criterion: "Quotes Jack's claim that he stayed in the lobby the whole time." },
          { points: 2, criterion: "Uses Evidence A to show Jack was on the second floor at 8:20, without saying the camera shows him pulling the alarm." },
          { points: 2, criterion: "Explains that the group chat only says where the cart was, not who pulled the alarm." },
        ],
        sample:
          "Jack O'Lantern lied when he said, “I stayed in the lobby from 8:15 until the alarm went off.” The hallway camera shows him on the second floor at 8:20, walking toward the stairwell one minute before the alarm. Bea only saw him in the car park at 8:26, after everyone had left the building. The footage records Jack directly, while the group chat repeats what a friend said and claims only staff can go upstairs at night. The guest directory says the second floor is open to all guests until 10 p.m. The footage proves Jack lied about where he was. It doesn't show who pulled the alarm, because the stairwell corner is out of view.",
      },
      hard: {
        report: [
          "At 8:15 p.m., housekeeper Jane Maid delivered a blanket to Milo, a young guest reading in the second-floor reading room. He asked her to leave the lamp on so that he could finish his chapter. Jane parked her cleaning cart in the corridor outside the room and went back downstairs.",
          "Shortly afterwards, the fire alarm sounded throughout the building. Guests and staff evacuated to the car park while firefighters searched every floor. They found no fire. The alarm had been triggered by hand at a pull station at the stairwell end of the second-floor corridor, and the hotel now faces a fine for the false alarm.",
          "Before guests were even allowed back inside, rumors were spreading that Jane was responsible.",
          "{count} people gave statements. One of them lied about where they were. Identify the lie, explain which evidence exposes it, and be careful not to claim more than the evidence shows.",
        ],
        evidence: [
          {
            label: "A. Security footage log, second-floor corridor",
            table: {
              head: ["Time", "Person", "What the camera shows"],
              rows: [
                ["20:13:40", "Atten Dan", "Enters the reading room carrying a tea tray."],
                ["20:14:55", "Atten Dan", "Leaves the reading room."],
                ["20:15:10", "Jane Maid", "Enters the reading room with a blanket."],
                ["20:16:02", "Jane Maid", "Leaves toward the staff lift. Her cart stays in the corridor."],
                ["20:20:14", "Jack O'Lantern", "Walks past the reading room toward the stairwell. His face is visible when he glances back."],
              ],
            },
            note: "Note: Pull station 2B, at the stairwell corner, is outside the camera's field of view. Logged by Sue Pervisor, night supervisor.",
          },
          {
            label: "B. Fire department incident note",
            form: [
              ["Alarm activated", "20:21"],
              ["Location", "Manual pull station 2B, second floor, stairwell end"],
              ["Finding", "No fire, smoke or heat source found"],
              ["Cause", "Deliberate false activation"],
            ],
          },
          {
            label: "C. Hotel guest directory",
            notice: "The second-floor reading room is open to all hotel guests from 7 a.m. until 10 p.m. The door stays unlocked during opening hours.",
          },
          {
            label: "D. Staff notice board, second floor",
            notice: "From 10 p.m., when the reading room closes, the second-floor corridor is restricted to staff and guests staying on that floor. Keycard required at the stairwell door.",
          },
          {
            label: "E. Hotel guest group chat, 20:38",
            chat: [{ from: "Room 118", time: "20:38", text: "My friend says Jane's cart was right next to the fire alarm. There's literally a sign saying only staff can go up there at night, so it had to be her." }],
          },
          {
            label: "F. Restaurant receipt",
            receipt: ["HOTEL RESTAURANT", "Table 4 · Guest: Bea", "1 x set dinner", "1 x jasmine tea", "PAID 20:12"],
          },
        ],
        rubric: [
          { points: 2, criterion: "Quotes Jack's claim, for example “I didn't move from the sofa the entire time.”" },
          {
            points: 2,
            criterion:
              "Converts 20:20 to 8:20 p.m. and uses it to show Jack was on the second floor one minute before the 20:21 alarm, without claiming he pulled it. Skipping the conversion or overclaiming loses these points.",
          },
          { points: 2, criterion: "Explains that the group chat only says where the cart was, not who pulled the alarm." },
        ],
        // note from the team: accusing Bea scores 0 for the person, because her receipt only
        // shows when she paid, not when she left.
        sample:
          "Jack O'Lantern lied when he said he “didn't move from the sofa the entire time.” The camera log shows him in the second-floor corridor at 20:20, which is 8:20 p.m., and the fire department recorded the alarm at 20:21. So he was upstairs one minute before the alarm, not in the lobby. Bea's receipt might look like a contradiction, but it only shows she paid at 8:12, not that she left the restaurant. The group chat is the weakest source. It repeats what a friend said, and the sign it mentions only applies from 10 p.m. The guest directory says any guest could use the second floor until then. The evidence proves Jack lied about where he was, but not that he pulled the alarm, because pull station 2B is outside the camera's view.",
      },
    },
    suspects: [
      {
        id: "jane",
        name: "Jane Maid",
        role: "Housekeeper",
        versions: {
          easy: {
            q: "Where were you when the alarm went off?",
            a: "I was downstairs in the laundry room. I left my cart upstairs after I gave Milo his blanket.",
          },
          medium: {
            q: "Where were you when the alarm went off?",
            a: "Downstairs in the laundry room, folding towels. I'd left my cart outside the reading room when I brought Milo the blanket. I was going to collect his tea tray afterwards.",
          },
          hard: {
            q: "Where were you when the alarm sounded?",
            a: "I was in the basement laundry, folding towels. I'd left my cart upstairs in the corridor outside the reading room, because I meant to go back for Milo's tea tray once he'd finished.",
          },
        },
      },
      {
        id: "jack",
        name: "Jack O'Lantern",
        role: "Hotel guest",
        versions: {
          easy: {
            q: "Where were you between 8:15 and 8:21?",
            a: "I was in the lobby the whole time. I was trying to fix my Wi-Fi.",
          },
          medium: {
            q: "Where were you between 8:15 and 8:21?",
            a: "I stayed in the lobby from 8:15 until the alarm went off. Ask anyone. I spent the whole time trying to get the hotel Wi-Fi to work.",
          },
          hard: {
            q: "Tell me where you were between 8:15 and the alarm.",
            a: "I was in the lobby from about quarter past eight right up until the alarm went off. Ask anyone. The Wi-Fi kept dropping, so I didn't move from the sofa the entire time.",
          },
        },
      },
      {
        id: "sue",
        name: "Sue Pervisor",
        role: "Night supervisor",
        versions: {
          easy: {
            q: "What does the camera cover?",
            a: "It shows the second-floor hallway. I checked the footage after the alarm.",
          },
          medium: {
            q: "What does the camera cover?",
            a: "The second-floor hallway and the reading room door. I checked the footage after the firefighters left. The stairwell corner where the alarm is sits just out of view.",
          },
          hard: {
            q: "What does the camera cover?",
            a: "The second-floor corridor and the reading room door. I reviewed the footage once the firefighters had cleared the building. The pull station is round the corner by the stairwell, so it's just out of shot.",
          },
        },
      },
      {
        // Hard only (with the biscuit red herring)
        id: "john",
        name: "Atten Dan",
        role: "Kitchen staff",
        q: "When did you last see Milo?",
        a: "I took Milo his tea a little before quarter past eight. He wanted another biscuit, even though there were already two on the tray, so I headed back to the kitchen. I was still there, plating the biscuit, when the alarm went off.",
      },
      {
        // Medium + hard
        id: "bea",
        name: "Bea",
        role: "Hotel guest",
        q: "Did you see Jack that evening?",
        versions: {
          medium: {
            a: "Yes, in the car park at about 8:26, after everyone had left the building. He was asking someone for the Wi-Fi password. That was the first time I saw him that evening.",
          },
          hard: {
            a: "I was still sitting in the restaurant, finishing my tea, when the alarm went off. Outside in the car park, at around 8:26, I saw Jack asking someone for the Wi-Fi password. That was the first time I'd seen him all evening.",
          },
        },
      },
    ],
    difficulty: {
      easy: ["jane", "jack", "sue"],
      medium: ["jane", "jack", "sue", "bea"],
      hard: ["jane", "jack", "sue", "john", "bea"],
    },
    culprit: "jack",
  },

  /* ---------------------------------------------------------
     CASE 3 – The Shattered Vase        answer: Atten Dan
     --------------------------------------------------------- */
  {
    id: "shattered-vase",
    title: "The Shattered Vase",
    question: "Who was primarily at fault for breaking the vase?",
    instructions: "Name who was primarily at fault, explain how each person contributed, and say whose actions mattered most. Use the evidence.",
    report: [
      "At 7:14 p.m., Jane Maid and Atten Dan got into a fight in the hotel lobby. Atten wanted to move a linen cart so he could open the ballroom doors for an event. Jane told him to wait until the guests had cleared the hallway.",
      "The argument grew louder. Both staff members grabbed the cart, and it hit a table. The hotel's blue ceramic vase fell and shattered. Jane and Atten each say the other person moved the cart.",
      "**Decide who was primarily at fault for breaking the vase.** Explain how each person contributed and whose actions mattered most.",
    ],
    evidence: [
      {
        label: "A. Lobby security footage review, 7:14 p.m.",
        table: {
          head: ["Time", "What the camera shows"],
          rows: [
            ["7:14:11", "Atten takes hold of the cart and pulls it away from the wall. Jane's hands are at her sides."],
            ["7:14:12", "Jane grabs the far handle. Atten takes another step backward, pulling the cart toward the display table."],
            ["7:14:13", "The cart hits the table. The vase falls."],
          ],
        },
        note: "The camera shows the lobby clearly and records no sound.",
      },
      {
        label: "B. Staff notice at the ballroom doors",
        notice: "If a cart needs to be moved while guests are in the hallway, call the front desk. Wait for someone to clear the area before moving it.",
      },
      {
        label: "C. Photo attached to a guest complaint, 7:15 p.m.",
        picture: "Guest's photo: Jane holding the cart handle, pieces of the vase on the floor",
        image: "../assets/detective/evidence/shattered-vase-photo.png",
        caption: "Guest's caption: “The maid broke the vase. She was still holding the cart when I took this.”",
      },
    ],
    suspects: [
      {
        id: "jane",
        name: "Jane Maid",
        role: "Housekeeper",
        q: "Why did you grab the cart?",
        a: "Atten had already pulled it away from the wall. I grabbed the other handle to stop him. I was angry, and I shouted at him. Then the cart hit the table.",
      },
      {
        id: "john",
        name: "Atten Dan",
        role: "Banquet attendant",
        q: "Who moved the cart?",
        a: "I put my hands on it because I needed the ballroom doors clear. Jane grabbed the other end and yanked it. That's when it started moving.",
      },
      {
        id: "rosa",
        name: "Sue Pervisor",
        role: "Night supervisor",
        q: "Did either of them call the front desk?",
        a: "I was at the desk the whole time. The first call I got was from Kit, after the vase had already broken.",
      },
      {
        id: "kit",
        name: "Kit",
        role: "Room service attendant",
        q: "What did you see before the crash?",
        a: "I was carrying a tray through the lobby. I heard Jane say, “Wait until the hallway's clear.” A group of guests walked between me and the cart. By the time I could see the table again, the vase was on the floor.",
      },
      {
        id: "jack",
        name: "Jack O'Lantern",
        role: "Hotel guest",
        q: "What made you blame Jane in your complaint?",
        a: "I heard the crash and looked up. Jane was holding the cart, so I figured she'd pushed it. That's when I took the photo.",
      },
    ],
    difficulty: {
      easy: ["jane", "john", "jack"],
      medium: ["jane", "john", "rosa", "jack"],
      hard: ["jane", "john", "rosa", "kit", "jack"],
    },
    culprit: "john",
    rubric: [
      { points: 2, criterion: "Uses the footage to explain who moved the cart first and what happened after Jane grabbed it." },
      { points: 2, criterion: "Uses the staff notice or a witness statement to explain how the damage could have been avoided." },
      { points: 2, criterion: "Explains why the footage is stronger evidence than Jack's photo." },
    ],
    // note: the original 4-point row also asks the player to "explain how Jane also contributed".
    // Choosing Atten is checked automatically; the AI can look for the Jane part using the sample answer.
    sample:
      "Atten Dan was primarily at fault. At 7:14:11, he pulled the cart while Jane's hands were still at her sides. After she grabbed the other handle, he kept pulling, and the cart hit the table. Jane contributed by shouting and grabbing the cart, but Atten started the movement and continued it just before the crash. The staff notice gave them a way to avoid the damage. They could have called the front desk and waited for the hallway to clear. Jack's photo shows Jane holding the cart after the vase broke. The footage shows how it broke.",
  },
];

/* Fun facts shown on the game menu (placeholder). */
const FUN_FACTS = [
  "A good detective checks HOW a source knows something, not just WHAT it says.",
  "Firsthand evidence (someone who saw it) beats a rumor passed along in a group chat.",
  "Times and places are a liar's worst enemy: two sources can't put one person in two places.",
];

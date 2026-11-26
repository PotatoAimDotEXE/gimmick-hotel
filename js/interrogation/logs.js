/* =========================================================
   INTERROGATION ROOM – CASE DATA
   ---------------------------------------------------------
   One case is picked AT RANDOM each day (never the same as
   last time). It changes when the day changes or on a dev reset.

   Each case:
     id, title
     suspect      the person being interrogated
     image        portrait (empty = placeholder figure)
     versions     one full version per difficulty: easy / medium / hard
       brief      paragraphs of the case brief
                    **text** -> bold (used on easy for key words)
                  Players tap a CLAUSE of the brief as proof. Clauses are
                  split automatically at commas and full stops.
       assets     pictures shown with the brief. Every picture can be
                  tapped as proof.
                    id     short name, used in proof as "img:<id>"
                    desc   what the picture shows (placeholder text)
                    lines  text written inside the picture (optional)
                    file   path to the real image when it's drawn ("" = placeholder)
       dialogue   in order. Two kinds of line:
                    { detective: "..." }   the player's question (can't be flagged)
                    { say: "...", ... }    the suspect's statement
                       lie: true           this statement is false
                       proof: [...]        phrases from the brief that prove it,
                                           and/or "img:<id>". For a lie, tapping a
                                           clause that contains one of these phrases
                                           (or that picture) earns the proof point.
                                           For true lines they're only shown on the
                                           results screen.
                       uncheckable: true   nothing proves it either way
   Scoring: 1 point for flagging a lie + 1 point for the right proof.
   The number of flags = the number of lies.
   ========================================================= */

const LOGS = [
  /* ---------------------------------------------------------
     CASE 1 – The Missing Crown       suspect: Tung Tung Tung Sahur
     --------------------------------------------------------- */
  {
    id: "missing-crown",
    title: "The Missing Crown",
    suspect: "Tung Tung Tung Sahur",
    image: "",
    versions: {
      easy: {
        brief: [
          "At **7:30 p.m.**, the hotel pastry chef asked Tung Tung Tung Sahur to take a mango cake to the **ballroom**. The cake had a chocolate crown on top and a clear cover.",
          "On the way, Jane Maid saw Tung stop the cart outside **Room 206** and lift the cover. At **7:40**, Tung handed the cart to the ballroom staff. When they lifted the cover, the crown was gone.",
        ],
        assets: [
          { id: "scene", desc: "The ballroom staff lifting the clear cover, with an empty spot on top of the cake where the crown was.", file: "" },
        ],
        dialogue: [
          { detective: "Walk me through the delivery." },
          { say: "The chef gave me a mango cake with a chocolate crown on top.", proof: ["a mango cake", "a chocolate crown on top"] },
          { say: "I went straight to the ballroom. I didn't stop, and I kept the cover on the whole time.", lie: true, proof: ["stop the cart outside Room 206 and lift the cover"] },
          { say: "I handed the cart over at 7:40.", proof: ["At 7:40, Tung handed the cart to the ballroom staff"] },
        ],
      },

      medium: {
        brief: [
          "At 7:30 p.m., the hotel pastry chef finished a mango cake for the evening's anniversary party and asked Tung Tung Tung Sahur to wheel it up to the ballroom. The cake was topped with a chocolate crown and protected by a clear dome.",
          "The service lift was busy, so Tung took the long way along the second-floor corridor. Jane Maid was restocking towels outside Room 208 when the cart went past. She noticed it pause by the door of Room 206, and she watched Tung raise the dome for a moment before rolling on.",
          "At 7:40, Tung passed the cart to the ballroom staff. When they took off the dome, the crown had disappeared.",
        ],
        assets: [
          { id: "scene", desc: "The ballroom staff lifting the dome, with an empty spot on top of the cake.", file: "" },
        ],
        dialogue: [
          { detective: "Walk me through the delivery." },
          { say: "The chef gave me a mango cake with a chocolate crown on top.", proof: ["topped with a chocolate crown"] },
          // "before rolling on" also proves it: the cart had to be stopped to roll on again
          { say: "I went straight to the ballroom. I didn't stop anywhere.", lie: true, proof: ["pause by the door of Room 206", "before rolling on"] },
          { say: "I handed the cart over at 7:40.", proof: ["At 7:40, Tung passed the cart"] },
          { detective: "Did you lift the cover on the way?" },
          { say: "I kept it on the whole time.", lie: true, proof: ["raise the dome for a moment"] },
          { detective: "Did you see anyone on the way?" },
          { say: "Just a housekeeper near Room 208.", proof: ["Jane Maid was restocking towels outside Room 208"] },
          { say: "The cake was for the party in the ballroom.", proof: ["a mango cake for the evening's anniversary party"] },
        ],
      },

      hard: {
        brief: [
          "The anniversary party in the ballroom was due to start at 7:45 p.m. At 7:30, the pastry chef handed Tung Tung Tung Sahur a mango cake topped with a chocolate crown, sealed under a clear dome, and asked him to take it upstairs without delay.",
          "With the service lift out of order, Tung pushed the cart along the second-floor corridor, past the linen cupboard and Rooms 204 to 210. Housekeeper Jane Maid, who was restocking towels outside Room 208, later told the front desk that the cart had paused by the door of Room 206, that Tung had raised the dome briefly, and that he had glanced over his shoulder before moving on. A guest in Room 210 reported hearing a cart rattle past at around 7:35, but saw nothing.",
          "At 7:40, the ballroom staff signed for the cart. When they removed the dome, the crown was missing.",
        ],
        assets: [
          { id: "scene", desc: "The ballroom staff lifting the dome, with an empty spot on top of the cake.", file: "" },
          {
            id: "cam",
            desc: "Corridor camera still: the cart standing still beside a door, with Tung's back to the camera.",
            lines: ["Door: 206", "2F CORRIDOR · CAM 3 · 7:34 PM"],
            file: "",
          },
        ],
        dialogue: [
          { detective: "Walk me through the delivery." },
          { say: "The chef gave me a mango cake with a chocolate crown on top.", proof: ["a mango cake topped with a chocolate crown"] },
          // "before moving on" also proves it: he had to be stopped to move on again
          { say: "I went straight to the ballroom. I didn't stop anywhere.", lie: true, proof: ["paused by the door of Room 206", "before moving on", "img:cam"] },
          { say: "The service lift wasn't working, so I took the second-floor corridor.", proof: ["With the service lift out of order"] },
          { say: "I handed the cart over at 7:40.", proof: ["At 7:40, the ballroom staff signed for the cart"] },
          { detective: "Did you lift the cover on the way?" },
          { say: "I kept it on the whole time.", lie: true, proof: ["Tung had raised the dome briefly"] },
          { detective: "Did you see anyone on the way?" },
          { say: "Just a housekeeper near Room 208.", proof: ["Jane Maid, who was restocking towels outside Room 208"] },
          // changed from "...but I didn't look", which the brief ("glanced over his shoulder") could contradict
          { say: "I heard a phone ringing in one of the rooms.", uncheckable: true },
          { say: "The party was starting at 7:45, so I was in a hurry.", proof: ["due to start at 7:45 p.m."] },
        ],
      },
    },
  },

  /* ---------------------------------------------------------
     CASE 2 – The Broken Bottle       suspect: Jane Maid
     --------------------------------------------------------- */
  {
    id: "broken-bottle",
    title: "The Broken Bottle",
    suspect: "Jane Maid",
    image: "",
    versions: {
      easy: {
        brief: [
          // "the cart jerked" added so Jane's line 3 can be checked
          "At **6:20 p.m.**, Jane Maid was taking a $2,400 bottle of wine to the hotel's **private dining room**. John Attenz saw her set the bottle on the **top shelf** of her cart. One of the wheels caught on the edge of a **rug**, the cart jerked, and the bottle slid off and shattered.",
          "John called the **front desk** while Jane stayed by the cart to warn guests about the broken glass.",
        ],
        assets: [
          { id: "scene", desc: "Broken glass and spilled wine on the lobby floor beside the cart, with Jane holding her hands out to keep guests back.", file: "" },
        ],
        dialogue: [
          { detective: "Walk me through what happened." },
          { say: "I was taking the wine to the private dining room.", proof: ["taking a $2,400 bottle of wine to the hotel's private dining room"] },
          { say: "I put the bottle on the bottom shelf so it wouldn't fall far.", lie: true, proof: ["set the bottle on the top shelf of her cart"] },
          { say: "Then a wheel caught on the rug and the whole cart jerked.", proof: ["One of the wheels caught on the edge of a rug", "the cart jerked"] },
        ],
      },

      medium: {
        brief: [
          "At 6:20 p.m., Jane Maid was wheeling a $2,400 bottle of wine to the hotel's private dining room, where a guest was celebrating a birthday. The cart had two shelves, and the lower one held clean napkins and glasses. John Attenz, who was folding tablecloths near the lobby, watched Jane place the bottle up high, on the cart's upper shelf.",
          // "The cart jerked" added so Jane's line 3 can be checked
          "Halfway across the lobby, one of the cart's wheels snagged on the edge of a rug. The cart jerked, and the bottle slipped off and smashed on the floor.",
          "John picked up the lobby phone and rang the front desk, while Jane stayed beside the cart, warning guests to keep away from the broken glass.",
        ],
        assets: [
          { id: "scene", desc: "Broken glass and spilled wine on the lobby floor beside the cart, with Jane holding her hands out to keep guests back.", file: "" },
        ],
        dialogue: [
          { detective: "Walk me through what happened." },
          { say: "I was taking the wine to the private dining room.", proof: ["wheeling a $2,400 bottle of wine to the hotel's private dining room"] },
          { say: "I put the bottle on the bottom shelf so it wouldn't fall far.", lie: true, proof: ["place the bottle up high", "on the cart's upper shelf"] },
          { say: "Then a wheel caught on the rug and the whole cart jerked.", proof: ["one of the cart's wheels snagged on the edge of a rug", "The cart jerked"] },
          { detective: "What did you do after the bottle broke?" },
          { say: "I called the front desk myself.", lie: true, proof: ["John picked up the lobby phone and rang the front desk"] },
          { say: "I stayed by the cart to keep guests away from the glass.", proof: ["Jane stayed beside the cart, warning guests"] },
          { detective: "What else was on the cart?" },
          { say: "Napkins and glasses, on the lower shelf.", proof: ["the lower one held clean napkins and glasses"] },
        ],
      },

      hard: {
        brief: [
          "The private dining room had been booked for a birthday dinner at 6:30 p.m., and the guest had ordered a rare $2,400 bottle of wine to open at the table. At 6:20, housekeeper Jane Maid collected the bottle from the cellar and set off across the lobby with a two-shelf cart, its lower shelf already stacked with napkins, glasses and a spare tablecloth.",
          "John Attenz, who was folding tablecloths by the reception sofas, said later that he had noticed Jane lift the bottle onto the cart's upper shelf instead of tucking it in beside the glasses, and that the cart was moving quickly. Halfway across the lobby, one wheel snagged on the edge of a rug, the cart lurched, and the bottle slid off and burst on the marble floor.",
          "Within a minute, John had dialled the front desk from the lobby phone. Jane, meanwhile, stood guard beside the cart and waved guests away from the broken glass until a cleaner arrived at 6:28.",
        ],
        assets: [
          { id: "scene", desc: "Broken glass and spilled wine on the lobby floor beside the cart, with Jane holding her hands out to keep guests back.", file: "" },
          {
            id: "calllog",
            desc: "Front desk call log on a clipboard.",
            lines: [
              "FRONT DESK · INCOMING CALLS",
              "6:21 PM · Lobby phone (Ext. 101) · Caller: J. Attenz · Broken bottle, lobby",
              "6:24 PM · Room 312 · Caller: Guest · Extra towels",
            ],
            file: "",
          },
        ],
        dialogue: [
          { detective: "Walk me through what happened." },
          { say: "I was taking the wine to the private dining room.", proof: ["The private dining room had been booked", "Jane Maid collected the bottle"] },
          { say: "The dinner was booked for 6:30.", proof: ["booked for a birthday dinner at 6:30 p.m."] },
          { say: "I put the bottle on the bottom shelf so it wouldn't fall far.", lie: true, proof: ["lift the bottle onto the cart's upper shelf"] },
          { say: "Then a wheel caught on the rug and the whole cart jerked.", proof: ["one wheel snagged on the edge of a rug", "the cart lurched"] },
          { detective: "What did you do after the bottle broke?" },
          { say: "I called the front desk myself.", lie: true, proof: ["John had dialled the front desk from the lobby phone", "img:calllog"] },
          { say: "I stayed by the cart to keep guests away from the glass.", proof: ["stood guard beside the cart and waved guests away"] },
          { say: "A cleaner came a few minutes later.", proof: ["until a cleaner arrived at 6:28"] },
          { say: "I think someone had kicked the rug out of place earlier.", uncheckable: true },
        ],
      },
    },
  },

  /* ---------------------------------------------------------
     CASE 3 – The Staring Capybara (placeholder title)   suspect: Capybara PNG
     --------------------------------------------------------- */
  {
    id: "staring-capybara",
    title: "The Staring Capybara",
    suspect: "Capybara PNG",
    image: "",
    versions: {
      easy: {
        brief: [
          "A group of children were waiting in the **hotel lobby** when Capybara PNG appeared **beside the front desk**. It stared at them with a stiff little smile. When the children moved **behind a sofa**, Capybara PNG slid sideways into view without moving its legs. The children got scared and ran to their parents.",
          "Jane Maid saw the whole thing from the **front desk**. She said Capybara PNG kept smiling and never made a sound.",
        ],
        assets: [
          { id: "scene", desc: "The children running across the lobby to their parents, looking scared.", file: "" },
        ],
        dialogue: [
          { detective: "Where were you when the children saw you?" },
          { say: "Over by the front doors. I never went near the desk.", lie: true, proof: ["Capybara PNG appeared beside the front desk"] },
          { say: "I smiled. I thought that would help.", proof: ["It stared at them with a stiff little smile"] },
          { say: "I didn't make a sound.", proof: ["never made a sound"] },
        ],
      },

      medium: {
        brief: [
          "Just after the evening check-in rush, a group of children came in through the hotel's front doors with their parents and sat down to wait in the lobby. Moments later, Capybara PNG popped up right next to the reception counter. It gazed at the children with a fixed, stiff little smile.",
          "When the children crept behind a sofa to hide, Capybara PNG glided sideways until it could see them again, its legs perfectly still the whole time. The children shrieked and ran back to their parents.",
          "Jane Maid had been standing behind the reception counter throughout. She said Capybara PNG never stopped smiling and never made a single sound.",
        ],
        assets: [
          { id: "scene", desc: "The children running across the lobby to their parents, looking scared.", file: "" },
        ],
        dialogue: [
          { detective: "Where were you when the children saw you?" },
          { say: "Over by the front doors. I never went near the desk.", lie: true, proof: ["Capybara PNG popped up right next to the reception counter"] },
          { say: "I smiled. I thought that would help.", proof: ["gazed at the children with a fixed, stiff little smile"] },
          { detective: "What did you do when they moved behind the sofa?" },
          { say: "I stayed exactly where I was.", lie: true, proof: ["glided sideways until it could see them again"] },
          { say: "I didn't make a sound.", proof: ["never made a single sound"] },
          { detective: "Anything else?" },
          { say: "The children had only just come in through the front doors.", proof: ["came in through the hotel's front doors"] },
          { say: "I think I'm just bad at smiling.", uncheckable: true },
        ],
      },

      hard: {
        brief: [
          "The lobby was busy that evening. A coach of guests had just arrived, luggage trolleys were lined up by the front doors, and a group of children was waiting on the long sofa while their parents queued to check in. Jane Maid was covering the reception counter, because the usual receptionist was on a break.",
          "According to Jane, Capybara PNG appeared without warning at the end of the reception counter, barely an arm's length from her, and fixed the children with a stiff little smile. When the children ducked behind the sofa, it drifted sideways across the tiles, its legs not moving at all, until it had them in view again. One parent later said she had heard a strange squeak near the luggage trolleys, but Jane insisted that Capybara PNG itself never made a sound.",
          "The children screamed and ran to their parents.",
        ],
        assets: [
          { id: "scene", desc: "The children running across the lobby to their parents, looking scared.", file: "" },
          {
            id: "cam",
            desc: "Lobby camera still: Capybara PNG standing at the end of a counter, smiling.",
            lines: ["Sign on the counter: RECEPTION", "LOBBY CAM 2 · 6:05 PM"],
            file: "",
          },
        ],
        dialogue: [
          { detective: "Where were you when the children saw you?" },
          { say: "Over by the front doors. I never went near the desk.", lie: true, proof: ["appeared without warning at the end of the reception counter", "img:cam"] },
          { say: "I smiled. I thought that would help.", proof: ["fixed the children with a stiff little smile"] },
          { detective: "What did you do when they moved behind the sofa?" },
          // the key's proof spans two clauses; either part that shows it MOVED counts
          { say: "I stayed exactly where I was.", lie: true, proof: ["it drifted sideways across the tiles", "until it had them in view again"] },
          { say: "I didn't make a sound.", proof: ["Jane insisted that Capybara PNG itself never made a sound"] },
          { detective: "What else do you remember?" },
          { say: "The children were sitting on the long sofa.", proof: ["a group of children was waiting on the long sofa"] },
          { say: "There were suitcases everywhere by the doors.", proof: ["luggage trolleys were lined up by the front doors"] },
          { say: "The usual receptionist wasn't there.", proof: ["the usual receptionist was on a break"] },
          { say: "I think I'm just bad at smiling.", uncheckable: true },
        ],
      },
    },
  },
];

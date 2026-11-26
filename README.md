# Escape Room – Reading Literacy Game (web)

Plain black-and-white starter. Flow: **Lobby (main menu)** → Play → **Hallway** (3 doors) → game room.

## Run it (VS Code)
1. Open this folder in VS Code.
2. Install the **Live Server** extension (Ritwick Dey).
3. Right-click `index.html` → **Open with Live Server**.
   Your phone on the same Wi-Fi can open the same address (use your laptop's IP) to test mobile.

Recommended extensions: Live Server, Prettier, ESLint (optional), Error Lens (optional).

## Structure
```
index.html          Title screen "Hotel Hysterics" (art layers, guestbook, Play -> door zoom -> hallway, Solo/Party switch)
css/title.css       Title screen styles, hover animations, door-zoom transition
hallway.html        Hallway (3 doors + leaderboard)
games/detective.html Room 01 – Detective Lie Detector (Case of the Day)
games/interrogation.html Room 02 – Interrogation Room (Log of the Day)
games/paralegal.html Room 03 – Paranormal Paralegal (Case of the Day)
css/style.css       All styles. Colors are variables at the top → swap for the pixel theme later
js/main.js          Shared: player name + scores (localStorage). Replace with backend for multiplayer
js/menu.js          Main menu logic
js/hallway.js       Hallway logic + capybara easter egg
css/detective.css   Detective game styles (stage + case-file book are reused by Room 02)
css/interrogation.css Interrogation Room styles
css/paralegal.css   Paranormal Paralegal styles
js/detective/cases.js     Case data – the 3 cases (report, evidence, interviews, answer, rubric)
js/detective/grader.js    AI reasoning grader – placeholder, swap in the real AI call later
js/detective/detective.js Detective game logic
js/interrogation/logs.js  Interrogation cases (brief, pictures, dialogue, lies, proof phrases per difficulty)
js/interrogation/interrogation.js Interrogation game logic
js/paralegal/cases.js     Paralegal cases (report, evidence, task, rubric, sample, traps per difficulty)
js/paralegal/grader.js    Summary grader – placeholder keyword check per rubric line, swap in the AI later
js/paralegal/paralegal.js Paralegal game logic
js/game.js          Shared game shell: timer, score, result screen, "copy result" (Wordle-style share)
assets/             Put pixel art, sprites, sounds here
```

## For the game teams
Each game page uses `js/game.js`. Replace the block marked `PLACEHOLDER GAMEPLAY` (or give each
game its own JS file) and call:
- `Game.addPoints(n)` when the player gets something right
- `Game.finish()` when the room is escaped

Round length is set by `data-time` on `<body>` (seconds; brief says 2–5 min per game).

## Next steps
- Theme: change the variables in `:root` in `style.css` (dark reds, browns, gold), add pixel font + door sprites.
- Multiplayer leaderboard: swap `Store` in `main.js` for Firebase / Supabase (both have free tiers).

## Detective Lie Detector (Room 01)
- Flow: game menu → Case of the Day → classified folder + difficulty → case file (report + evidence) ⇄ people of interest ⇄ interview log → Answer → result.
- 3 real cases in `js/detective/cases.js`: The Missing Mallet, The False Alarm (its own version per difficulty), The Shattered Vase.
- Today's case is picked **at random** and kept for the day; a new day or a dev reset picks again (never the same case twice in a row).
- Each case has its own big **question** (e.g. "Who lied?") and answer instructions.
- Easy = 3 people, Medium = 4, Hard = 5. `{count}` in the case report becomes Three/Four/Five. `hardExtra` adds a line to a person's answer on Hard only.
- Score /10 (the team's rubrics): 4 for choosing the right person (automatic) + 6 for reasoning (AI, see `grader.js`; it gets each case's `rubric` + `sample` answer).
- One attempt per day. To test again, open `games/detective.html?dev` and use the reset button on the result screen (this also picks a new case).
- Backlog shows "coming soon". Party mode is the global switch on the main menu.
- Note: the answers are in the browser code for now, so a curious player could find them. Move them to the server when the AI grader is added.

## Main menu & controls
- **Single player / Party switch** applies to every game. Saved as `Store.getMode()` (`"single"` or `"party"`) so each game can check it. For now, Party just disables Play.
- **Keyboard:** Esc = back one menu (closes pop-ups first). Enter = Play on the main menu. ← → flip between suspect files in the detective game. Add Esc to a new page with `onEscape(() => ...)` from `main.js`.
- **[dev] reset all data** (under the desk) wipes every saved name, score, case and draft. Remove before release.

## Interrogation Room (Room 02)
- Flow: room menu (difficulty picked on the CRT TV) → instructions + case brief → interrogation → result pop-up over the room.
- 3 real cases in `js/interrogation/logs.js`: The Missing Crown, The Broken Bottle, The Staring Capybara (placeholder title). Each has its own brief, pictures and dialogue per difficulty. Today's case is picked at random (never the same twice in a row).
- Easy = 3 statements / 1 lie, Medium = 6 / 2, Hard = 8 / 2. Flags = number of lies. No going back (saved after every line).
- The detective (player) asks questions between statements in a separate box above the suspect's (active while asking, greyed while the suspect answers so the question stays visible). Suspect dims while you ask; questions can't be flagged.
- **Flag as lie → the brief pops up → select one clause or picture as proof → Confirm.** Clauses are split automatically at commas and full stops.
- Score: 1 point per lie flagged + 1 point per correct proof (max 2 / 4 / 4). Results show the brief with every statement's proof highlighted.
- Pictures are placeholders (description + text inside the picture) until the art is drawn; add `file:` to show the real image.
- Keys: Enter/Space/→ = next (or skip typing), F = flag, Enter = confirm proof, C = open brief, ↑↓ = difficulty, Esc = back / cancel.
- Test again with `games/interrogation.html?dev` (reset also picks a new case).

## Title screen art (assets/main_menu/)
- Original Photopea exports: `background bottom.png`, `background top.png`, `bellboy.png`, `bottom bar.png`, `buttons.png`, `title text.png` (all 1280x720).
- Cut from those for the game (so parts can animate): `pillars.png` (background top without the bell), `bell.png`, `title.png` (title without "Play"), `guestbook.png`, `play-button.png` (frame + "Play" text).
- The door is a transparent hole in `background bottom.png`; the stage colour `#3f152e` shows through it.
- If you re-export a layer, keep it 1280x720 and the same file name, and it drops straight in. If the button/title/bell art changes, the cut files need re-making.

## Paranormal Paralegal (Room 03)
- Flow: case file cover (difficulty) → John D'Brief, the bellboy (skippable, can replay; three sprite poses swap while he talks) → closed folder in the middle (click to open) → read pages move onto the left half of the folder → summary sheet (title + summary) → confirm submit → pages return, folder closes, CASE CLOSED stamp.
- 3 cases in `js/paralegal/cases.js` (Floaty 'Breller, the cat painting, Lost, Found & Floating). One is picked at random each day. Case names are never shown (one is the model answer title).
- Each difficulty has its own case report + evidence list. Page 1 = case report, then one page per evidence item, so adding evidence adds pages.
- Key words in `[[double brackets]]` are highlighted on Easy and Medium (hidden on Hard).
- Score /5 from each version's rubric (title 1 + summary 4). For now `grader.js` does a keyword check per rubric line and spots the Hard traps; replace it with the AI judge later.
- Breakdown shows every rubric line ✓/✗, traps fallen into (Hard), your answer and a full-marks answer.
- No timer, hints or retry yet. One attempt per day; test again with `games/paralegal.html?dev` (also picks a new case).
- Keys: ← → = pages (or difficulty on the cover), Enter = next debrief line / open folder, Esc = back / cancel the confirm box.

## Character sprites (assets/characters/)
- One shared list in `js/main.js` (`SPRITES`) maps a character's name to their sprite. Every suspect file, the People of interest board and the interrogation room use it automatically.
- To add a character: put the PNG (transparent background) in `assets/characters/` and add one line to `SPRITES`, using the exact name from the case files.
- Current sprites: Tung Tung Tung Sahur, Jane Maid, Jack O'Lantern, plus John D'Brief's three poses (`john-dbrief-1/2/3.png`, used in the Paralegal debrief).

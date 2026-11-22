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
games/evaluate.html Room 03 – Evaluate & reflect
css/style.css       All styles. Colors are variables at the top → swap for the pixel theme later
js/main.js          Shared: player name + scores (localStorage). Replace with backend for multiplayer
js/menu.js          Main menu logic
js/hallway.js       Hallway logic + capybara easter egg
css/detective.css   Detective game styles (stage + case-file book are reused by Room 02)
css/interrogation.css Interrogation Room styles
js/detective/cases.js     Case data – WRITERS EDIT THIS (briefing, suspects, culprit, rubric)
js/detective/grader.js    AI reasoning grader – placeholder, swap in the real AI call later
js/detective/detective.js Detective game logic
js/interrogation/logs.js  Interrogation logs – WRITERS EDIT THIS (suspect, case file, statements, which are lies)
js/interrogation/interrogation.js Interrogation game logic
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
- Flow: game menu → Case of the Day → classified folder + difficulty → case file ⇄ suspects ⇄ suspect file → Answer → result.
- Score /20: 10 for the right suspect, 10 for reasoning (AI, see `grader.js`).
- One attempt per day. To test again, open `games/detective.html?dev` and use the reset button on the result screen.
- Add/edit cases in `js/detective/cases.js`. Cases rotate one per day starting from `START_DATE` in `detective.js`.
- Backlog shows "coming soon". Party mode is now the global switch on the main menu.
- Note: the culprit is in the browser code for now, so a curious player could find it. Move it to the server when the AI grader is added.

## Main menu & controls
- **Single player / Party switch** applies to every game. Saved as `Store.getMode()` (`"single"` or `"party"`) so each game can check it. For now, Party just disables Play.
- **Keyboard:** Esc = back one menu (closes pop-ups first). Enter = Play on the main menu. ← → flip between suspect files in the detective game. Add Esc to a new page with `onEscape(() => ...)` from `main.js`.
- **[dev] reset all data** (under the desk) wipes every saved name, score, case and draft. Remove before release.

## Interrogation Room (Room 02)
- Flow: room menu (difficulty picked on the CRT TV) → instructions + case file → interrogation → result.
- Easy = 3 statements / 1 lie, Medium = 4 / 1, Hard = 5 / 2. Players get as many flags as there are lies.
- No going back: progress is saved after every statement, so refreshing can't undo a choice.
- Score = statements called correctly, out of 3 / 4 / 5. Result shows as a pop-up over the room. One attempt per day; test again with `games/interrogation.html?dev`.
- Keys: Enter/Space/→ = next (or skip typing), F = flag, C = open case file, ↑↓ = difficulty, Esc = back.
- Add/edit logs in `js/interrogation/logs.js`. Logs rotate one per day from `START_DATE` in `interrogation.js`.

## Title screen art (assets/main_menu/)
- Original Photopea exports: `background bottom.png`, `background top.png`, `bellboy.png`, `bottom bar.png`, `buttons.png`, `title text.png` (all 1280x720).
- Cut from those for the game (so parts can animate): `pillars.png` (background top without the bell), `bell.png`, `title.png` (title without "Play"), `guestbook.png`, `play-button.png` (frame + "Play" text).
- The door is a transparent hole in `background bottom.png`; the stage colour `#3f152e` shows through it.
- If you re-export a layer, keep it 1280x720 and the same file name, and it drops straight in. If the button/title/bell art changes, the cut files need re-making.

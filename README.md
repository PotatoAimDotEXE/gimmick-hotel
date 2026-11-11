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
index.html          Lobby / main menu (Play, How to play, Leaderboard, Credits, bell easter egg)
hallway.html        Hallway (3 doors + leaderboard)
games/detective.html Room 01 – Detective Lie Detector (Case of the Day)
games/understand.html Room 02 – Understand
games/evaluate.html Room 03 – Evaluate & reflect
css/style.css       All styles. Colors are variables at the top → swap for the pixel theme later
js/main.js          Shared: player name + scores (localStorage). Replace with backend for multiplayer
js/menu.js          Main menu logic
js/hallway.js       Hallway logic + capybara easter egg
css/detective.css   Detective game styles
js/detective/cases.js     Case data – WRITERS EDIT THIS (briefing, suspects, culprit, rubric)
js/detective/grader.js    AI reasoning grader – placeholder, swap in the real AI call later
js/detective/detective.js Detective game logic
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
- Backlog and Party Mode buttons show "coming soon".
- Note: the culprit is in the browser code for now, so a curious player could find it. Move it to the server when the AI grader is added.

/* =========================================================
   Shared game-page shell: timer, score, start/finish flow.
   Each game page sets data-game on <body> and data-time
   (seconds). The game team replaces the PLACEHOLDER section
   with real gameplay and calls Game.addPoints() / Game.finish().
   ========================================================= */

const Game = (function () {
  const body = document.body;
  const gameId = body.dataset.game;
  const totalTime = parseInt(body.dataset.time || "180", 10); // 2–5 min target

  const timerEl = document.getElementById("timer");
  const scoreEl = document.getElementById("score");
  const area = document.getElementById("game-area");

  let score = 0;
  let timeLeft = totalTime;
  let tick = null;
  let running = false;

  function fmt(sec) {
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function updateHud() {
    timerEl.textContent = fmt(timeLeft);
    scoreEl.textContent = score;
  }

  function start() {
    score = 0;
    timeLeft = totalTime;
    running = true;
    updateHud();
    renderPlaying();
    clearInterval(tick);
    tick = setInterval(() => {
      timeLeft--;
      updateHud();
      if (timeLeft <= 0) finish();
    }, 1000);
  }

  function addPoints(n) {
    if (!running) return;
    score += n;
    updateHud();
  }

  function finish() {
    if (!running) return;
    running = false;
    clearInterval(tick);
    Store.addScore(gameId, score);
    renderResult();
  }

  /* ---------------- Screens ---------------- */

  function renderPlaying() {
    // ===== PLACEHOLDER GAMEPLAY – replace this with the real game =====
    area.innerHTML = `
      <h1>Room in progress…</h1>
      <p class="skill">Gameplay goes here. For now, use the test buttons.</p>
      <div class="actions">
        <button id="btn-correct">+100 (correct)</button>
        <button id="btn-finish">Escape the room</button>
      </div>
    `;
    document.getElementById("btn-correct").onclick = () => addPoints(100);
    document.getElementById("btn-finish").onclick = finish;
    // ==================================================================
  }

  function renderResult() {
    const best = Store.bestFor(gameId);
    const label = GAME_LABELS[gameId] || gameId;
    const shareText = `Escape Room · ${label}\nScore: ${score}\nTime left: ${fmt(timeLeft)}`;

    area.innerHTML = `
      <h1>${timeLeft > 0 ? "You escaped!" : "Time's up!"}</h1>
      <p>Score: <strong>${score}</strong> · Your best: <strong>${best}</strong></p>
      <div class="actions">
        <button id="btn-again">Play again</button>
        <button id="btn-share">Copy result</button>
        <a href="../hallway.html"><button>Back to hallway</button></a>
      </div>
    `;
    document.getElementById("btn-again").onclick = start;
    document.getElementById("btn-share").onclick = async (e) => {
      try {
        await navigator.clipboard.writeText(shareText);
        e.target.textContent = "Copied!";
      } catch {
        e.target.textContent = "Copy failed";
      }
    };
  }

  // initial state
  updateHud();
  document.getElementById("btn-start").onclick = start;

  return { start, addPoints, finish, get score() { return score; } };
})();

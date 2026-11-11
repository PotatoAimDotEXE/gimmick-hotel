/* Hallway page: player name, best scores on each door, leaderboard. */

(function () {
  const nameInput = document.getElementById("player-name");
  const saved = Store.getName();
  if (saved !== "Guest") nameInput.value = saved;

  nameInput.addEventListener("change", () => {
    Store.setName(nameInput.value || "Guest");
    render();
  });

  function render() {
    // best score under each door
    document.querySelectorAll("[data-best]").forEach((el) => {
      const best = Store.bestFor(el.dataset.best);
      el.textContent = "Best: " + (best === null ? "–" : best);
    });

    // leaderboard
    const list = document.getElementById("leaderboard-list");
    const top = Store.topScores();
    list.innerHTML = "";
    if (!top.length) {
      list.innerHTML = '<li class="muted">No scores yet. Pick a door!</li>';
      return;
    }
    top.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = `${s.name} – ${s.score} (${GAME_LABELS[s.game] || s.game})`;
      list.appendChild(li);
    });
  }

  // Capybara easter egg (placeholder – swap in a pixel capybara later)
  let clicks = 0;
  document.getElementById("easter-egg").addEventListener("click", () => {
    clicks++;
    if (clicks === 5) {
      alert("A capybara peeks out from behind a hallway door. 🦫");
      clicks = 0;
    }
  });

  // Esc = back to the lobby
  onEscape(() => (location.href = "index.html"));

  render();
})();

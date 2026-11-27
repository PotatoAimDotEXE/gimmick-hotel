/* Hallway page: player name, best score on each door. */

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

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

  // Picking a door: a very fast zoom into that doorway (panes open), then the game loads
  const room = document.querySelector(".room.hallway");
  const fade = document.createElement("div");
  fade.className = "hall-fade";
  document.body.appendChild(fade);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".door").forEach((door) =>
    door.addEventListener("click", (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // new-tab clicks still work
      e.preventDefault();
      if (document.body.classList.contains("hall-zooming")) return;
      const href = door.href;
      if (reduced) return (location.href = href);
      const r = room.getBoundingClientRect();
      const d = door.querySelector(".door-panes").getBoundingClientRect();
      room.style.transformOrigin = `${d.left + d.width / 2 - r.left}px ${d.top + d.height / 2 - r.top}px`;
      door.classList.add("opening");
      document.body.classList.add("hall-zooming");
      setTimeout(() => (location.href = href), 420);
    })
  );
  // coming back with the browser's Back button: undo the zoom
  window.addEventListener("pageshow", () => {
    document.body.classList.remove("hall-zooming");
    document.querySelectorAll(".door.opening").forEach((d) => d.classList.remove("opening"));
  });

  // Esc = back to the lobby
  onEscape(() => (location.href = "index.html"));

  render();
})();

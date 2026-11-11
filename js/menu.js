/* Main menu (lobby): guestbook name, menu pop-ups, leaderboard, bell easter egg. */

(function () {
  // ---- Guestbook (player name) ----
  const nameInput = document.getElementById("player-name");
  const saved = Store.getName();
  if (saved !== "Guest") nameInput.value = saved;

  nameInput.addEventListener("change", () => Store.setName(nameInput.value || "Guest"));

  // Save the name even if they type and press Play straight away
  document.getElementById("btn-play").addEventListener("click", () => {
    if (nameInput.value.trim()) Store.setName(nameInput.value);
  });

  // ---- Pop-up panels ----
  document.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.open === "scores") renderLeaderboard();
      document.getElementById(btn.dataset.open).showModal();
    });
  });

  // close a pop-up by clicking the dark area around it
  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => {
      if (e.target === d) d.close();
    });
  });

  function renderLeaderboard() {
    const list = document.getElementById("leaderboard-list");
    const top = Store.topScores();
    list.innerHTML = "";
    if (!top.length) {
      list.innerHTML = '<li class="muted">No scores yet.</li>';
      return;
    }
    top.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = `${s.name} – ${s.score} (${GAME_LABELS[s.game] || s.game})`;
      list.appendChild(li);
    });
  }

  // ---- Easter egg: ring the reception bell 5 times ----
  let rings = 0;
  document.getElementById("bell").addEventListener("click", (e) => {
    e.currentTarget.classList.remove("ring");
    void e.currentTarget.offsetWidth; // restart animation
    e.currentTarget.classList.add("ring");
    if (++rings === 5) {
      alert("A capybara pops up behind the desk: \"Checking in?\" 🦫");
      rings = 0;
    }
  });
})();

/* Main menu (lobby): guestbook name, single/party switch, pop-ups, dev reset, bell easter egg. */

(function () {
  const $ = (id) => document.getElementById(id);

  // ---- Guestbook (player name) ----
  const nameInput = $("player-name");
  const saved = Store.getName();
  if (saved !== "Guest") nameInput.value = saved;

  nameInput.addEventListener("change", () => Store.setName(nameInput.value || "Guest"));
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("btn-play").click();
  });

  // ---- Single player / Party switch ----
  const modeSwitch = $("mode-switch");
  const playBtn = $("btn-play");

  function renderMode() {
    const party = Store.getMode() === "party";
    modeSwitch.setAttribute("aria-checked", party);
    document.querySelectorAll(".mode-label").forEach((l) =>
      l.classList.toggle("active", l.dataset.mode === Store.getMode())
    );
    // Party mode isn't built yet -> Play is disabled for now
    playBtn.disabled = party;
    $("mode-note").textContent = party ? "Party mode is coming soon. Switch back to single player to play." : "";
  }

  modeSwitch.addEventListener("click", () => {
    Store.setMode(Store.getMode() === "party" ? "single" : "party");
    renderMode();
  });

  // ---- Play ----
  playBtn.addEventListener("click", () => {
    if (playBtn.disabled) return;
    if (nameInput.value.trim()) Store.setName(nameInput.value);
    location.href = "hallway.html";
  });

  // Enter anywhere on the page (outside a text box / pop-up) = Play
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || document.querySelector("dialog[open]")) return;
    if (["INPUT", "TEXTAREA", "BUTTON", "A"].includes(document.activeElement.tagName)) return;
    playBtn.click();
  });

  // ---- Pop-up panels ----
  document.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => $(btn.dataset.open).showModal());
  });
  // close a pop-up by clicking the dark area around it (Esc closes it too – built into <dialog>)
  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => {
      if (e.target === d) d.close();
    });
  });

  // ---- [dev] Reset all saved data (two clicks to confirm) ----
  const resetBtn = $("btn-reset");
  let resetArmed = false;
  resetBtn.addEventListener("click", () => {
    if (!resetArmed) {
      resetArmed = true;
      resetBtn.textContent = "click again to erase everything";
      setTimeout(() => {
        resetArmed = false;
        resetBtn.textContent = "[dev] reset all data";
      }, 3000);
      return;
    }
    Store.resetAll();
    location.reload();
  });

  // ---- Easter egg: ring the reception bell 5 times ----
  let rings = 0;
  $("bell").addEventListener("click", (e) => {
    e.currentTarget.classList.remove("ring");
    void e.currentTarget.offsetWidth; // restart animation
    e.currentTarget.classList.add("ring");
    if (++rings === 5) {
      alert("A capybara pops up behind the desk: \"Checking in?\" 🦫");
      rings = 0;
    }
  });

  renderMode();
})();

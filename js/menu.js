/* Title screen: guestbook name, Play -> zoom into the door -> hallway,
   parallax, pop-ups, dev reset, bell easter egg. */

(function () {
  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Guestbook (player name) ----
  const nameInput = $("player-name");
  const saved = Store.getName();
  if (saved !== "Guest") nameInput.value = saved;

  nameInput.addEventListener("change", () => Store.setName(nameInput.value || "Guest"));
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      play();
    }
  });

  // Party mode now lives in each game's menu; the title screen is always solo
  const playBtn = $("btn-play");
  Store.setMode("single");

  // ---- Play: zoom into the door, fade to the hallway ----
  let leaving = false;
  function play() {
    if (playBtn.disabled || leaving) return;
    leaving = true;
    if (nameInput.value.trim()) Store.setName(nameInput.value);
    if (reducedMotion) return (location.href = "hallway.html");
    stage.classList.add("entering");
    setTimeout(() => (location.href = "hallway.html"), 1500);
  }
  playBtn.addEventListener("click", play);

  // Enter anywhere (outside a pop-up / other button) = Play
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || document.querySelector("dialog[open]")) return;
    if (["INPUT", "TEXTAREA", "BUTTON", "A"].includes(document.activeElement.tagName)) return;
    play();
  });

  // If the player comes back with the browser's Back button, undo the zoom
  window.addEventListener("pageshow", () => {
    stage.classList.remove("entering");
    leaving = false;
  });

  // ---- Parallax: background layers drift with the mouse ----
  if (!reducedMotion) {
    stage.addEventListener("mousemove", (e) => {
      const r = stage.getBoundingClientRect();
      stage.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      stage.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
    stage.addEventListener("mouseleave", () => {
      stage.style.setProperty("--mx", 0);
      stage.style.setProperty("--my", 0);
    });
  }

  // ---- Pop-up panels ----
  document.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => $(btn.dataset.open).showModal());
  });
  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => {
      if (e.target === d) d.close(); // click the dark area to close (Esc works too)
    });
  });

  // ---- [dev] AI grading on/off (saved in this browser; off = placeholder graders) ----
  const aiBtn = $("btn-ai");
  function renderAI() {
    const on = Store.getAIGrading();
    aiBtn.textContent = "[dev] AI grading: " + (on ? "on" : "off");
    aiBtn.setAttribute("aria-pressed", on);
    aiBtn.title = AI_GRADER_URL ? "" : "No grader address set in js/main.js, so the placeholder graders are used anyway";
  }
  aiBtn.addEventListener("click", () => {
    Store.setAIGrading(!Store.getAIGrading());
    renderAI();
  });
  renderAI();

  // ---- [dev] case picker on/off (shows a case list on each game's menu) ----
  const casesBtn = $("btn-devcases");
  function renderCases() {
    const on = Store.getDevCases();
    casesBtn.textContent = "[dev] case picker: " + (on ? "on" : "off");
    casesBtn.setAttribute("aria-pressed", on);
  }
  casesBtn.addEventListener("click", () => {
    Store.setDevCases(!Store.getDevCases());
    renderCases();
  });
  renderCases();

  // ---- [dev] Reset all saved data (two clicks to confirm) ----
  const resetBtn = $("btn-reset");
  let resetArmed = false;
  resetBtn.addEventListener("click", () => {
    if (!resetArmed) {
      resetArmed = true;
      resetBtn.textContent = "click again to erase all";
      setTimeout(() => {
        resetArmed = false;
        resetBtn.textContent = "[dev] reset";
      }, 3000);
      return;
    }
    Store.resetAll();
    location.reload();
  });

  // ---- Easter egg: ring the bell on the desk 5 times ----
  let rings = 0;
  $("bell").addEventListener("click", (e) => {
    const bell = e.currentTarget;
    bell.classList.remove("ring");
    void bell.offsetWidth; // restart the animation
    bell.classList.add("ring");
    if (++rings === 5) {
      alert('The bellboy tips his hat: "Checking in, detective?" 🛎️');
      rings = 0;
    }
  });

})();

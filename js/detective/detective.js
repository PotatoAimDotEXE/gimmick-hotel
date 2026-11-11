/* =========================================================
   DETECTIVE LIE DETECTOR – game logic
   Flow: Menu -> Classified folder (+difficulty) -> Case file
         <-> Suspects <-> Suspect file -> Answer -> Result
   Case of the Day: one attempt per day, saved in localStorage.
   Your in-progress answer is saved as you type, so closing the
   pop-up, switching pages or even refreshing keeps it.
   ========================================================= */

(function () {
  /* ---------------- Today's case ---------------- */
  const START_DATE = new Date(2026, 10, 1); // 1 Nov 2026 = case #101 (change freely)
  const now = new Date();

  const dateKey = localDateKey(now);
  const dayIndex = Math.max(0, daysBetween(START_DATE, now));
  const caseData = CASES[dayIndex % CASES.length];
  const caseNumber = 101 + dayIndex;

  const KEY_RESULT = "er_detective_result_" + dateKey;
  const KEY_DRAFT = "er_detective_draft_" + dateKey;

  let draft = Store.safeGet(KEY_DRAFT, null) || {
    difficulty: "easy",
    opened: false, // folder opened -> difficulty locked
    suspect: "",
    reasoning: "",
  };
  let currentSuspect = null;

  const $ = (id) => document.getElementById(id);
  const saveDraft = () => Store.safeSet(KEY_DRAFT, draft);
  const getResult = () => Store.safeGet(KEY_RESULT, null);

  $("topbar-case").textContent = "Case #" + caseNumber;

  /* ---------------- Screen switching ---------------- */
  const screens = ["menu", "folder", "investigate", "result"];

  function showScreen(name) {
    screens.forEach((s) => ($("screen-" + s).hidden = s !== name));
    if (name === "menu") renderMenu();
  }

  function showView(name) {
    ["file", "suspects", "suspect"].forEach((v) => ($("view-" + v).hidden = v !== name));
    document.querySelectorAll(".dl-tabs [data-view]").forEach((t) => {
      const active = t.dataset.view === name || (name === "suspect" && t.dataset.view === "suspects");
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active);
    });
  }

  document.querySelectorAll("[data-go]").forEach((b) =>
    b.addEventListener("click", () => showScreen(b.dataset.go))
  );
  document.querySelectorAll("[data-view]").forEach((b) =>
    b.addEventListener("click", () => showView(b.dataset.view))
  );

  /* ---------------- 1. Menu ---------------- */
  function renderMenu() {
    const done = getResult();
    $("btn-daily").textContent = done ? "Case of the Day ✓ (view result)" : "Case of the Day";

    const top = Store.getScores()
      .filter((s) => s.game === "detective")
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const list = $("dl-leaderboard");
    list.innerHTML = "";
    if (!top.length) list.innerHTML = '<li class="muted">No cases solved yet.</li>';
    top.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = `${s.name} – ${s.score}/20`;
      list.appendChild(li);
    });

    $("dl-fact").textContent = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
  }

  $("btn-daily").addEventListener("click", () => {
    if (getResult()) return showResult();
    if (draft.opened) {
      showScreen("investigate");
      showView("file");
    } else {
      renderFolder();
      showScreen("folder");
    }
  });

  document.querySelectorAll("[data-soon]").forEach((b) =>
    b.addEventListener("click", () => {
      $("menu-note").textContent = b.dataset.soon + " is coming soon.";
    })
  );

  /* ---------------- 2. Folder + difficulty ---------------- */
  function renderFolder() {
    $("folder-case-no").textContent = "CASE #" + caseNumber;
    $("folder-date").textContent = prettyDate(now);
    document.querySelectorAll('input[name="difficulty"]').forEach((r) => {
      r.checked = r.value === draft.difficulty;
      r.disabled = draft.opened;
    });
  }

  document.querySelectorAll('input[name="difficulty"]').forEach((r) =>
    r.addEventListener("change", () => {
      draft.difficulty = r.value;
      saveDraft();
    })
  );

  $("btn-open-folder").addEventListener("click", () => {
    draft.opened = true;
    saveDraft();
    renderInvestigation();
    showScreen("investigate");
    showView("file");
  });

  /* ---------------- 3. Investigation ---------------- */
  function activeSuspects() {
    const ids = caseData.difficulty[draft.difficulty];
    return caseData.suspects.filter((s) => ids.includes(s.id));
  }

  function renderPage(el, heading, paragraphs) {
    el.innerHTML = "";
    const h = document.createElement("h2");
    h.textContent = heading;
    el.appendChild(h);
    paragraphs.forEach((t) => {
      const p = document.createElement("p");
      p.textContent = t;
      el.appendChild(p);
    });
  }

  function portrait(s) {
    if (s.image) return `<img src="${s.image}" alt="${s.name}" />`;
    // placeholder figure (head + shoulders)
    return `<svg viewBox="0 0 60 80" aria-hidden="true">
      <circle cx="30" cy="26" r="11" fill="none" stroke="currentColor" stroke-width="4"/>
      <path d="M10 74 Q10 46 30 46 Q50 46 50 74" fill="none" stroke="currentColor" stroke-width="4"/>
    </svg>`;
  }

  function renderInvestigation() {
    const b = caseData.briefing;
    renderPage($("file-left"), b.left.heading, b.left.body);
    renderPage($("file-right"), b.right.heading, b.right.body);

    const list = $("suspect-list");
    list.innerHTML = "";
    activeSuspects().forEach((s) => {
      const card = document.createElement("button");
      card.className = "dl-suspect-card";
      card.innerHTML = `<span class="dl-portrait">${portrait(s)}</span><span class="dl-name"></span>`;
      card.querySelector(".dl-name").textContent = s.name;
      card.addEventListener("click", () => openSuspect(s));
      list.appendChild(card);
    });
  }

  function openSuspect(s) {
    currentSuspect = s;
    const left = $("suspect-left");
    left.innerHTML = `<div class="dl-portrait big">${portrait(s)}</div><h2></h2><p class="muted"></p><h3>Statement</h3><p class="stmt"></p>`;
    left.querySelector("h2").textContent = s.name;
    left.querySelector(".muted").textContent = s.role;
    left.querySelector(".stmt").textContent = "“" + s.statement + "”";

    const right = $("suspect-right");
    right.innerHTML = "<h2>Alibi</h2><p class='alibi'></p><h2>Evidence</h2><ul></ul>";
    right.querySelector(".alibi").textContent = s.alibi;
    s.evidence.forEach((e) => {
      const li = document.createElement("li");
      li.textContent = e;
      right.querySelector("ul").appendChild(li);
    });
    showView("suspect");
  }

  /* ---------------- Answer pop-up ---------------- */
  const dialog = $("answer-dialog");
  const reasonBox = $("answer-reason");
  let confirmArmed = false;

  function openAnswer(preselectId) {
    if (preselectId) {
      draft.suspect = preselectId;
      saveDraft();
    }
    const box = $("answer-choices");
    box.innerHTML = "";
    activeSuspects().forEach((s) => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="radio" name="verdict" value="${s.id}" /> <span></span>`;
      label.querySelector("span").textContent = s.name;
      const input = label.querySelector("input");
      input.checked = draft.suspect === s.id;
      input.addEventListener("change", () => {
        draft.suspect = s.id;
        saveDraft();
        resetConfirm();
      });
      box.appendChild(label);
    });
    reasonBox.value = draft.reasoning;
    $("answer-count").textContent = reasonBox.value.length;
    $("answer-error").textContent = "";
    resetConfirm();
    dialog.showModal();
  }

  reasonBox.addEventListener("input", () => {
    draft.reasoning = reasonBox.value;
    $("answer-count").textContent = reasonBox.value.length;
    saveDraft();
    resetConfirm();
  });

  function resetConfirm() {
    confirmArmed = false;
    $("btn-submit").textContent = "Submit";
  }

  $("btn-answer").addEventListener("click", () => openAnswer());
  $("btn-accuse").addEventListener("click", () => openAnswer(currentSuspect && currentSuspect.id));
  $("btn-answer-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close(); // click outside closes; draft is already saved
  });

  $("btn-submit").addEventListener("click", () => {
    const err = $("answer-error");
    if (!draft.suspect) return (err.textContent = "Pick a suspect first.");
    if (draft.reasoning.trim().length < 20)
      return (err.textContent = "Write a bit more reasoning (at least 20 characters).");

    if (!confirmArmed) {
      confirmArmed = true;
      err.textContent = "You only get one try today.";
      $("btn-submit").textContent = "Click again to confirm";
      return;
    }
    dialog.close();
    submitAnswer();
  });

  /* ---------------- 4. Submit + result ---------------- */
  async function submitAnswer() {
    const correct = draft.suspect === caseData.culprit;
    const result = {
      caseId: caseData.id,
      caseNumber,
      difficulty: draft.difficulty,
      suspect: draft.suspect,
      reasoning: draft.reasoning,
      suspectPts: correct ? 10 : 0,
      reasoningPts: null,
      feedback: "",
      grading: true,
    };
    Store.safeSet(KEY_RESULT, result);
    showResult();
    finishGrading(result);
  }

  async function finishGrading(result) {
    try {
      const g = await gradeReasoning({ caseData, suspectId: result.suspect, reasoning: result.reasoning });
      result.reasoningPts = g.score === null ? null : Math.max(0, Math.min(10, Math.round(g.score)));
      result.feedback = g.feedback || "";
    } catch {
      result.feedback = "Couldn't reach the grader. Reasoning not scored.";
    }
    result.grading = false;
    Store.safeSet(KEY_RESULT, result);
    Store.addScore("detective", total(result));
    if (!$("screen-result").hidden) showResult();
    else renderMenu();
  }

  const total = (r) => r.suspectPts + (r.reasoningPts || 0);
  const nameOf = (id) => (caseData.suspects.find((s) => s.id === id) || {}).name || "?";

  function showResult() {
    const r = getResult();
    showScreen("result");
    const body = $("result-body");
    const correct = r.suspectPts === 10;

    $("result-title").textContent = r.grading ? "Grading…" : correct ? "Case Closed" : "The culprit got away";

    const reasoningLine = r.grading
      ? "grading…"
      : r.reasoningPts === null
      ? "– / 10 (pending)"
      : r.reasoningPts + " / 10";

    body.innerHTML = `
      <table>
        <tr><th>Case</th><td>#${r.caseNumber} · ${capitalise(r.difficulty)}</td></tr>
        <tr><th>You accused</th><td>${escapeHtml(nameOf(r.suspect))} ${correct ? "✓" : "✗"}</td></tr>
        <tr><th>Suspect</th><td>${r.suspectPts} / 10</td></tr>
        <tr><th>Reasoning</th><td>${reasoningLine}</td></tr>
        <tr class="total"><th>Total</th><td>${r.grading ? "…" : total(r) + " / 20"}</td></tr>
      </table>
      ${correct ? "" : `<p>The culprit was <strong>${escapeHtml(nameOf(caseData.culprit))}</strong>.</p>`}
      ${r.feedback ? `<p class="muted">${escapeHtml(r.feedback)}</p>` : ""}
      <details><summary>Your reasoning</summary><p>${escapeHtml(r.reasoning)}</p></details>
    `;

    $("result-next").textContent = "Next case in " + timeToMidnight() + ".";
    $("btn-copy").textContent = "Copy result";
  }

  $("btn-copy").addEventListener("click", async (e) => {
    const r = getResult();
    if (!r) return;
    const text =
      `Detective Lie Detector · Case #${r.caseNumber} (${capitalise(r.difficulty)})\n` +
      `Suspect: ${r.suspectPts === 10 ? "✅" : "❌"}\n` +
      `Reasoning: ${r.reasoningPts === null ? "?" : r.reasoningPts}/10\n` +
      `Score: ${total(r)}/20`;
    try {
      await navigator.clipboard.writeText(text);
      e.target.textContent = "Copied!";
    } catch {
      e.target.textContent = "Copy failed";
    }
  });

  // Testing helper: open the page with ?dev at the end of the URL
  if (new URLSearchParams(location.search).has("dev")) {
    $("btn-dev-reset").hidden = false;
    $("btn-dev-reset").addEventListener("click", () => {
      try {
        localStorage.removeItem(KEY_RESULT);
        localStorage.removeItem(KEY_DRAFT);
      } catch {}
      location.reload();
    });
  }

  /* ---------------- Keyboard ---------------- */
  // Esc = back one menu:  suspect file -> suspects -> game menu -> hallway
  onEscape(() => {
    if (!$("screen-investigate").hidden && !$("view-suspect").hidden) return showView("suspects");
    if (!$("screen-menu").hidden) return (location.href = "../hallway.html");
    showScreen("menu");
  });

  // Left / right arrows = previous / next suspect while a suspect file is open
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if ($("view-suspect").hidden || $("screen-investigate").hidden || !currentSuspect) return;
    if (document.querySelector("dialog[open]")) return;
    const list = activeSuspects();
    const i = list.findIndex((s) => s.id === currentSuspect.id);
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + list.length) % list.length;
    openSuspect(list[next]);
  });

  /* ---------------- Helpers ---------------- */
  function localDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function daysBetween(a, b) {
    const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((ub - ua) / 86400000);
  }
  function prettyDate(d) {
    const n = d.getDate();
    const suf = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
    return d.toLocaleString("en-GB", { month: "long" }) + " " + n + suf + " " + d.getFullYear();
  }
  function timeToMidnight() {
    const t = new Date();
    const mid = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
    const mins = Math.ceil((mid - t) / 60000);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }
  function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------------- Start ---------------- */
  if (draft.opened) renderInvestigation();
  showScreen("menu");
  const pending = getResult();
  if (pending && pending.grading) finishGrading(pending); // page was refreshed mid-grading
})();

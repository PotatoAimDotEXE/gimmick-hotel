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
  const caseNumber = 101 + dayIndex;

  const KEY_RESULT = "er_det_result_" + dateKey;
  const KEY_DRAFT = "er_det_draft_" + dateKey;
  const KEY_PICK = "er_det_case_" + dateKey; // which case today is
  const KEY_LAST = "er_det_last_case"; // the previous pick, so it doesn't repeat

  // Today's case is picked at random once, then kept for the day.
  // A new day or a dev reset picks again (never the same as last time).
  function pickCase() {
    const saved = Store.safeGet(KEY_PICK, null);
    const found = CASES.find((c) => c.id === saved);
    if (found) return found;
    const last = Store.safeGet(KEY_LAST, null);
    const pool = CASES.length > 1 ? CASES.filter((c) => c.id !== last) : CASES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    Store.safeSet(KEY_PICK, pick.id);
    Store.safeSet(KEY_LAST, pick.id);
    return pick;
  }
  const caseData = pickCase();

  const MAX_PICK = 4; // points for choosing the right person (automatic)
  const MAX_REASON = 6; // points for the reasoning (AI)
  const MAX_TOTAL = MAX_PICK + MAX_REASON;

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
    if (name === "file" && fileDirty) paginateFile(); // the folder stays on the same page
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
      li.textContent = `${s.name} – ${s.score}/${MAX_TOTAL}`;
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
    $("folder-title").textContent = caseData.title;
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

  /* Case file folder (works like the paralegal folder):
     unread sheets are piled on the right, read ones lie on the dimmed left flap.
     Click the top sheet / ▶ / → to turn, click the left pile / ◀ / ← to go back. */
  const fileStack = $("file-stack");
  const FILE_TILT = [-1.2, 0.8, -0.5, 1.1, -0.9, 0.6, -0.3];
  const FILE_SLIDE = 600; // ms, matches .df-page transition
  let fileBlocks = null;
  let filePages = [];
  let filePage = 0;
  let fileDirty = true;

  // pour the report, then the evidence, onto sheets; a sheet that's full starts a new one
  function paginateFile() {
    if (!fileBlocks || $("screen-investigate").hidden || $("view-file").hidden) return;
    filePages.forEach((p) => p.remove());
    filePages = [];
    const newSheet = (head) => {
      const el = document.createElement("article");
      el.className = "df-page measuring";
      el.innerHTML = `<p class="df-page-no">Page 00 of 00</p>${head}`; // real number filled in after, same height
      fileStack.appendChild(el);
      filePages.push(el);
      return el;
    };
    const fits = (el) => el.scrollHeight <= el.clientHeight + 1;
    const splitLongEvidence = (sheet, contHead) => {
      const ev = sheet.lastElementChild;
      const list = ev && ev.querySelector("ul");
      if (!list || list.children.length < 2) return sheet; // nothing to split: this sheet scrolls
      const moved = [];
      const note = ev.querySelector(".dl-ev-note");
      let noteHtml = "";
      while (!fits(sheet) && list.children.length > 1) {
        moved.unshift(list.lastElementChild.outerHTML);
        list.lastElementChild.remove();
        if (note && !noteHtml) { noteHtml = note.outerHTML; note.remove(); } // the note follows the end of the list
      }
      if (!moved.length) return sheet;
      const title = ev.querySelector("h3").textContent;
      const next = newSheet(contHead);
      next.insertAdjacentHTML(
        "beforeend",
        `<div class="dl-evidence"><h3>${escapeHtml(title)} <small>(continued)</small></h3><ul>${moved.join("")}</ul>${noteHtml}</div>`
      );
      return fits(next) ? next : splitLongEvidence(next, contHead);
    };
    const pour = (head, contHead, blocks) => {
      let sheet = newSheet(head);
      let count = 0;
      blocks.forEach((html) => {
        sheet.insertAdjacentHTML("beforeend", html);
        if (!fits(sheet) && count > 0) {
          sheet.lastElementChild.remove();
          sheet = newSheet(contHead);
          sheet.insertAdjacentHTML("beforeend", html);
          count = 0;
        }
        // one piece of evidence longer than a whole sheet: carry its list on to the next sheet
        if (!fits(sheet)) sheet = splitLongEvidence(sheet, contHead);
        count++;
      });
    };
    pour(
      `<p class="dl-file-title">${escapeHtml(caseData.title)}</p><h2>Case Report</h2>`,
      "<h2>Case Report <small>(continued)</small></h2>",
      fileBlocks.report
    );
    pour("<h2>Evidence</h2>", "<h2>Evidence <small>(continued)</small></h2>", fileBlocks.evidence);

    filePages.forEach((el, i) => {
      el.classList.remove("measuring");
      el.querySelector(".df-page-no").textContent = `Page ${i + 1} of ${filePages.length}`;
      el.style.setProperty("--tilt", FILE_TILT[i % FILE_TILT.length] + "deg");
      el.addEventListener("click", (e) => {
        if (e.target.closest("a, button")) return;
        if (el.classList.contains("off")) setFilePage(filePage - 1);
        else if (i === filePage) setFilePage(filePage + 1);
      });
    });
    fileDirty = false;
    setFilePage(filePage, true);
  }

  function setFilePage(n, instant) {
    if (!filePages.length) return;
    filePage = Math.max(0, Math.min(filePages.length - 1, n));
    fileStack.classList.toggle("on-last", filePage === filePages.length - 1); // no spare sheets under the last page
    filePages.forEach((el, i) => {
      const off = i < filePage;
      const comingBack = !instant && el.classList.contains("off") && !off;
      el.classList.toggle("off", off);
      el.classList.toggle("clickable", (off && i === filePage - 1) || (!off && i === filePage && i < filePages.length - 1));
      const z = off ? 100 + i : 50 - i;
      if (comingBack) {
        el.style.zIndex = 250; // stays on top while it slides back
        setTimeout(() => (el.style.zIndex = el.classList.contains("off") ? 100 + i : 50 - i), FILE_SLIDE);
      } else el.style.zIndex = z;
      if (instant) {
        el.style.transition = "none";
        requestAnimationFrame(() => requestAnimationFrame(() => (el.style.transition = "")));
      }
    });
    $("file-prev").disabled = filePage === 0;
    $("file-next").disabled = filePage === filePages.length - 1;
  }
  $("file-prev").addEventListener("click", () => setFilePage(filePage - 1));
  $("file-next").addEventListener("click", () => setFilePage(filePage + 1));

  // new screen size = new page breaks (keeps roughly the same place)
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      fileDirty = true;
      paginateFile();
    }, 200);
  });
  // A case (or a person in it) can have a different version per difficulty:
  // versions: { easy: {...}, medium: {...}, hard: {...} } overrides the normal fields.
  const caseView = () => ({ ...caseData, ...((caseData.versions || {})[draft.difficulty] || {}) });
  const personView = (s) => ({ ...s, ...((s.versions || {})[draft.difficulty] || {}) });

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
    const src = s.image || spriteFor(s.name); // shared sprite list in main.js
    if (src) return `<img class="dl-sprite" src="${src}" alt="${escapeHtml(s.name)}" style="--fx: ${spriteFocus(s.name)}; --zoom: ${spriteZoom(s.name)}; ${spriteMove(s.name)} ${spriteFile(s.name)}" />`;
    // placeholder figure (head + shoulders)
    return `<svg viewBox="0 0 60 80" aria-hidden="true">
      <circle cx="30" cy="26" r="11" fill="none" stroke="currentColor" stroke-width="4"/>
      <path d="M10 74 Q10 46 30 46 Q50 46 50 74" fill="none" stroke="currentColor" stroke-width="4"/>
    </svg>`;
  }

  // "{count}" -> Three / Four / Five (people shown on this difficulty), **text** -> bold
  const NUMBER_WORDS = { 3: "Three", 4: "Four", 5: "Five" };
  function fillText(t) {
    const n = activeSuspects().length;
    return escapeHtml(t.replace("{count}", NUMBER_WORDS[n] || n)).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  function renderInvestigation() {
    const cv = caseView();
    $("case-question").textContent = cv.question;

    // case file: report and evidence as blocks; paginateFile() pours them onto sheets
    fileBlocks = {
      report: cv.report.map((t) => `<p>${fillText(t)}</p>`),
      evidence: cv.evidence.map((ev) => {
        const body = ev.lines
          ? `<ul>${ev.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`
          : `<p>${escapeHtml(ev.text)}</p>`;
        const note = ev.note ? `<p class="dl-ev-note">${escapeHtml(ev.note)}</p>` : "";
        return `<div class="dl-evidence"><h3>${escapeHtml(ev.label)}</h3>${body}${note}</div>`;
      }),
    };
    filePage = 0;
    fileDirty = true;
    paginateFile();

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

  function openSuspect(person) {
    currentSuspect = person;
    const s = personView(person);
    const left = $("suspect-left");
    left.innerHTML = `<div class="dl-portrait big">${portrait(s)}</div><h2></h2><p class="muted"></p>`;
    left.querySelector("h2").textContent = s.name;
    left.querySelector(".muted").textContent = s.role;

    // interview log: the detective's question + their answer
    const answer = s.a + (draft.difficulty === "hard" && s.hardExtra ? " " + s.hardExtra : "");
    const firstName = s.name.split(" ")[0];
    const right = $("suspect-right");
    right.innerHTML = `<h2>Interview Log</h2>
      <p class="dl-q"><strong>Detective:</strong> ${escapeHtml(s.q)}</p>
      <p class="dl-a"><strong>${escapeHtml(firstName)}:</strong> ${escapeHtml(answer)}</p>`;
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
    $("answer-question").textContent = caseView().question;
    $("answer-instructions").textContent = caseView().instructions;
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
      suspectPts: correct ? MAX_PICK : 0,
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
      const g = await gradeReasoning({ caseData: caseView(), suspectId: result.suspect, reasoning: result.reasoning });
      result.reasoningPts = g.score === null ? null : Math.max(0, Math.min(MAX_REASON, Math.round(g.score)));
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
    const correct = r.suspectPts === MAX_PICK;

    $("result-title").textContent = r.grading ? "Grading…" : correct ? "Case Closed" : "Not quite, detective";

    const reasoningLine = r.grading
      ? "grading…"
      : r.reasoningPts === null
      ? `– / ${MAX_REASON} (pending)`
      : `${r.reasoningPts} / ${MAX_REASON}`;

    body.innerHTML = `
      <table>
        <tr><th>Case</th><td>#${r.caseNumber} · ${capitalise(r.difficulty)}</td></tr>
        <tr><th>Question</th><td>${escapeHtml(caseData.question)}</td></tr>
        <tr><th>You chose</th><td>${escapeHtml(nameOf(r.suspect))} ${correct ? "✓" : "✗"}</td></tr>
        <tr><th>Right person</th><td>${r.suspectPts} / ${MAX_PICK}</td></tr>
        <tr><th>Reasoning</th><td>${reasoningLine}</td></tr>
        <tr class="total"><th>Total</th><td>${r.grading ? "…" : total(r) + " / " + MAX_TOTAL}</td></tr>
      </table>
      ${correct ? "" : `<p>The answer was <strong>${escapeHtml(nameOf(caseData.culprit))}</strong>.</p>`}
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
      `Effective Detective · Case #${r.caseNumber} (${capitalise(r.difficulty)})\n` +
      `Right person: ${r.suspectPts === MAX_PICK ? "✅" : "❌"}\n` +
      `Reasoning: ${r.reasoningPts === null ? "?" : r.reasoningPts}/${MAX_REASON}\n` +
      `Score: ${total(r)}/${MAX_TOTAL}`;
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
        localStorage.removeItem(KEY_PICK); // pick a different case
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

  // Left / right arrows = turn the case file's pages / previous / next suspect
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (!$("screen-investigate").hidden && !$("view-file").hidden && !document.querySelector("dialog[open]")) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      return setFilePage(filePage + (e.key === "ArrowRight" ? 1 : -1));
    }
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

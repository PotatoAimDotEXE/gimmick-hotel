/* =========================================================
   DETECTIVE LIE DETECTOR – game logic
   Flow: Menu -> Classified folder (+difficulty) -> Case file
         <-> Suspects <-> Suspect file -> Answer -> Result
   Case of the Day: one attempt per day, saved in localStorage.
   Your in-progress answer is saved as you type, so closing the
   pop-up, switching pages or even refreshing keeps it.
   ========================================================= */

(function () {
  Sound.music("detective-bg.mp3", 0.23); // background music for this game

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
  devCasePicker({ where: document.getElementById("screen-menu"), cases: CASES, currentId: caseData.id, pickKey: KEY_PICK, clearKeys: [KEY_RESULT, KEY_DRAFT] });

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
  const screens = ["menu", "folder", "debrief", "investigate", "result"];

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
      draft.debriefDone ? goInvestigate() : openDebrief();
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
    draft.debriefDone ? goInvestigate() : openDebrief();
  });

  function goInvestigate() {
    showScreen("investigate");
    showView("file");
  }

  /* ---------------- 2b. Debrief: John D'Brief explains how to play ----------------
     Same as the paralegal debrief: the picture switches on like an old TV,
     he talks one line at a time (one pose change per line), Skip / Next / Enter,
     then the picture switches off and the case file opens. */
  const DEBRIEF_LINES = [
    "Evening, detective. I'm John D'Brief. I usually carry bags, but tonight I'm briefing you.",
    "Every case asks one question. You'll see it on the banner at the top of the file.",
    "Start with the case file: read the report, then every piece of evidence. Use the arrows to turn the pages.",
    "Next, open People of interest and read each interview. Check what people say against what the evidence shows.",
    "When you're ready, press Answer. Pick a person, then explain why: quote what they said and name the evidence that proves your point.",
    "You only get one try per case, so take your time. Good luck, detective.",
  ];
  const TYPE_SPEED = 22; // ms per letter
  const CRT_ON = 550;    // ms, matches crt-on in paralegal.css
  const CRT_OFF = 420;   // ms, matches crt-off
  const debriefScreen = $("screen-debrief");
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lineIdx = 0;
  let typing = false;
  let typeTimer = null;
  let crtBusy = false;
  let crtTimer = null;

  const poses = [...document.querySelectorAll("#john .pose")];
  let pose = 0;
  function showPose(i) {
    pose = i;
    poses.forEach((p, k) => p.classList.toggle("on", k === i));
  }
  function startTalking() {
    if (lineIdx === 0) return showPose(0); // first line: hand-on-chest pose
    let next = pose;
    while (next === pose) next = Math.floor(Math.random() * poses.length); // a different pose
    showPose(next);
  }

  function openDebrief() {
    lineIdx = 0;
    $("debrief-line").textContent = "";
    showScreen("debrief");
    if (reducedMotion()) return typeLine();
    crtBusy = true;
    debriefScreen.classList.remove("crt-on", "crt-off");
    void debriefScreen.offsetWidth; // restart the animation
    debriefScreen.classList.add("crt-on");
    clearTimeout(crtTimer);
    crtTimer = setTimeout(() => {
      crtBusy = false;
      debriefScreen.classList.remove("crt-on");
      typeLine(); // he starts talking once the picture is up
    }, CRT_ON);
  }

  function typeLine() {
    const full = DEBRIEF_LINES[lineIdx];
    startTalking();
    const el = $("debrief-line");
    $("debrief-progress").textContent = `${lineIdx + 1}/${DEBRIEF_LINES.length}`;
    el.textContent = "";
    typing = true;
    let i = 0;
    clearInterval(typeTimer);
    typeTimer = setInterval(() => {
      el.textContent = full.slice(0, ++i);
      if (i >= full.length) finishTyping();
    }, TYPE_SPEED);
  }

  function finishTyping() {
    clearInterval(typeTimer);
    $("debrief-line").textContent = DEBRIEF_LINES[lineIdx];
    typing = false;
  }

  function debriefNext() {
    if (crtBusy) return;
    if (typing) return finishTyping();
    if (++lineIdx >= DEBRIEF_LINES.length) return endDebrief();
    typeLine();
  }

  function endDebrief() {
    if (crtBusy && debriefScreen.classList.contains("crt-off")) return; // already switching off
    clearInterval(typeTimer);
    clearTimeout(crtTimer);
    typing = false;
    draft.debriefDone = true;
    saveDraft();
    if (reducedMotion()) return goInvestigate();
    crtBusy = true;
    debriefScreen.classList.remove("crt-on");
    void debriefScreen.offsetWidth;
    debriefScreen.classList.add("crt-off");
    crtTimer = setTimeout(() => {
      crtBusy = false;
      debriefScreen.classList.remove("crt-off");
      goInvestigate();
    }, CRT_OFF);
  }

  $("btn-debrief-next").addEventListener("click", (e) => {
    e.currentTarget.blur();
    debriefNext();
  });
  $("btn-skip").addEventListener("click", endDebrief);
  $("btn-replay").addEventListener("click", (e) => {
    e.currentTarget.blur();
    openDebrief(); // afterwards it comes back to the case file, on the same page
  });
  $("debrief-box").addEventListener("click", () => typing && finishTyping());
  document.addEventListener("keydown", (e) => {
    if (debriefScreen.hidden || document.querySelector("dialog[open]")) return;
    if (["Enter", " ", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      debriefNext();
    }
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
    // the rows carried over keep their list / table (with its header row)
    const wrapRows = (list, rows) => {
      if (list.tagName !== "TBODY") return `<ul>${rows}</ul>`;
      const table = list.closest("table");
      return `<table class="${table.className}">${table.tHead ? table.tHead.outerHTML : ""}<tbody>${rows}</tbody></table>`;
    };
    const splitLongEvidence = (sheet, contHead) => {
      const ev = sheet.lastElementChild;
      const list = ev && (ev.querySelector("ul") || ev.querySelector("tbody")); // a list, or a table's rows
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
        `<div class="dl-evidence"><h3>${escapeHtml(title)} <small>(continued)</small></h3>${wrapRows(list, moved.join(""))}${noteHtml}</div>`
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

  // lay a pile of sheets out: sheets before idx lie on the left flap (read),
  // the rest are piled on the right with sheet idx on top
  function layStack(sheets, idx, instant) {
    sheets.forEach((el, i) => {
      const off = i < idx;
      const comingBack = !instant && el.classList.contains("off") && !off;
      el.classList.toggle("off", off);
      el.classList.toggle("clickable", (off && i === idx - 1) || (!off && i === idx && i < sheets.length - 1));
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
  }

  function setFilePage(n, instant) {
    if (!filePages.length) return;
    const before = filePage;
    filePage = Math.max(0, Math.min(filePages.length - 1, n));
    if (!instant && filePage !== before) Sound.flip();
    fileStack.classList.toggle("on-last", filePage === filePages.length - 1); // no spare sheets under the last page
    layStack(filePages, filePage, instant);
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

  // one piece of evidence: a quote, list, table, form, chat, receipt, sign or picture (see cases.js)
  function evidenceBody(ev) {
    const e = escapeHtml;
    if (ev.table) {
      const head = ev.table.head.map((h) => `<th>${e(h)}</th>`).join("");
      const rows = ev.table.rows.map((r) => `<tr>${r.map((c) => `<td>${e(c)}</td>`).join("")}</tr>`).join("");
      return `<table class="ev-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    if (ev.form) {
      return `<dl class="ev-form">${ev.form.map(([k, v]) => `<dt>${e(k)}</dt><dd>${e(v)}</dd>`).join("")}</dl>`;
    }
    if (ev.chat) {
      return `<div class="ev-chat">${ev.chat
        .map((m) => `<div class="ev-msg"><p class="ev-from">${e(m.from)}<span>${e(m.time || "")}</span></p><p class="ev-bubble">${e(m.text)}</p></div>`)
        .join("")}</div>`;
    }
    if (ev.receipt) {
      return `<div class="ev-receipt">${ev.receipt.map((l) => `<p>${e(l)}</p>`).join("")}</div>`;
    }
    if (ev.notice) return `<div class="ev-notice"><p>${e(ev.notice)}</p></div>`;
    if (ev.picture) {
      const pic = ev.image
        ? `<img class="ev-img" src="${ev.image}" alt="${e(ev.picture)}" />`
        : `<div class="ev-pic-slot"><span>[ picture ]</span><p>${e(ev.picture)}</p></div>`;
      return `<figure class="ev-picture">${pic}${ev.caption ? `<figcaption>${e(ev.caption)}</figcaption>` : ""}</figure>`;
    }
    if (ev.lines) return `<ul>${ev.lines.map((l) => `<li>${e(l)}</li>`).join("")}</ul>`;
    return `<p>${e(ev.text || "")}</p>`;
  }

  // the same evidence as plain text, for the AI grader
  function evidencePlain(ev) {
    if (ev.table) return ev.table.rows.map((r) => r.map((c, i) => `${ev.table.head[i]}: ${c}`).join("; "));
    if (ev.form) return ev.form.map(([k, v]) => `${k}: ${v}`);
    if (ev.chat) return ev.chat.map((m) => `${m.from} (${m.time}): “${m.text}”`);
    if (ev.receipt) return [ev.receipt.join(" – ")];
    if (ev.notice) return [`Sign: “${ev.notice}”`];
    if (ev.picture) return [`Picture: ${ev.picture}.` + (ev.caption ? " " + ev.caption : "")];
    if (ev.lines) return ev.lines;
    return [ev.text || ""];
  }

  // click an evidence picture to see it big (the floor plan's labels are small on the sheet)
  const picDialog = document.createElement("dialog");
  picDialog.className = "modal ev-zoom";
  picDialog.innerHTML = `<img alt="" /><p class="ev-zoom-cap"></p><form method="dialog"><button>Close (Esc)</button></form>`;
  document.body.appendChild(picDialog);
  picDialog.addEventListener("click", (e) => e.target === picDialog && picDialog.close());
  document.addEventListener(
    "click",
    (e) => {
      const img = e.target.closest(".df-page .ev-img");
      if (!img || img.closest(".df-page.off")) return;
      e.stopPropagation();
      picDialog.querySelector("img").src = img.src;
      picDialog.querySelector("img").alt = img.alt;
      picDialog.querySelector(".ev-zoom-cap").textContent = img.closest(".dl-evidence").querySelector("h3").textContent;
      picDialog.showModal();
    },
    true
  );

  function renderInvestigation() {
    const cv = caseView();
    $("case-question").textContent = cv.question;

    // case file: report and evidence as blocks; paginateFile() pours them onto sheets
    fileBlocks = {
      report: cv.report.map((t) => `<p>${fillText(t)}</p>`),
      evidence: cv.evidence.map((ev) => {
        const body = evidenceBody(ev);
        const note = ev.note ? `<p class="dl-ev-note">${escapeHtml(ev.note)}</p>` : "";
        return `<div class="dl-evidence"><h3>${escapeHtml(ev.label)}</h3>${body}${note}</div>`;
      }),
    };
    filePage = 0;
    fileDirty = true;
    paginateFile();
    peopleBuilt = false; // people sheets are rebuilt for this case / difficulty

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

  /* People of interest folder: one sheet per person (interview at the top,
     portrait + name at the bottom). The person in focus is on the pile. */
  const peopleStack = $("people-stack");
  let peopleSheets = [];
  let personIdx = 0;
  let peopleBuilt = false;

  function buildPeopleSheets() {
    peopleSheets.forEach((el) => el.remove());
    peopleSheets = [];
    const list = activeSuspects();
    list.forEach((person, i) => {
      const s = personView(person);
      const answer = s.a + (draft.difficulty === "hard" && s.hardExtra ? " " + s.hardExtra : "");
      const firstName = s.name.split(" ")[0];
      const el = document.createElement("article");
      el.className = "df-page dl-person-sheet";
      el.innerHTML = `<p class="df-page-no">Person ${i + 1} of ${list.length}</p>
        <h2>Interview Log</h2>
        <div class="dl-interview">
          <p class="dl-q"><strong>Detective:</strong> ${escapeHtml(s.q)}</p>
          <p class="dl-a"><strong>${escapeHtml(firstName)}:</strong> ${escapeHtml(answer)}</p>
        </div>
        <div class="dl-person-foot">
          <div class="dl-portrait big dl-portrait-sheet">${portrait(s)}</div>
          <div class="dl-person-id"><h3></h3><p></p></div>
        </div>`;
      el.querySelector(".dl-person-id h3").textContent = s.name;
      el.querySelector(".dl-person-id p").textContent = s.role;
      el.style.setProperty("--tilt", FILE_TILT[(i + 2) % FILE_TILT.length] + "deg");
      el.addEventListener("click", (e) => {
        if (e.target.closest("a, button")) return;
        if (el.classList.contains("off")) setPerson(personIdx - 1);
        else if (i === personIdx) setPerson(personIdx + 1);
      });
      peopleStack.appendChild(el);
      peopleSheets.push(el);
    });
    peopleBuilt = true;
  }

  function setPerson(n, instant) {
    if (!peopleSheets.length) return;
    const before = personIdx;
    personIdx = Math.max(0, Math.min(peopleSheets.length - 1, n));
    if (!instant && personIdx !== before) Sound.flip();
    currentSuspect = activeSuspects()[personIdx];
    layStack(peopleSheets, personIdx, instant);
    $("people-prev").disabled = personIdx === 0;
    $("people-next").disabled = personIdx === peopleSheets.length - 1;
  }
  $("people-prev").addEventListener("click", () => setPerson(personIdx - 1));
  $("people-next").addEventListener("click", () => setPerson(personIdx + 1));

  // shrink a sheet's interview text step by step until it fits (no scrolling)
  function fitPeopleSheets() {
    peopleSheets.forEach((el) => {
      const box = el.querySelector(".dl-interview");
      let size = 0.82;
      box.style.fontSize = size + "rem";
      while (box.scrollHeight > box.clientHeight + 1 && size > 0.64) {
        size = Math.round((size - 0.02) * 100) / 100;
        box.style.fontSize = size + "rem";
      }
    });
  }
  window.addEventListener("resize", () => !$("view-suspect").hidden && fitPeopleSheets());

  // from the People of interest board: open the folder at that person's sheet
  function openSuspect(person) {
    if (!peopleBuilt) buildPeopleSheets();
    showView("suspect");
    fitPeopleSheets();
    setPerson(activeSuspects().findIndex((s) => s.id === person.id), true);
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
      const g = await gradeReasoning({ caseData: caseView(), suspectId: result.suspect, reasoning: result.reasoning, context: gradingContext(result) });
      result.reasoningPts = g.score === null || g.score === undefined ? null : Math.max(0, Math.min(MAX_REASON, Math.round(g.score)));
      result.feedback = g.feedback || "";
      result.criteria = g.criteria || [];
    } catch {
      result.feedback = "Couldn't reach the grader. Reasoning not scored.";
    }
    result.grading = false;
    Store.safeSet(KEY_RESULT, result);
    Store.addScore("detective", total(result));
    if (!$("screen-result").hidden) showResult();
    else renderMenu();
  }

  // the case exactly as this player saw it, for the AI grader
  function gradingContext(result) {
    const cv = caseView();
    const n = activeSuspects().length;
    const plain = (t) => String(t).replace("{count}", NUMBER_WORDS[n] || n).replace(/\*\*(.+?)\*\*/g, "$1");
    return {
      title: caseData.title,
      report: cv.report.map(plain),
      evidence: cv.evidence.map((ev) => ({ label: ev.label, text: "", lines: evidencePlain(ev), note: ev.note || "" })),
      people: activeSuspects().map((p) => {
        const s = personView(p);
        return { name: s.name, role: s.role, question: s.q, answer: s.a + (draft.difficulty === "hard" && s.hardExtra ? " " + s.hardExtra : "") };
      }),
      question: cv.question,
      instructions: cv.instructions,
      culprit: nameOf(caseData.culprit),
      chosen: nameOf(result.suspect),
    };
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
      ${
        r.criteria && r.criteria.length
          ? `<details><summary>Reasoning breakdown</summary><ul class="dl-criteria">${r.criteria
              .map((c, i) => {
                const what = ((caseView().rubric || [])[i] || {}).criterion || "";
                return `<li><strong>${c.points}/${c.max}</strong> ${escapeHtml(what)}${c.feedback ? `<br /><em>${escapeHtml(c.feedback)}</em>` : ""}</li>`;
              })
              .join("")}</ul></details>`
          : ""
      }
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
    if (!$("screen-debrief").hidden) return endDebrief(); // Esc = skip the debrief
    if (!$("screen-investigate").hidden && !$("view-suspect").hidden) return showView("suspects");
    if (!$("screen-menu").hidden) return leavePage("../hallway.html");
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
    setPerson(personIdx + (e.key === "ArrowRight" ? 1 : -1));
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

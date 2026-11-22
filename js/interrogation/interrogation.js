/* =========================================================
   INTERROGATION ROOM – game logic
   Flow: Room menu (difficulty on the CRT) -> Instructions +
         case file -> Interrogation (statements one by one,
         FLAG or NEXT, no going back) -> Result
   Log of the Day: one attempt per day, saved in localStorage.
   Progress is saved after every statement, so leaving or
   refreshing can't be used to undo a choice.
   ========================================================= */

(function () {
  /* ---------------- Today's log ---------------- */
  const START_DATE = new Date(2026, 10, 1); // 1 Nov 2026 = log #101 (change freely)
  const dayIndex = Daily.daysSince(START_DATE);
  const log = LOGS[dayIndex % LOGS.length];
  const logNumber = 101 + dayIndex;

  const KEY_RESULT = "er_interro_result_" + Daily.key();
  const KEY_DRAFT = "er_interro_draft_" + Daily.key();

  const LIES = { easy: 1, medium: 1, hard: 2 };
  const TYPE_SPEED = 28; // ms per letter for the typewriter effect

  let draft = Store.safeGet(KEY_DRAFT, null) || {
    difficulty: "easy",
    started: false, // started -> difficulty locked
    index: 0, // which statement we're on
    flags: [], // indexes of statements flagged as lies
  };

  const $ = (id) => document.getElementById(id);
  const saveDraft = () => Store.safeSet(KEY_DRAFT, draft);
  const getResult = () => Store.safeGet(KEY_RESULT, null);
  const statements = () => log.statements[draft.difficulty];
  const flagsLeft = () => LIES[draft.difficulty] - draft.flags.length;

  $("topbar-log").textContent = "Log #" + logNumber;
  $("crt-log-no").textContent = logNumber;

  /* ---------------- Screens ---------------- */
  const screens = ["menu", "brief", "room"];
  function showScreen(name) {
    document.querySelectorAll("dialog[open]").forEach((d) => d.close());
    screens.forEach((s) => ($("screen-" + s).hidden = s !== name));
    if (name === "menu") renderMenu();
  }
  document.querySelectorAll("[data-go]").forEach((b) =>
    b.addEventListener("click", () => showScreen(b.dataset.go))
  );

  /* ---------------- 1. Room menu ---------------- */
  const diffButtons = [...document.querySelectorAll("[data-diff]")];

  function renderMenu() {
    const result = getResult();
    const locked = draft.started || !!result;

    diffButtons.forEach((b) => {
      const on = b.dataset.diff === draft.difficulty;
      b.setAttribute("aria-checked", on);
      b.classList.toggle("on", on);
      b.disabled = locked && !on;
    });
    $("crt-sub").textContent = locked ? "DIFFICULTY LOCKED FOR TODAY" : "SELECT DIFFICULTY";

    $("btn-daily").textContent = result
      ? "Log of the Day ✓ (view result)"
      : draft.started
      ? "Log of the Day (continue)"
      : "Log of the Day";
  }

  function setDifficulty(d) {
    if (draft.started || getResult()) return;
    draft.difficulty = d;
    saveDraft();
    renderMenu();
  }
  diffButtons.forEach((b) =>
    b.addEventListener("click", () => {
      b.blur(); // so Enter/arrows after a click don't re-press this button
      setDifficulty(b.dataset.diff);
    })
  );

  $("btn-daily").addEventListener("click", () => {
    if (getResult()) return showResult();
    if (draft.started) return enterRoom();
    renderBrief();
    showScreen("brief");
  });

  document.querySelectorAll("[data-soon]").forEach((b) =>
    b.addEventListener("click", () => ($("menu-note").textContent = b.dataset.soon + " is coming soon."))
  );

  /* ---------------- 2. Instructions + case file ---------------- */
  function fillPage(el, blocks) {
    el.innerHTML = "";
    blocks.forEach(({ heading, body }) => {
      const h = document.createElement("h2");
      h.textContent = heading;
      el.appendChild(h);
      body.forEach((t) => {
        const p = document.createElement("p");
        p.textContent = t;
        el.appendChild(p);
      });
    });
  }

  function renderBrief() {
    const n = statements().length;
    const lies = LIES[draft.difficulty];
    fillPage($("brief-left"), [
      {
        heading: "Instructions",
        body: [
          "Welcome to the interrogation room. Read the case file carefully: it tells you what really happened.",
          `You will interrogate ${log.suspect}. They will make ${n} statements, one at a time. ${lies === 1 ? "One of them is a lie." : lies + " of them are lies."}`,
          `Press FLAG when you hear a lie, or NEXT to let it pass. You have ${lies} flag${lies === 1 ? "" : "s"}.`,
          "⚠ WARNING: there is no going back to a previous statement.",
          "You can click the TV during the interrogation to read the case file again.",
        ],
      },
    ]);
    fillPage($("brief-right"), [log.briefing.left, log.briefing.right]);
  }

  $("btn-start").addEventListener("click", () => {
    draft.started = true;
    saveDraft();
    enterRoom();
  });

  /* ---------------- 3. Interrogation ---------------- */
  let typing = false;
  let busy = false; // during the FLAGGED stamp
  let typeTimer = null;
  let fullText = "";

  function portrait() {
    if (log.image) return `<img src="${log.image}" alt="" />`;
    return `<svg viewBox="0 0 120 120">
      <circle cx="60" cy="42" r="22" fill="none" stroke="currentColor" stroke-width="5"/>
      <path d="M18 120 Q18 74 60 74 Q102 74 102 120" fill="none" stroke="currentColor" stroke-width="5"/>
    </svg>`;
  }

  function setupRoom() {
    $("tv-summary").textContent = log.summary;
    $("speaker").textContent = log.suspect;
    $("suspect-figure").innerHTML = portrait();
    fillPage($("zoom-left"), [log.briefing.left]);
    fillPage($("zoom-right"), [log.briefing.right]);
    showScreen("room");
  }

  function enterRoom() {
    setupRoom();
    if (draft.index >= statements().length) return finish();
    busy = false;
    showLine();
  }

  function updateStatus() {
    $("st-num").textContent = Math.min(draft.index + 1, statements().length);
    $("st-total").textContent = statements().length;
    $("flags-left").textContent = flagsLeft();
  }

  function setButtons() {
    const locked = typing || busy;
    $("btn-next").disabled = locked;
    $("btn-flag").disabled = locked || flagsLeft() <= 0;
    $("more").hidden = typing;
  }

  function showLine() {
    updateStatus();
    fullText = statements()[draft.index].text;
    const line = $("line");
    line.textContent = "";
    typing = true;
    setButtons();
    let i = 0;
    clearInterval(typeTimer);
    typeTimer = setInterval(() => {
      line.textContent = fullText.slice(0, ++i);
      if (i >= fullText.length) finishTyping();
    }, TYPE_SPEED);
  }

  function finishTyping() {
    clearInterval(typeTimer);
    $("line").textContent = fullText;
    typing = false;
    setButtons();
  }

  function next() {
    if (typing || busy) return;
    draft.index++;
    saveDraft();
    afterChoice();
  }

  function flag() {
    if (typing || busy || flagsLeft() <= 0) return;
    draft.flags.push(draft.index);
    draft.index++;
    saveDraft(); // saved straight away, so refreshing can't undo it
    busy = true;
    setButtons();
    $("flags-left").textContent = flagsLeft();
    $("stamp").hidden = false;
    setTimeout(() => {
      $("stamp").hidden = true;
      busy = false;
      afterChoice();
    }, 800);
  }

  function afterChoice() {
    if (draft.index >= statements().length) finish();
    else showLine();
  }

  $("btn-next").addEventListener("click", (e) => { e.currentTarget.blur(); next(); });
  $("btn-flag").addEventListener("click", (e) => { e.currentTarget.blur(); flag(); });
  $("dialogue").addEventListener("click", () => typing && finishTyping()); // click to skip typing

  // TV = zoom into the case file
  const tvDialog = $("tv-dialog");
  $("btn-tv").addEventListener("click", (e) => { e.currentTarget.blur(); tvDialog.showModal(); });
  tvDialog.addEventListener("click", (e) => e.target === tvDialog && tvDialog.close());

  /* ---------------- 4. Result ---------------- */
  function finish() {
    const list = statements();
    const lieIdx = list.map((s, i) => (s.lie ? i : -1)).filter((i) => i >= 0);
    const caught = draft.flags.filter((i) => lieIdx.includes(i)).length;
    // score = statements called correctly (flagged a lie / let a truth pass), out of 3, 4 or 5
    const correct = list.filter((s, i) => draft.flags.includes(i) === !!s.lie).length;
    const result = {
      logId: log.id,
      logNumber,
      difficulty: draft.difficulty,
      flags: draft.flags,
      caught,
      lies: lieIdx.length,
      score: correct,
      total: list.length,
    };
    Store.safeSet(KEY_RESULT, result);
    Store.addScore("interrogation", result.score);
    showResult();
  }

  const resultDialog = $("result-dialog");

  function showResult() {
    const r = getResult();
    const list = log.statements[r.difficulty];

    // the interrogation room stays in the background, dimmed behind the pop-up
    setupRoom();
    clearInterval(typeTimer);
    typing = false;
    busy = true; // room is finished: FLAG / NEXT stay off
    $("line").textContent = "— End of interrogation —";
    $("st-num").textContent = list.length;
    $("st-total").textContent = list.length;
    $("flags-left").textContent = Math.max(0, r.lies - r.flags.length);
    setButtons();
    resultDialog.showModal();

    $("result-title").textContent =
      r.caught === r.lies ? "Lie detected!" : r.caught > 0 ? "Partly caught" : "The lie slipped past you";

    const rows = list
      .map((s, i) => {
        const flagged = r.flags.includes(i);
        const right = flagged === !!s.lie;
        return `<tr class="${right ? "" : "wrong"}">
          <td>${i + 1}</td>
          <td class="ir-quote">“${escapeHtml(s.text)}”</td>
          <td>${flagged ? "⚑ Flagged" : "Passed"}</td>
          <td>${s.lie ? "<strong>LIE</strong>" : "True"}</td>
          <td>${right ? "✓" : "✗"}</td>
        </tr>`;
      })
      .join("");

    $("result-body").innerHTML = `
      <p>Log #${r.logNumber} · ${r.difficulty.charAt(0).toUpperCase() + r.difficulty.slice(1)}</p>
      <table>
        <tr><th>#</th><th>Statement</th><th>You</th><th>Truth</th><th></th></tr>
        ${rows}
      </table>
      <p class="ir-total">Score: ${r.score}/${r.total} · Lies caught: ${r.caught}/${r.lies}</p>
    `;
    $("result-next").textContent = "Next log in " + Daily.timeLeft() + ".";
    $("btn-copy").textContent = "Copy result";
  }

  // Closing the result pop-up (Esc, click outside) goes back to the room menu
  resultDialog.addEventListener("close", () => {
    if (!$("screen-room").hidden) showScreen("menu");
  });
  resultDialog.addEventListener("click", (e) => e.target === resultDialog && resultDialog.close());

  $("btn-copy").addEventListener("click", async (e) => {
    const r = getResult();
    if (!r) return;
    const list = log.statements[r.difficulty];
    const squares = list.map((s, i) => (r.flags.includes(i) === !!s.lie ? "🟩" : "🟥")).join("");
    const text =
      `Interrogation Room · Log #${r.logNumber} (${r.difficulty})\n${squares}\n` +
      `Score: ${r.score}/${r.total} · Lies caught: ${r.caught}/${r.lies}`;
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
  // Esc = back: interrogation/briefing/result -> room menu -> hallway
  // (leaving the interrogation keeps your place; you still can't go back a statement)
  onEscape(() => {
    if (!$("screen-menu").hidden) return (location.href = "../hallway.html");
    clearInterval(typeTimer);
    typing = false;
    showScreen("menu");
  });

  document.addEventListener("keydown", (e) => {
    if (document.querySelector("dialog[open]")) return;

    // Room menu: up/down arrows pick difficulty on the CRT
    if (!$("screen-menu").hidden && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const order = ["easy", "medium", "hard"];
      const i = order.indexOf(draft.difficulty) + (e.key === "ArrowDown" ? 1 : -1);
      if (i >= 0 && i < order.length) setDifficulty(order[i]);
      return;
    }

    if ($("screen-room").hidden || getResult()) return;
    const k = e.key.toLowerCase();
    if (k === "enter" || k === " " || k === "arrowright") {
      e.preventDefault();
      typing ? finishTyping() : next();
    } else if (k === "f") {
      e.preventDefault();
      if (!typing) flag();
    } else if (k === "c") {
      tvDialog.showModal(); // C = case file
    }
  });

  /* ---------------- Start ---------------- */
  showScreen("menu");
})();

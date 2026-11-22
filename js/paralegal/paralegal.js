/* =========================================================
   PARANORMAL PARALEGAL – game logic
   Flow: Case file cover (difficulty) -> Jane's debrief
         (skippable) -> open folder with a pile of pages
         (next = page slides off, prev = page comes back) ->
         last page: title + description -> confirm submit ->
         pages stack up, cover swings shut, CASE CLOSED stamp
   Case of the Day: one attempt per day, saved in localStorage.
   ========================================================= */

(function () {
  /* ---------------- Today's case ---------------- */
  const START_DATE = new Date(2026, 10, 1); // 1 Nov 2026 = case #101 (change freely)
  const dayIndex = Daily.daysSince(START_DATE);
  const caseData = PARALEGAL_CASES[dayIndex % PARALEGAL_CASES.length];
  const caseNumber = 101 + dayIndex;

  const KEY_RESULT = "er_para_result_" + Daily.key();
  const KEY_DRAFT = "er_para_draft_" + Daily.key();
  const PAGES = { easy: 3, medium: 4, hard: 5 };
  const TYPE_SPEED = 22;

  let draft = Store.safeGet(KEY_DRAFT, null) || {
    difficulty: "easy",
    started: false, // started -> difficulty locked
    debriefDone: false,
    page: 0, // which page is on top
    title: "",
    description: "",
    submitted: false,
  };

  const $ = (id) => document.getElementById(id);
  const saveDraft = () => Store.safeSet(KEY_DRAFT, draft);
  const getResult = () => Store.safeGet(KEY_RESULT, null);
  const infoPages = () => caseData.pages.slice(0, PAGES[draft.difficulty]);
  const totalPages = () => infoPages().length + 1; // + the answer sheet

  $("topbar-case").textContent = "Case #" + caseNumber;
  $("cover-case").textContent = `CASE #${caseNumber} · ${Daily.pretty()}`;
  $("flap-case").textContent = `#${caseNumber} · ${Daily.pretty()}`;

  /* ---------------- Screens ---------------- */
  const screens = ["cover", "debrief", "desk"];
  function showScreen(name) {
    screens.forEach((s) => ($("screen-" + s).hidden = s !== name));
    if (name === "cover") renderCover();
  }
  document.querySelectorAll("[data-go]").forEach((b) =>
    b.addEventListener("click", () => !closing && showScreen(b.dataset.go))
  );

  /* ---------------- 1. Cover ---------------- */
  const diffButtons = [...document.querySelectorAll("[data-diff]")];

  function renderCover() {
    const result = getResult();
    const locked = draft.started || !!result;
    diffButtons.forEach((b) => {
      const on = b.dataset.diff === draft.difficulty;
      b.classList.toggle("on", on);
      b.setAttribute("aria-checked", on);
      b.disabled = locked && !on;
    });
    $("diff-label").textContent = locked ? "difficulty locked for today" : "select difficulty";
    $("btn-daily").textContent = result
      ? "Case of the Day ✓"
      : draft.started
      ? "Case of the Day (continue)"
      : "Case of the Day";
  }

  function setDifficulty(d) {
    if (draft.started || getResult()) return;
    draft.difficulty = d;
    saveDraft();
    renderCover();
  }
  diffButtons.forEach((b) =>
    b.addEventListener("click", () => {
      b.blur();
      setDifficulty(b.dataset.diff);
    })
  );

  $("btn-daily").addEventListener("click", () => {
    if (getResult() || draft.submitted) return openDesk();
    if (!draft.started) {
      draft.started = true;
      saveDraft();
    }
    draft.debriefDone ? openDesk() : openDebrief();
  });

  document.querySelectorAll("[data-soon]").forEach((b) =>
    b.addEventListener("click", () => ($("cover-note").textContent = b.dataset.soon + " is coming soon."))
  );

  /* ---------------- 2. Debrief ---------------- */
  let lines = [];
  let lineIdx = 0;
  let typing = false;
  let typeTimer = null;

  function openDebrief() {
    const pick = (l) => (typeof l === "string" ? l : hard() ? l.hard : l.normal);
    lines = [...PARALEGAL_INTRO, ...caseData.debrief].map(pick);
    lineIdx = 0;
    showScreen("debrief");
    typeLine();
  }

  function typeLine() {
    const full = lines[lineIdx];
    const el = $("debrief-line");
    $("debrief-progress").textContent = `${lineIdx + 1}/${lines.length}`;
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
    $("debrief-line").textContent = lines[lineIdx];
    typing = false;
  }

  function debriefNext() {
    if (typing) return finishTyping();
    if (++lineIdx >= lines.length) return endDebrief();
    typeLine();
  }

  function endDebrief() {
    clearInterval(typeTimer);
    typing = false;
    draft.debriefDone = true;
    saveDraft();
    openDesk();
  }

  $("btn-debrief-next").addEventListener("click", (e) => { e.currentTarget.blur(); debriefNext(); });
  $("btn-skip").addEventListener("click", endDebrief);
  $("debrief-box").addEventListener("click", () => typing && finishTyping());
  $("btn-replay").addEventListener("click", () => !closing && openDebrief());

  /* ---------------- 3. Desk: the case folder ---------------- */
  const stack = $("stack");
  const cover = $("folder-cover");
  const desk = $("screen-desk");
  let pageEls = [];
  let built = false;
  let closing = false;
  let opened = false; // folder cover opened this visit

  const hard = () => draft.difficulty === "hard";
  // [[word]] -> highlighted key point (no highlights on hard)
  const rich = (t) => escapeHtml(t).replace(/\[\[(.+?)\]\]/g, hard() ? "$1" : "<mark>$1</mark>");
  const TILT = [-1.4, 0.9, -0.6, 1.3, -1, 0.5];
  const SLIDE = 600; // ms, matches .pp-page transition

  function buildStack() {
    pageEls.forEach((p) => p.remove());
    pageEls = [];

    $("front-case").textContent = "Case No. #" + caseNumber;
    $("front-date").textContent = Daily.pretty();
    $("flap-case").textContent = `#${caseNumber} · ${Daily.pretty()}`;
    $("flap-hint").innerHTML = hard()
      ? "Hard mode: no highlights.<br />Find the key points yourself."
      : "Highlighted words are key points.<br />Use them in your summary.";

    infoPages().forEach((pg, i) => {
      const el = document.createElement("article");
      el.className = "pp-page";
      let html = `<p class="pp-page-no">Page ${i + 1}</p><h2>${escapeHtml(pg.heading)}</h2>`;
      html += pg.body.map((t) => `<p>${rich(t)}</p>`).join("");
      if ("image" in pg) {
        html += pg.image
          ? `<img class="pp-img" src="${pg.image}" alt="" />`
          : `<div class="pp-img pp-img-placeholder">[ image / chart ]</div>`;
      }
      el.innerHTML = html;
      pageEls.push(el);
    });

    // last sheet: the answer
    const ans = document.createElement("article");
    ans.className = "pp-page pp-answer";
    ans.innerHTML = `
      <p class="pp-page-no">Summary sheet</p>
      <h2>Case Summary</h2>
      <label for="ans-title">Case title</label>
      <input id="ans-title" type="text" maxlength="80" placeholder="Give the case a short, fitting title" />
      <label for="ans-desc">Description</label>
      <textarea id="ans-desc" rows="7" maxlength="700" placeholder="Summarise what happened. Mention every key point."></textarea>
      <p class="pp-count"><span id="ans-words">0</span> words</p>
      <p class="pp-error" id="ans-error" aria-live="polite"></p>
      <button class="pp-link pp-submit" id="btn-submit">Press to submit</button>

      <div class="pp-confirm" id="confirm" hidden>
        <p><strong>Submit your summary?</strong></p>
        <p class="muted">You can't change it after this.</p>
        <div class="pp-row">
          <button id="btn-cancel">Cancel</button>
          <button class="primary" id="btn-confirm">Confirm submit</button>
        </div>
      </div>`;
    pageEls.push(ans);

    pageEls.forEach((el, i) => {
      el.style.setProperty("--tilt", TILT[i % TILT.length] + "deg");
      stack.insertBefore(el, cover);
      // click the page on top to turn it; click the left pile to bring the last one back
      el.addEventListener("click", (e) => {
        if (!opened || closing || getResult()) return;
        if (e.target.closest("input, textarea, button, a")) return;
        if (el.classList.contains("off")) setPage(draft.page - 1);
        else if (i === draft.page && i < pageEls.length - 1) setPage(draft.page + 1);
      });
    });

    // answer sheet: keep the typing in the draft
    const t = $("ans-title");
    const d = $("ans-desc");
    t.value = draft.title;
    d.value = draft.description;
    const words = () => ($("ans-words").textContent = d.value.trim() ? d.value.trim().split(/\s+/).length : 0);
    words();
    t.addEventListener("input", () => { draft.title = t.value; saveDraft(); });
    d.addEventListener("input", () => { draft.description = d.value; saveDraft(); words(); });
    $("btn-submit").addEventListener("click", askConfirm);
    $("btn-cancel").addEventListener("click", () => ($("confirm").hidden = true));
    $("btn-confirm").addEventListener("click", () => {
      $("confirm").hidden = true;
      closeCase();
    });
    built = true;
  }

  // stacking order: unread pages on the right (page 1 on top),
  // read pages on the left (most recently read on top)
  function zFor(i, off) {
    return off ? 100 + i : 50 - i;
  }

  function setPage(n, instant) {
    const prev = draft.page;
    draft.page = Math.max(0, Math.min(totalPages() - 1, n));
    saveDraft();
    pageEls.forEach((el, i) => {
      const off = i < draft.page;
      const comingBack = !instant && el.classList.contains("off") && !off;
      el.classList.toggle("off", off);
      if (comingBack) {
        el.style.zIndex = 250; // stay on top while it flies back
        setTimeout(() => (el.style.zIndex = zFor(i, el.classList.contains("off"))), SLIDE);
      } else {
        el.style.zIndex = zFor(i, off);
      }
    });
    updateControls();
    return prev !== draft.page;
  }

  function updateControls() {
    const last = totalPages() - 1;
    $("page-counter").textContent = !opened
      ? "Case file"
      : draft.page === last
      ? "Summary sheet"
      : `Page ${draft.page + 1} of ${infoPages().length}`;
    $("btn-prev").disabled = draft.page === 0;
    $("btn-next").disabled = draft.page === last;
    pageEls.forEach((el, i) => {
      const topRight = i === draft.page && i < last;
      const topLeft = i === draft.page - 1;
      el.classList.toggle("clickable", opened && (topRight || topLeft));
    });
  }

  $("btn-prev").addEventListener("click", (e) => { e.currentTarget.blur(); setPage(draft.page - 1); });
  $("btn-next").addEventListener("click", (e) => { e.currentTarget.blur(); setPage(draft.page + 1); });

  function openDesk() {
    if (!built) buildStack();
    showScreen("desk");
    const r = getResult();
    if (r) return showClosed(r, true);

    // start with the folder closed in the middle of the screen
    opened = false;
    desk.classList.remove("closing", "done");
    desk.classList.add("instant", "folded");
    cover.classList.remove("stamped");
    cover.classList.add("shut");
    cover.style.zIndex = 300;
    setPage(draft.page, true);
    requestAnimationFrame(() => requestAnimationFrame(() => desk.classList.remove("instant")));

    if (draft.submitted) return closeCase(); // page was refreshed while grading
  }

  // click the closed folder (or Enter / →) to open it
  function openFolder() {
    if (opened || closing || getResult() || draft.submitted) return;
    opened = true;
    desk.classList.remove("folded");
    cover.classList.remove("shut"); // swings over to the left
    setTimeout(() => {
      if (!cover.classList.contains("shut")) cover.style.zIndex = 1; // now under the read pages
    }, 850);
    updateControls();
  }
  $("cover-front").addEventListener("click", (e) => {
    if (desk.classList.contains("folded") && !e.target.closest("button, a")) openFolder();
  });

  function askConfirm() {
    const err = $("ans-error");
    err.textContent = "";
    if (!draft.title.trim()) return (err.textContent = "Give the case a title first.");
    if (draft.description.trim().split(/\s+/).length < 8)
      return (err.textContent = "Write a bit more in the description (at least 8 words).");
    $("confirm").hidden = false;
    $("btn-confirm").focus();
  }

  /* ---------------- 4. Close the case ---------------- */
  async function closeCase() {
    closing = true;
    draft.submitted = true;
    saveDraft();
    desk.classList.add("closing");
    desk.classList.remove("folded");
    document.activeElement && document.activeElement.blur();

    // grade while the animation plays
    const grading = gradeSummary({
      caseData,
      difficulty: draft.difficulty,
      title: draft.title,
      description: draft.description,
    }).catch(() => ({ titleScore: 0, descriptionScore: 0, found: [], missed: [], feedback: "Couldn't reach the grader." }));

    // 1. the read pages come back from the left onto the pile, one by one
    const off = pageEls.filter((el) => el.classList.contains("off")).reverse();
    off.forEach((el, k) =>
      setTimeout(() => {
        const i = pageEls.indexOf(el);
        el.style.zIndex = 250 + k;
        el.classList.remove("off");
        setTimeout(() => (el.style.zIndex = zFor(i, false)), SLIDE);
      }, k * 130)
    );
    if (off.length) await wait(off.length * 130 + SLIDE);
    draft.page = 0;
    saveDraft();

    // 2. the cover swings back over the pile
    cover.style.zIndex = 300;
    await wait(30);
    cover.classList.add("shut");
    await wait(900);

    const g = await grading;
    const result = {
      caseNumber,
      difficulty: draft.difficulty,
      title: draft.title,
      description: draft.description,
      titleScore: clamp(g.titleScore, 5),
      descriptionScore: clamp(g.descriptionScore, 10),
      found: g.found || [],
      missed: g.missed || [],
      feedback: g.feedback || "",
    };
    result.total = result.titleScore + result.descriptionScore;
    Store.safeSet(KEY_RESULT, result);
    Store.addScore("paralegal", result.total);

    // 3. CASE CLOSED stamp on the front
    showClosed(result, false);
    closing = false;
  }

  function showClosed(r, instant) {
    opened = false;
    desk.classList.remove("folded");
    desk.classList.add("closing", "done");
    desk.classList.toggle("instant", instant);
    pageEls.forEach((el, i) => {
      el.classList.remove("off", "clickable");
      el.style.zIndex = zFor(i, false);
    });
    cover.style.zIndex = 300;
    cover.classList.add("shut", "stamped");
    $("result-score").textContent = `${r.total}/15`;
    $("result-next").textContent = "Next case in " + Daily.timeLeft() + ".";
    $("page-counter").textContent = "Case closed";
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (n, max) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)));

  /* ---------------- Breakdown + share ---------------- */
  $("btn-breakdown").addEventListener("click", () => {
    const r = getResult();
    if (!r) return;
    const list = (arr, mark) => (arr.length ? arr.map((w) => `<li>${mark} ${escapeHtml(w)}</li>`).join("") : "<li class='muted'>none</li>");
    $("breakdown-body").innerHTML = `
      <table class="pp-table">
        <tr><th>Title</th><td>${r.titleScore} / 5</td></tr>
        <tr><th>Description</th><td>${r.descriptionScore} / 10</td></tr>
        <tr class="total"><th>Total</th><td>${r.total} / 15</td></tr>
      </table>
      <h3>Your title</h3><p class="pp-quote">${escapeHtml(r.title)}</p>
      <h3>Your description</h3><p class="pp-quote">${escapeHtml(r.description)}</p>
      <div class="pp-keys">
        <div><h3>Key points you covered</h3><ul>${list(r.found, "✓")}</ul></div>
        <div><h3>Key points you missed</h3><ul>${list(r.missed, "✗")}</ul></div>
      </div>
      ${r.feedback ? `<p class="muted">${escapeHtml(r.feedback)}</p>` : ""}`;
    $("breakdown").showModal();
  });
  $("breakdown").addEventListener("click", (e) => e.target === $("breakdown") && $("breakdown").close());

  $("btn-share").addEventListener("click", async (e) => {
    const r = getResult();
    if (!r) return;
    const bar = "🟩".repeat(r.total) + "⬜".repeat(15 - r.total);
    const text =
      `Paranormal Paralegal · Case #${r.caseNumber} (${r.difficulty})\n${bar}\n` +
      `Title ${r.titleScore}/5 · Description ${r.descriptionScore}/10 · ${r.total}/15`;
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
  // Esc = back: desk/debrief -> cover -> hallway
  onEscape(() => {
    if (closing) return;
    const confirmBox = $("confirm");
    if (confirmBox && !confirmBox.hidden) {
      confirmBox.hidden = true; // Esc first cancels the "submit?" box
      return;
    }
    if (!$("screen-cover").hidden) return (location.href = "../hallway.html");
    clearInterval(typeTimer);
    typing = false;
    showScreen("cover");
  });

  document.addEventListener("keydown", (e) => {
    if (document.querySelector("dialog[open]")) return;
    const tag = document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return; // typing, not navigating

    if (!$("screen-cover").hidden && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      const order = ["easy", "medium", "hard"];
      const i = order.indexOf(draft.difficulty) + (e.key === "ArrowRight" ? 1 : -1);
      if (i >= 0 && i < order.length) setDifficulty(order[i]);
    } else if (!$("screen-debrief").hidden && ["Enter", " ", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      debriefNext();
    } else if (!$("screen-desk").hidden && !closing && !getResult()) {
      if (!opened) {
        if (e.key === "Enter" || e.key === "ArrowRight") openFolder();
        return;
      }
      if (e.key === "ArrowRight") setPage(draft.page + 1);
      if (e.key === "ArrowLeft") setPage(draft.page - 1);
    }
  });

  /* ---------------- Start ---------------- */
  showScreen("cover");
})();

/* =========================================================
   INTERROGATION ROOM – game logic
   Flow: Room menu (difficulty on the CRT) -> Instructions +
         case brief -> Interrogation -> Result (pop-up)
   Interrogation: the detective asks questions, the suspect
   answers one line at a time. NEXT lets a line pass. FLAG AS
   LIE -> the brief pops up -> select ONE clause or picture as
   proof -> Confirm. No going back. Flags = number of lies.
   Scoring: 1 point per lie flagged + 1 point per correct proof.
   Log of the Day: one random case per day, one attempt.
   ========================================================= */

(function () {
  /* ---------------- Today's case (random, kept for the day) ---------------- */
  const START_DATE = new Date(2026, 10, 1); // 1 Nov 2026 = log #101
  const logNumber = 101 + Daily.daysSince(START_DATE);

  const KEY_RESULT = "er_ir_result_" + Daily.key();
  const KEY_DRAFT = "er_ir_draft_" + Daily.key();
  const KEY_PICK = "er_ir_case_" + Daily.key();
  const KEY_LAST = "er_ir_last_case";

  function pickCase() {
    const found = LOGS.find((c) => c.id === Store.safeGet(KEY_PICK, null));
    if (found) return found;
    const last = Store.safeGet(KEY_LAST, null);
    const pool = LOGS.length > 1 ? LOGS.filter((c) => c.id !== last) : LOGS;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    Store.safeSet(KEY_PICK, pick.id);
    Store.safeSet(KEY_LAST, pick.id);
    return pick;
  }
  const log = pickCase();

  const TYPE_SPEED = 26; // ms per letter

  let draft = Store.safeGet(KEY_DRAFT, null) || {
    difficulty: "easy",
    started: false, // started -> difficulty locked
    step: 0, // position in the dialogue (detective lines included)
    flags: [], // { line: statement number (0-based), proof: clause id or "img:<id>" }
  };

  const $ = (id) => document.getElementById(id);
  const saveDraft = () => Store.safeSet(KEY_DRAFT, draft);
  const getResult = () => Store.safeGet(KEY_RESULT, null);

  const version = (d = draft.difficulty) => log.versions[d];
  const dialogue = (d) => version(d).dialogue;
  const statements = (d) => dialogue(d).filter((x) => x.say);
  const liesIn = (d) => statements(d).filter((x) => x.lie).length;
  const flagsLeft = () => liesIn() - draft.flags.length;
  // statement number (0-based) of a dialogue step, or -1 for a detective line
  const lineNo = (step, d) => (dialogue(d)[step].say ? dialogue(d).slice(0, step).filter((x) => x.say).length : -1);

  $("topbar-log").textContent = "Log #" + logNumber;
  $("crt-log-no").textContent = logNumber;

  /* ---------------- Case brief: clauses you can tap ---------------- */
  // split at commas and full stops; the same rule is used to check proofs
  const splitClauses = (t) => t.split(/(?<=,)\s+|(?<=[.!?])\s+(?=[A-Z0-9"“$])/).filter(Boolean);
  const plain = (t) => t.replace(/\*\*/g, "");
  const norm = (t) => plain(t).toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ");
  const bold = (t) => escapeHtml(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // every clause gets an id like "p1c3"
  function clauseList(d) {
    const out = [];
    version(d).brief.forEach((para, p) => splitClauses(para).forEach((text, c) => out.push({ id: `p${p}c${c}`, p, text })));
    return out;
  }
  const clauseText = (id, d) => {
    if (id.startsWith("img:")) {
      const a = version(d).assets.find((x) => "img:" + x.id === id);
      return a ? "Picture: " + a.desc : id;
    }
    const c = clauseList(d).find((x) => x.id === id);
    return c ? plain(c.text) : id;
  };

  function assetHtml(a, selectable) {
    const inner = a.file
      ? `<img src="${a.file}" alt="${escapeHtml(a.desc)}" />`
      : `<span class="ir-asset-ph">[ picture ] ${escapeHtml(a.desc)}</span>` +
        (a.lines ? `<span class="ir-asset-text">${a.lines.map(escapeHtml).join("<br />")}</span>` : "");
    const tag = selectable ? "button" : "div";
    return `<${tag} class="ir-asset" data-id="img:${a.id}">${inner}</${tag}>`;
  }

  // read-only or selectable brief
  function renderBrief(el, selectable, d = draft.difficulty) {
    const v = version(d);
    const paras = v.brief.map((para, p) => {
      const parts = splitClauses(para).map((text, c) =>
        selectable
          ? `<button class="ir-clause" data-id="p${p}c${c}">${bold(text)}</button>`
          : `<span>${bold(text)}</span>`
      );
      return `<p>${parts.join(" ")}</p>`;
    });
    el.innerHTML =
      `<p class="ir-brief-title">${escapeHtml(log.title)}</p>` +
      paras.join("") +
      `<div class="ir-assets">${v.assets.map((a) => assetHtml(a, selectable)).join("")}</div>`;
  }

  /* ---------------- Screens ---------------- */
  const screens = ["menu", "brief", "room"];
  function showScreen(name) {
    document.querySelectorAll("dialog[open]").forEach((dl) => dl.close());
    screens.forEach((s) => ($("screen-" + s).hidden = s !== name));
    if (name === "menu") renderMenu();
  }
  document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => showScreen(b.dataset.go)));

  /* ---------------- 1. Room menu ---------------- */
  const diffButtons = [...document.querySelectorAll("[data-diff]")];
  diffButtons.forEach((b) => {
    const n = statements(b.dataset.diff).length;
    const l = liesIn(b.dataset.diff);
    b.querySelector("small").textContent = `${n} lines · ${l} lie${l === 1 ? "" : "s"}`;
  });

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
      b.blur();
      setDifficulty(b.dataset.diff);
    })
  );

  $("btn-daily").addEventListener("click", () => {
    if (getResult()) return showResult();
    if (draft.started) return enterRoom();
    renderBriefing();
    showScreen("brief");
  });

  document.querySelectorAll("[data-soon]").forEach((b) =>
    b.addEventListener("click", () => ($("menu-note").textContent = b.dataset.soon + " is coming soon."))
  );

  /* ---------------- 2. Instructions + brief ---------------- */
  function renderBriefing() {
    const n = statements().length;
    const lies = liesIn();
    $("brief-left").innerHTML = `
      <h2>Instructions</h2>
      <p>Welcome to the interrogation room. Read the case brief carefully: it tells you what really happened.</p>
      <p>You will question <strong>${escapeHtml(log.suspect)}</strong>. They will make ${n} statements, one at a time. ${
        lies === 1 ? "One of them is a lie." : lies + " of them are lies."
      }</p>
      <p>When you hear a lie, press <strong>FLAG AS LIE</strong>, then tap the part of the brief that proves it, and confirm. Otherwise press <strong>NEXT</strong>.</p>
      <p>You have ${lies} flag${lies === 1 ? "" : "s"}. Each lie you catch = 1 point. The right proof = 1 more point.</p>
      <p><strong>⚠ WARNING: there is no going back to a previous statement.</strong></p>
      <p class="muted">You can click the TV during the interrogation to read the brief again.</p>`;
    renderBrief($("brief-right"), false);
  }

  $("btn-start").addEventListener("click", () => {
    draft.started = true;
    saveDraft();
    enterRoom();
  });

  /* ---------------- 3. Interrogation ---------------- */
  let typing = false;
  let busy = false; // during the FLAGGED stamp / after the end
  let typeTimer = null;
  let fullText = "";
  let typeTarget = null; // the box currently typing (detective or suspect)

  function portrait() {
    const src = log.image || spriteFor(log.suspect); // shared sprite list in main.js
    if (src) return `<img src="${src}" alt="" style="${log.image ? "" : spriteMove(log.suspect)}" />`;
    return `<svg viewBox="0 0 120 120">
      <circle cx="60" cy="42" r="22" fill="none" stroke="currentColor" stroke-width="5"/>
      <path d="M18 120 Q18 74 60 74 Q102 74 102 120" fill="none" stroke="currentColor" stroke-width="5"/>
    </svg>`;
  }

  function setupRoom() {
    $("tv-title").textContent = log.title;
    $("suspect-figure").innerHTML = portrait();
    renderBrief($("tv-brief"), false);
    showScreen("room");
  }

  function enterRoom() {
    setupRoom();
    if (draft.step >= dialogue().length) return finish();
    busy = false;
    showStep();
  }

  function isDetective() {
    return !!dialogue()[draft.step].detective;
  }

  function updateStatus() {
    const n = statements().length;
    const upcoming = dialogue().slice(0, draft.step + 1).filter((x) => x.say).length;
    $("st-num").textContent = Math.min(Math.max(upcoming, 1), n);
    $("st-total").textContent = n;
    $("flags-left").textContent = flagsLeft();
  }

  function setButtons() {
    const locked = typing || busy;
    const detective = !busy && draft.step < dialogue().length && isDetective();
    $("btn-next").disabled = locked;
    $("btn-flag").disabled = locked || detective || flagsLeft() <= 0;
    $("more").hidden = typing || detective;
    $("det-more").hidden = typing || !detective;
  }

  // the most recent detective question up to this step
  function lastQuestion(step) {
    const q = dialogue().slice(0, step + 1).reverse().find((x) => x.detective);
    return q ? q.detective : "";
  }

  function showStep() {
    const entry = dialogue()[draft.step];
    const detective = !!entry.detective;
    const q = lastQuestion(draft.step);

    // detective box: active while you ask, stays (greyed) while the suspect answers
    const dbox = $("detective-box");
    dbox.hidden = !q;
    dbox.classList.toggle("active", detective);
    $("dialogue").classList.toggle("waiting", detective);
    $("suspect-figure").classList.toggle("dimmed", detective);
    $("speaker").textContent = log.suspect;
    updateStatus();

    if (detective) {
      $("line").textContent = "…";
      typeTarget = $("detective-line");
    } else {
      $("detective-line").textContent = q;
      typeTarget = $("line");
    }
    fullText = detective ? entry.detective : entry.say;
    typeTarget.textContent = "";
    typing = true;
    setButtons();
    let i = 0;
    clearInterval(typeTimer);
    typeTimer = setInterval(() => {
      typeTarget.textContent = fullText.slice(0, ++i);
      if (i >= fullText.length) finishTyping();
    }, TYPE_SPEED);
  }

  function finishTyping() {
    clearInterval(typeTimer);
    if (typeTarget) typeTarget.textContent = fullText;
    typing = false;
    setButtons();
  }

  function next() {
    if (typing || busy) return;
    draft.step++;
    saveDraft();
    afterChoice();
  }

  function afterChoice() {
    if (draft.step >= dialogue().length) finish();
    else showStep();
  }

  $("btn-next").addEventListener("click", (e) => { e.currentTarget.blur(); next(); });
  $("btn-flag").addEventListener("click", (e) => { e.currentTarget.blur(); openProof(); });
  $("dialogue").addEventListener("click", () => typing && finishTyping());
  $("detective-box").addEventListener("click", () => typing && finishTyping());

  // TV = read the brief again
  const tvDialog = $("tv-dialog");
  $("btn-tv").addEventListener("click", (e) => { e.currentTarget.blur(); tvDialog.showModal(); });
  tvDialog.addEventListener("click", (e) => e.target === tvDialog && tvDialog.close());

  /* ---------------- Flag -> select proof -> confirm ---------------- */
  const proofDialog = $("proof-dialog");
  let picked = null;

  function openProof() {
    if (typing || busy || isDetective() || flagsLeft() <= 0) return;
    picked = null;
    $("proof-line").textContent = dialogue()[draft.step].say;
    renderBrief($("proof-brief"), true);
    $("proof-picked").textContent = "Nothing selected yet";
    $("btn-proof-confirm").disabled = true;
    proofDialog.showModal();
  }

  // select one clause or picture
  $("proof-brief").addEventListener("click", (e) => {
    const t = e.target.closest("[data-id]");
    if (!t) return;
    picked = t.dataset.id;
    $("proof-brief").querySelectorAll("[data-id]").forEach((x) => x.classList.toggle("picked", x === t));
    $("proof-picked").textContent = "Selected: “" + clauseText(picked).slice(0, 60) + (clauseText(picked).length > 60 ? "…" : "") + "”";
    $("btn-proof-confirm").disabled = false;
  });

  $("btn-proof-cancel").addEventListener("click", () => proofDialog.close());
  proofDialog.addEventListener("click", (e) => e.target === proofDialog && proofDialog.close());

  $("btn-proof-confirm").addEventListener("click", () => {
    if (!picked) return;
    proofDialog.close();
    // save the flag straight away, so refreshing can't undo it
    draft.flags.push({ line: lineNo(draft.step), proof: picked });
    draft.step++;
    saveDraft();
    busy = true;
    setButtons();
    $("flags-left").textContent = flagsLeft();
    $("stamp").hidden = false;
    setTimeout(() => {
      $("stamp").hidden = true;
      busy = false;
      afterChoice();
    }, 800);
  });

  /* ---------------- 4. Result ---------------- */
  // does the picked clause/picture prove this statement is false?
  function proofMatches(statement, pickedId, d) {
    if (!statement.lie || !pickedId) return false;
    return (statement.proof || []).some((p) =>
      p.startsWith("img:") ? p === pickedId : !pickedId.startsWith("img:") && norm(clauseText(pickedId, d)).includes(norm(p))
    );
  }

  function score(d, flags) {
    const list = statements(d);
    let caught = 0;
    let proofs = 0;
    flags.forEach((f) => {
      const s = list[f.line];
      if (s && s.lie) {
        caught++;
        if (proofMatches(s, f.proof, d)) proofs++;
      }
    });
    return { caught, proofs, total: caught + proofs, max: liesIn(d) * 2 };
  }

  function finish() {
    const s = score(draft.difficulty, draft.flags);
    const result = {
      caseId: log.id,
      logNumber,
      difficulty: draft.difficulty,
      flags: draft.flags,
      lies: liesIn(),
      ...s,
    };
    Store.safeSet(KEY_RESULT, result);
    Store.addScore("interrogation", result.total);
    showResult();
  }

  // the brief with every statement's proof highlighted and numbered
  function highlightedBrief(d) {
    const list = statements(d);
    const v = version(d);
    const paras = v.brief.map((raw) => {
      const text = plain(raw);
      const ranges = [];
      list.forEach((s, i) =>
        (s.proof || []).forEach((p) => {
          if (p.startsWith("img:")) return;
          const at = text.indexOf(p);
          if (at >= 0) ranges.push({ start: at, end: at + p.length, line: i + 1, lie: !!s.lie });
        })
      );
      const cuts = [...new Set([0, text.length, ...ranges.flatMap((r) => [r.start, r.end])])].sort((a, b) => a - b);
      let html = "";
      for (let k = 0; k < cuts.length - 1; k++) {
        const a = cuts[k];
        const b = cuts[k + 1];
        const cover = ranges.filter((r) => r.start <= a && r.end >= b);
        const labels = ranges.filter((r) => r.start === a).map((r) => `<sup>${r.line}</sup>`).join("");
        const seg = escapeHtml(text.slice(a, b));
        html += cover.length
          ? `${labels}<mark class="${cover.some((r) => r.lie) ? "lie" : "true"}">${seg}</mark>`
          : seg;
      }
      return `<p>${html}</p>`;
    });
    const pics = v.assets
      .map((a) => {
        const usedBy = list.map((s, i) => ((s.proof || []).includes("img:" + a.id) ? i + 1 : 0)).filter(Boolean);
        return assetHtml(a, false).replace('class="ir-asset"', `class="ir-asset${usedBy.length ? " proof" : ""}"`) +
          (usedBy.length ? `<p class="ir-asset-note">Proof for line ${usedBy.join(", ")}</p>` : "");
      })
      .join("");
    return paras.join("") + `<div class="ir-assets">${pics}</div>`;
  }

  const resultDialog = $("result-dialog");

  function showResult() {
    const r = getResult();
    const d = r.difficulty;
    const list = statements(d);

    // the room stays in the background, dimmed behind the pop-up
    draft.difficulty = d;
    setupRoom();
    clearInterval(typeTimer);
    typing = false;
    busy = true;
    $("dialogue").classList.remove("waiting");
    $("suspect-figure").classList.remove("dimmed");
    $("detective-box").classList.remove("active");
    $("detective-box").hidden = !lastQuestion(dialogue(d).length - 1);
    $("detective-line").textContent = lastQuestion(dialogue(d).length - 1);
    $("speaker").textContent = log.suspect;
    $("line").textContent = "— End of interrogation —";
    $("st-num").textContent = list.length;
    $("st-total").textContent = list.length;
    $("flags-left").textContent = Math.max(0, r.lies - r.flags.length);
    setButtons();

    $("result-title").textContent =
      r.total === r.max ? "Perfect read!" : r.caught === r.lies ? "Lies caught!" : r.caught > 0 ? "Partly caught" : "The lies slipped past you";

    const rows = list
      .map((s, i) => {
        const f = r.flags.find((x) => x.line === i);
        const truth = s.lie ? "<strong>LIE</strong>" : s.uncheckable ? "Not checkable" : "True";
        let you = "Passed";
        let pts = 0;
        let ok = !f !== !!s.lie; // passed a true line, or flagged a lie
        if (f) {
          const proofOk = proofMatches(s, f.proof, d);
          if (s.lie) pts = 1 + (proofOk ? 1 : 0);
          you = `⚑ Flagged<br /><span class="ir-your-proof">Proof: “${escapeHtml(clauseText(f.proof, d))}” ${s.lie ? (proofOk ? "✓" : "✗") : ""}</span>`;
        }
        return `<tr class="${ok ? "" : "wrong"}">
          <td>${i + 1}</td>
          <td class="ir-quote">“${escapeHtml(s.say)}”</td>
          <td>${you}</td>
          <td>${truth}</td>
          <td>${s.lie ? pts + "/2" : ok ? "✓" : "✗"}</td>
        </tr>`;
      })
      .join("");

    $("result-body").innerHTML = `
      <p>${escapeHtml(log.title)} · Log #${r.logNumber} · ${d.charAt(0).toUpperCase() + d.slice(1)}</p>
      <p class="ir-total">Score: ${r.total}/${r.max} · Lies caught: ${r.caught}/${r.lies} · Right proofs: ${r.proofs}/${r.lies}</p>
      <table>
        <tr><th>#</th><th>Statement</th><th>You</th><th>Truth</th><th></th></tr>
        ${rows}
      </table>
      <details class="ir-proofs" open>
        <summary>Where the proof was</summary>
        <p class="muted ir-legend"><mark class="lie">dark</mark> = proof of a lie · <mark class="true">underlined</mark> = backs up a true line · small numbers = statement</p>
        <div class="ir-brief">${highlightedBrief(d)}</div>
      </details>`;
    $("result-next").textContent = "Next log in " + Daily.timeLeft() + ".";
    $("btn-copy").textContent = "Copy result";
    resultDialog.showModal();
  }

  // closing the result pop-up goes back to the room menu
  resultDialog.addEventListener("close", () => {
    if (!$("screen-room").hidden) showScreen("menu");
  });
  resultDialog.addEventListener("click", (e) => e.target === resultDialog && resultDialog.close());

  $("btn-copy").addEventListener("click", async (e) => {
    const r = getResult();
    if (!r) return;
    const list = statements(r.difficulty);
    // green = right call (+ right proof), yellow = lie caught but wrong proof, red = wrong call
    const squares = list
      .map((s, i) => {
        const f = r.flags.find((x) => x.line === i);
        if (!f) return s.lie ? "🟥" : "🟩";
        if (!s.lie) return "🟥";
        return proofMatches(s, f.proof, r.difficulty) ? "🟩" : "🟨";
      })
      .join("");
    const text = `Interrogation Room · Log #${r.logNumber} (${r.difficulty})\n${squares}\nScore: ${r.total}/${r.max}`;
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
        [KEY_RESULT, KEY_DRAFT, KEY_PICK].forEach((k) => localStorage.removeItem(k)); // also picks a new case
      } catch {}
      location.reload();
    });
  }

  /* ---------------- Keyboard ---------------- */
  // Esc = back: interrogation/briefing -> room menu -> hallway (pop-ups close first)
  onEscape(() => {
    if (!$("screen-menu").hidden) return (location.href = "../hallway.html");
    clearInterval(typeTimer);
    typing = false;
    showScreen("menu");
  });

  document.addEventListener("keydown", (e) => {
    // proof picker: Enter confirms once something is selected
    if (proofDialog.open) {
      if (e.key === "Enter" && picked) {
        e.preventDefault();
        $("btn-proof-confirm").click();
      }
      return;
    }
    if (document.querySelector("dialog[open]")) return;

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
      if (!typing) openProof();
    } else if (k === "c") {
      tvDialog.showModal();
    }
  });

  /* ---------------- Start ---------------- */
  showScreen("menu");
})();

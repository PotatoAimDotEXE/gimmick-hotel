/* =========================================================
   SUMMARY GRADER – PLACEHOLDER (keyword check per rubric line)
   ---------------------------------------------------------
   Score out of 5: each rubric line in cases.js is worth 1 point
   (title 1 + summary 4). This rough check looks for the words
   listed in each line's "need" groups, and takes the point away
   if the player blames a trap ("blame" words). It's only here so
   the game is playable until the AI judge is connected.

   When AI_GRADER_URL (main.js) is set and the [dev] AI switch on the
   title screen is on, the AI judge (DeepSeek through
   worker/grader-worker.js) grades each rubric line instead, with a
   sentence of feedback per line. If it's not set or can't be reached,
   this keyword check is used so the game still works.
   NEVER put an API key in this file – it is visible to players.
   ========================================================= */

// does the text contain a word starting with w?  ("float" matches "floated")
function hasWord(text, w) {
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(^|[^a-z])" + esc, "i").test(text);
}

// does the player BLAME one of these words? A mention inside a sentence that
// also says "not / wasn't / couldn't / ruled out / instead" doesn't count.
function blames(text, words) {
  const NEG = /\b(not|no|never|wasn't|isn't|couldn't|can't|cannot|didn't|doesn't|ruled out|rule out|instead|rather than)\b|n't\b/i;
  return text
    .split(/(?<=[.!?])\s+/)
    .some((sentence) => words.some((w) => hasWord(sentence, w)) && !NEG.test(sentence));
}

function checkLine(line, answer) {
  const text = line.field === "title" ? answer.title : answer.summary;
  const needOk = (line.need || []).every((group) => group.some((w) => hasWord(text, w)));
  const blamed = line.blame ? blames(text, line.blame) : false;
  return needOk && !blamed;
}

const plainText = (t) => String(t).replace(/\[\[(.+?)\]\]/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1");

// adds the team's accepted words ("need" groups in cases.js) to a rubric line, so the
// AI follows the same rule: one idea from EACH group earns the point
function withKeyWords(line) {
  const groups = (line.need || []).filter((g) => g.length);
  if (!groups.length) return line.what;
  const words = groups.map((g) => g.join(" / ")).join("  AND ALSO one of: ");
  return `${line.what}. [Guide: answers that earn this usually use one of: ${words} (word starts, so "drop" covers "dropped"; synonyms and own words count too). The idea itself must be clearly stated in a real sentence about what happened: key words on their own, or listed without meaning, earn nothing. If the line says "X and Y" but the guide accepts either word, one of them is enough.]`;
}

// the AI judge (DeepSeek through the Cloudflare Worker); null if it can't be used
async function gradeSummaryAI({ version, title, summary }) {
  if (!aiGradingOn()) return null;
  const ev = (e) => [e.label, e.text, (e.rows || []).map((r) => (Array.isArray(r) ? r.join(" | ") : r)).join("; ")].filter(Boolean).map(plainText).join(": ");
  try {
    const out = await askAIGrader({
      task: "paralegal",
      case: {
        report: version.report.map(plainText),
        evidence: (version.evidence || []).map(ev),
        task: version.task,
        rubric: version.rubric.map((l) => ({ what: withKeyWords(l), field: l.field })),
        traps: (version.traps || []).map((t) => ({ name: t.name, info: t.info, field: t.field, titleMiss: !!t.titleMiss })),
        sample: version.sample,
      },
      answer: { title: title.trim(), summary: summary.trim() },
    });
    const checks = version.rubric.map((line, i) => ({
      what: line.what,
      field: line.field,
      got: !!(out.checks[i] && out.checks[i].got),
      feedback: (out.checks[i] && out.checks[i].feedback) || "",
    }));
    const traps = (out.traps || []).map((i) => version.traps[i]).filter(Boolean).map((t) => ({ name: t.name, info: t.info }));
    return { checks, total: checks.filter((c) => c.got).length, max: checks.length, traps, feedback: out.feedback || "" };
  } catch (err) {
    console.warn("AI grader unavailable, using the keyword check:", err);
    return { error: err.message };
  }
}

async function gradeSummary({ version, title, summary }) {
  const ai = await gradeSummaryAI({ version, title, summary });
  if (ai && !ai.error) return ai;
  const why = ai && ai.error
    ? "The AI grader couldn't be used (" + ai.error + "), so this was marked with the simple keyword check."
    : !AI_GRADER_URL
    ? "Marked with the simple keyword check (no AI grader address is set in js/main.js)."
    : "Marked with the simple keyword check, because AI grading is off. Turn it on with the [dev] button on the title screen.";

  await new Promise((r) => setTimeout(r, 600)); // pretend to think

  const answer = { title: title.trim(), summary: summary.trim() };
  const checks = version.rubric.map((line) => ({ what: line.what, field: line.field, got: checkLine(line, answer) }));

  // traps (hard): title misses the main event, or the player blames the red herring
  const titleLine = version.rubric.find((l) => l.field === "title");
  const traps = (version.traps || [])
    .filter((t) => (t.titleMiss ? titleLine && !checkLine(titleLine, answer) : blames(answer[t.field], t.blame)))
    .map((t) => ({ name: t.name, info: t.info }));

  return {
    checks,
    total: checks.filter((c) => c.got).length,
    max: checks.length,
    traps,
    feedback: why,
  };
}

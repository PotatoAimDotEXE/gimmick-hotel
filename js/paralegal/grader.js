/* =========================================================
   SUMMARY GRADER – PLACEHOLDER (keyword check per rubric line)
   ---------------------------------------------------------
   Score out of 5: each rubric line in cases.js is worth 1 point
   (title 1 + summary 4). This rough check looks for the words
   listed in each line's "need" groups, and takes the point away
   if the player blames a trap ("blame" words). It's only here so
   the game is playable until the AI judge is connected.

   When the AI is ready, replace the body of gradeSummary() with a
   call to your serverless function, sending the version's rubric
   (the "what" lines), the sample answer and the player's answer:

     const res = await fetch("https://YOUR-FUNCTION-URL/grade-summary", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ caseId: caseData.id, difficulty, title, summary }),
     });
     return await res.json();
     // { checks: [{ what, got: true/false, feedback }], total, max, traps: [{ name, info }] }

   The AI should accept simple English and small spelling mistakes.
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

async function gradeSummary({ version, title, summary }) {
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
    feedback: "Placeholder grading (keyword check). The AI judge will replace this and explain each point.",
  };
}

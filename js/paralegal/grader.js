/* =========================================================
   SUMMARY GRADER – PLACEHOLDER (simple keyword check)
   ---------------------------------------------------------
   Score out of 15:
     5 pts  title        – relevant, fitting title
     10 pts description  – mentions all the keywords (or synonyms)

   For now this just looks for the keywords from cases.js, so
   the game is playable and testable. When the AI is ready,
   replace the body of gradeSummary() with a call to your
   serverless function, e.g.:

     const res = await fetch("https://YOUR-FUNCTION-URL/grade-summary", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ caseId: caseData.id, difficulty, title, description }),
     });
     return await res.json();
     // { titleScore: 0-5, descriptionScore: 0-10, feedback: "...", found: [...], missed: [...] }

   NEVER put an API key in this file – it is visible to players.
   ========================================================= */

async function gradeSummary({ caseData, difficulty, title, description }) {
  await new Promise((r) => setTimeout(r, 600)); // pretend to think

  const pages = { easy: 3, medium: 4, hard: 5 }[difficulty];
  const required = caseData.keywords.filter((k) => (k.page || 1) <= pages);

  const has = (text, word) => new RegExp("\\b" + word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text);

  // Description: share of keywords mentioned (any synonym counts)
  const found = required.filter((k) => k.words.some((w) => has(description, w)));
  const missed = required.filter((k) => !found.includes(k));
  const descriptionScore = required.length ? Math.round((10 * found.length) / required.length) : 0;

  // Title: 1 point for a real title, +2 per relevant word, max 5
  const words = title.trim().split(/\s+/).filter(Boolean).length;
  const hits = caseData.titleKeywords.filter((w) => has(title, w)).length;
  const titleScore = words === 0 ? 0 : Math.min(5, 1 + 2 * hits);

  return {
    titleScore,
    descriptionScore,
    found: found.map((k) => k.words[0]),
    missed: missed.map((k) => k.words[0]),
    feedback: "Placeholder grading (keyword check). The AI grader will replace this.",
  };
}

/* =========================================================
   AI REASONING GRADER
   ---------------------------------------------------------
   Score out of 10 (matches the team's rubrics):
     4 pts  choosing the right person  (checked in detective.js)
     6 pts  reasoning                  (graded HERE by AI, later)
   The AI gets caseData.rubric (the three 2-point criteria) and
   caseData.sample (a full-marks answer) to grade against.

   When AI_GRADER_URL (main.js) is set and the [dev] AI switch on the
   title screen is on, the case, rubric, sample
   answer and the player's reasoning go to the Cloudflare Worker
   (worker/grader-worker.js), which asks DeepSeek and returns
   { score: 0-6, criteria: [{ points, max, feedback }], feedback }.
   If it's not set, or can't be reached, the reasoning stays unscored.

   NEVER put an API key in this file – it is visible to players.
   ========================================================= */

// context = the case as the player saw it (built in detective.js):
//   { title, report, evidence, people, question, instructions, culprit, chosen }
async function gradeReasoning({ caseData, suspectId, reasoning, context }) {
  if (aiGradingOn() && context) {
    try {
      const out = await askAIGrader({
        task: "detective",
        case: { ...context, rubric: caseData.rubric, sample: caseData.sample },
        answer: reasoning,
      });
      return { score: out.score, criteria: out.criteria || [], feedback: out.feedback || "" };
    } catch (err) {
      return { score: null, feedback: "The AI grader couldn't be used (" + err.message + "), so your reasoning isn't scored." };
    }
  }

  await new Promise((r) => setTimeout(r, 900)); // fake "thinking" delay
  return {
    score: null, // null = not graded yet
    feedback: AI_GRADER_URL
      ? "AI grading is off, so your reasoning isn't scored. Turn it on with the [dev] button on the title screen."
      : "No AI grader address is set in js/main.js, so your reasoning isn't scored.",
  };
}

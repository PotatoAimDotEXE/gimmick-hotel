/* =========================================================
   AI REASONING GRADER – PLACEHOLDER
   ---------------------------------------------------------
   Score out of 20:
     10 pts  correct suspect      (checked in detective.js)
     10 pts  reasoning            (graded HERE by AI, later)

   When the AI is ready, replace the body of gradeReasoning()
   with a call to your serverless function, e.g.:

     const res = await fetch("https://YOUR-FUNCTION-URL/grade", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ caseId: caseData.id, suspectId, reasoning }),
     });
     return await res.json();   // { score: 0-10, feedback: "..." }

   NEVER put an API key in this file – it is visible to players.
   The function should look up the rubric + culprit itself.
   ========================================================= */

async function gradeReasoning({ caseData, suspectId, reasoning }) {
  await new Promise((r) => setTimeout(r, 900)); // fake "thinking" delay

  return {
    score: null, // null = not graded yet
    feedback: "AI grading isn't connected yet. Your reasoning will be scored out of 10 here.",
  };
}

import { ParserState, ExtractedQuestion } from "@/lib/parser/types";

export async function extractQuestions(state: ParserState): Promise<ParserState> {
  const questions: ExtractedQuestion[] = [];
  
  let currentQuestion: ExtractedQuestion | null = null;
  let currentPart: { label: string; text: string } | null = null;

  // Regex for Q1, Q2, 1., 2., Question 1, Question 2
  const questionRegex = /^(Q\s*\d+|Question\s*\d+|\d+\.)/i;
  // Regex for (a), (b), a), b)
  const partRegex = /^(\([a-z]\)|[a-z]\))/i;
  // Regex for (i), (ii)
  // const subPartRegex = /^(\([ivx]+\)|[ivx]+\))/i;

  for (const pageData of state.extractedText) {
    for (const line of pageData.lines) {
      const text = line.text.trim();
      if (!text) continue;

      const qMatch = text.match(questionRegex);
      if (qMatch) {
        if (currentQuestion) {
          if (currentPart) currentQuestion.parts.push(currentPart);
          questions.push(currentQuestion);
          currentPart = null;
        }
        currentQuestion = {
          questionNumber: qMatch[1].replace(".", "").trim(),
          text: text.replace(qMatch[0], "").trim(),
          parts: [],
          page: pageData.page,
          yRange: { min: line.y, max: line.y },
          hasDiagram: false
        };
        continue;
      }

      const pMatch = text.match(partRegex);
      if (pMatch && currentQuestion) {
        if (currentPart) currentQuestion.parts.push(currentPart);
        currentPart = {
          label: pMatch[1].replace(/[()]/g, ""),
          text: text.replace(pMatch[0], "").trim()
        };
        currentQuestion.yRange.max = Math.max(currentQuestion.yRange.max, line.y);
        continue;
      }

      // If it's a subpart or continuation of text
      if (currentPart) {
        currentPart.text += " " + text;
        if (currentQuestion) currentQuestion.yRange.max = Math.max(currentQuestion.yRange.max, line.y);
      } else if (currentQuestion) {
        currentQuestion.text += " " + text;
        currentQuestion.yRange.max = Math.max(currentQuestion.yRange.max, line.y);
      }
    }
  }

  if (currentQuestion) {
    if (currentPart) currentQuestion.parts.push(currentPart);
    questions.push(currentQuestion);
  }

  return { ...state, questions };
}

import { ParserState } from "@/lib/parser/types";

export async function associateQuestions(state: ParserState): Promise<ParserState> {
  const updatedQuestions = [...state.questions];

  for (const diagram of state.diagrams) {
    if (!diagram.data) continue;

    // Find the question matching the diagram's questionNumber
    const diagramMatch = diagram.questionNumber.match(/\d+/);
    const diagramBaseNum = diagramMatch ? diagramMatch[0] : diagram.questionNumber.replace(/[^0-9]/g, "");

    let bestMatchIndex = updatedQuestions.findIndex(q => {
      const qMatch = q.questionNumber.match(/\d+/);
      const qBaseNum = qMatch ? qMatch[0] : q.questionNumber.replace(/[^0-9]/g, "");
      
      return qBaseNum !== "" && diagramBaseNum !== "" && qBaseNum === diagramBaseNum;
    });

    if (bestMatchIndex === -1) {
      // Try exact match first (in case questions have non-numeric identifiers)
      bestMatchIndex = updatedQuestions.findIndex(q => q.questionNumber.trim().toLowerCase() === diagram.questionNumber.trim().toLowerCase());
      
      // Try to match against parts if LLM only returned a part label like "a" or "(a)"
      if (bestMatchIndex === -1) {
        const dClean = diagram.questionNumber.replace(/[^a-z0-9]/gi, "").toLowerCase();
        if (dClean) {
          bestMatchIndex = updatedQuestions.findIndex(q => 
            q.parts.some(p => p.label.replace(/[^a-z0-9]/gi, "").toLowerCase() === dClean)
          );
        }
      }
    }

    if (bestMatchIndex !== -1) {
      updatedQuestions[bestMatchIndex].hasDiagram = true;
      updatedQuestions[bestMatchIndex].diagram = diagram.data;
    }
  }

  return { ...state, questions: updatedQuestions };
}

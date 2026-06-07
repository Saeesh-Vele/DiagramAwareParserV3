import { ParserState } from "@/lib/parser/types";

export async function associateQuestions(state: ParserState): Promise<ParserState> {
  const updatedQuestions = [...state.questions];

  for (const diagram of state.diagrams) {
    if (!diagram.data) continue;

    // Find the question matching the diagram's questionNumber
    const diagramMatch = diagram.questionNumber.match(/\d+/);
    const diagramBaseNum = diagramMatch ? diagramMatch[0] : diagram.questionNumber.replace(/[^0-9]/g, "");

    const bestMatchIndex = updatedQuestions.findIndex(q => {
      const qMatch = q.questionNumber.match(/\d+/);
      const qBaseNum = qMatch ? qMatch[0] : q.questionNumber.replace(/[^0-9]/g, "");
      
      return qBaseNum !== "" && diagramBaseNum !== "" && qBaseNum === diagramBaseNum;
    });

    if (bestMatchIndex !== -1) {
      updatedQuestions[bestMatchIndex].hasDiagram = true;
      updatedQuestions[bestMatchIndex].diagram = diagram.data;
    }
  }

  return { ...state, questions: updatedQuestions };
}

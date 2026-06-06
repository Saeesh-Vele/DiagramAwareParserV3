import { ParserState } from "@/lib/parser/types";

export async function associateQuestions(state: ParserState): Promise<ParserState> {
  const updatedQuestions = [...state.questions];

  for (const diagram of state.diagrams) {
    if (!diagram.data) continue;

    // Find the question matching the diagram's questionNumber
    const bestMatchIndex = updatedQuestions.findIndex(
      q => q.questionNumber === diagram.questionNumber || q.questionNumber === diagram.questionNumber.replace("Q", "")
    );

    if (bestMatchIndex !== -1) {
      updatedQuestions[bestMatchIndex].hasDiagram = true;
      updatedQuestions[bestMatchIndex].diagram = diagram.data;
    }
  }

  return { ...state, questions: updatedQuestions };
}

import { ParserState } from "@/lib/parser/types";

export async function generateJson(state: ParserState): Promise<ParserState> {
  const finalJson = {
    documentInfo: {
      pages: state.extractedText.length || 0
    },
    questions: state.questions.map(q => ({
      questionNumber: q.questionNumber,
      text: q.text,
      parts: q.parts.length > 0 ? q.parts : undefined,
      hasDiagram: q.hasDiagram,
      ...(q.hasDiagram && q.diagram ? {
        nodes: q.diagram.nodes,
        relationships: q.diagram.relationships,
        description: q.diagram.description
      } : {})
    }))
  };

  return { ...state, finalJson };
}

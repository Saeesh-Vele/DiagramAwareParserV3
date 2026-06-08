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
        diagramType: q.diagram.diagramType,
        components: q.diagram.components,
        nodes: q.diagram.nodes,
        connections: q.diagram.connections,
        relationships: q.diagram.relationships,
        textLabels: q.diagram.textLabels,
        description: q.diagram.description
      } : {})
    }))
  };

  return { ...state, finalJson };
}

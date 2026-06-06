import { ParserState, ExtractedDiagram } from "@/lib/parser/types";
import OpenAI from "openai";

export async function understandDiagrams(state: ParserState): Promise<ParserState> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "dummy",
  });

  const base64Pdf = state.buffer.toString("base64");

  try {
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are analyzing an educational exam paper PDF. Extract all diagrams found in the document. Return JSON only.
Output a JSON array of diagram objects. Each object MUST contain:
- "questionNumber": The question number this diagram belongs to (e.g. "Q1", "Q2"). Use the same numbering format as the text.
- "nodes": A list of node or component names (strings).
- "relationships": A list of relationship descriptions between nodes (strings, e.g. "A -> B").
- "description": A short description of the diagram.

Output strictly in this format:
{
  "diagrams": [
    {
      "questionNumber": "Q1",
      "nodes": ["Node1", "Node2"],
      "relationships": ["Node1 connects to Node2"],
      "description": "A simple graph"
    }
  ]
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64Pdf}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const diagrams: ExtractedDiagram[] = [];
    
    if (content) {
      const parsed = JSON.parse(content);
      if (parsed.diagrams && Array.isArray(parsed.diagrams)) {
        for (const d of parsed.diagrams) {
          diagrams.push({
            questionNumber: d.questionNumber,
            data: {
              nodes: d.nodes || [],
              relationships: d.relationships || [],
              description: d.description || ""
            }
          });
        }
      }
    }

    return { ...state, diagrams };
  } catch (error) {
    console.error("Diagram understanding error:", error);
    return state;
  }
}

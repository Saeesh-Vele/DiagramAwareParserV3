import { ParserState, ExtractedDiagram } from "@/lib/parser/types";
import OpenAI from "openai";

export async function understandDiagrams(state: ParserState): Promise<ParserState> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "dummy",
  });

  const base64Pdf = Buffer.from(state.buffer).toString("base64");

  try {
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert system designed to create "Digital Twins" of engineering diagrams (electrical circuits, mechanical trusses, logic gates, block diagrams, etc.).
Your job is to extract every minute detail required to mathematically or logically solve the problem shown in the diagram.
Missing a single connection, node label, component value, or source polarity will lead to catastrophic failure.

Here is the list of question numbers and their parts extracted from the text:
${state.questions.map(q => `Question ${q.questionNumber}: parts [${q.parts.map(p => p.label).join(", ")}]`).join("\n")}

For each diagram, extract an exhaustive JSON representation. The object MUST contain:
- "questionNumber": The FULL question number this diagram belongs to. You MUST use the main numeric question number from the list above (e.g., "1", "2"). If the diagram is under a sub-part, still use the main question number (e.g., "1", not "1a" or "a"). NEVER just write the sub-part like "a" or "Q(a)".
- "diagramType": A string representing the type of diagram (e.g., "Electrical Circuit", "Mechanical Truss", "Block Diagram", "Logic Circuit").
- "components": An array of all physical components/elements. Each must include:
    - "id": A unique identifier (e.g., "R1", "V1", "Gate1").
    - "type": Component type (e.g., "Resistor", "Voltage Source", "Op-Amp", "Beam", "AND Gate").
    - "value": Any numerical value and unit (e.g., "5 Ohms", "10V").
    - "properties": Specific details (e.g., "polarity: + up, - down", "orientation", "feedback loop").
- "nodes": An array of junction points or essential structural nodes.
    - "id": Node identifier (e.g., "Node A", "Node B", "Ground").
    - "labels": Any text associated with this node.
- "connections": An array detailing exactly how components and nodes connect.
    - "from": Component/Node ID.
    - "to": Component/Node ID.
    - "details": Specifics like "connected to non-inverting input", "in series with R2", "mesh 1", etc.
- "relationships": Any other relationships (optional).
- "textLabels": Any other text, formulas, or instructions written inside the diagram.
- "description": A comprehensive, highly detailed textual description of the entire diagram's layout and topology. Include all mesh, parallel/series reductions, and structural support types explicitly.

Output strictly in this format:
{
  "diagrams": [
    {
      "questionNumber": "1",
      "diagramType": "Electrical Circuit",
      "components": [{"id": "R1", "type": "Resistor", "value": "10 Ohms", "properties": "horizontal"}],
      "nodes": [{"id": "Node A", "labels": "A"}],
      "connections": [{"from": "V1", "to": "R1", "details": "series"}],
      "relationships": [],
      "textLabels": ["Find V_th"],
      "description": "A detailed description..."
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
              diagramType: d.diagramType,
              nodes: d.nodes || [],
              relationships: d.relationships || [],
              components: d.components || [],
              connections: d.connections || [],
              textLabels: d.textLabels || [],
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

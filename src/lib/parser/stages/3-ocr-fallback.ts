import { ParserState } from "@/lib/parser/types";
import OpenAI from "openai";

export async function fallbackOCR(state: ParserState): Promise<ParserState> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  if (!state.needsOCR) {
    return state;
  }

  console.log("Running OCR fallback on scanned/scrambled PDF using Gemini 2.5 Flash...");
  
  try {
    const base64Pdf = Buffer.from(state.buffer).toString("base64");
    
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all the text from this educational document. Group the text by page. Output strictly as JSON. Format: {\"pages\": [{\"page\": 1, \"text\": \"full page text here\", \"lines\": [{\"y\": 10, \"text\": \"first line\"}]}]} For the 'y' coordinate, just assign a sequential increasing number for each line (e.g. 100, 200, 300) so ordering is preserved."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64Pdf}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(resultText);
    
    console.log(`Gemini OCR extracted ${parsed.pages?.length || 0} pages of text.`);

    return { ...state, extractedText: parsed.pages || [] };
  } catch (error) {
    console.error("OCR error using Gemini:", error);
    return state;
  }
}

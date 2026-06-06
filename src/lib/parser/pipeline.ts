import { promises as fs } from "fs";
import os from "os";
import path from "path";

// Main state interface passing through the stages
import { ParserState } from "@/lib/parser/types";

import { classifyPdf } from "@/lib/parser/stages/1-classification";
import { extractText } from "@/lib/parser/stages/2-text-extraction";
import { fallbackOCR } from "@/lib/parser/stages/3-ocr-fallback";
import { extractQuestions } from "@/lib/parser/stages/4-question-extraction";
import { detectDiagrams } from "@/lib/parser/stages/5-diagram-detection";
import { understandDiagrams } from "@/lib/parser/stages/6-diagram-understanding";
import { associateQuestions } from "@/lib/parser/stages/7-question-association";
import { generateJson } from "@/lib/parser/stages/8-json-generation";

export async function runParserPipeline(fileBuffer: Buffer): Promise<Record<string, unknown> | undefined> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "parser-v3-"));
  const tempFilePath = path.join(tempDir, "input.pdf");
  await fs.writeFile(tempFilePath, fileBuffer);

  try {
    let state: ParserState = {
      buffer: fileBuffer,
      tempFilePath,
      extractedText: [],
      needsOCR: false,
      questions: [],
      diagrams: [],
    };

    console.log("Stage 1: Classification");
    state = await classifyPdf(state);

    console.log("Stage 2: Text Extraction");
    state = await extractText(state);

    console.log("Stage 3: OCR Fallback");
    state = await fallbackOCR(state);

    console.log("Stage 4: Question Extraction");
    state = await extractQuestions(state);

    console.log("Stage 5: Diagram Detection");
    state = await detectDiagrams(state);

    console.log("Stage 6: Diagram Understanding");
    state = await understandDiagrams(state);

    console.log("Stage 7: Question Association");
    state = await associateQuestions(state);

    console.log("Stage 8: JSON Generation");
    state = await generateJson(state);

    return state.finalJson;
  } finally {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true }).catch(console.error);
  }
}

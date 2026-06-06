import { ParserState } from "@/lib/parser/types";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractText(state: ParserState): Promise<ParserState> {
  if (state.needsOCR) {
    console.log("Skipping native text extraction as PDF needs OCR.");
    return state;
  }

  try {
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(state.buffer),
      standardFontDataUrl: "node_modules/pdfjs-dist/standard_fonts/",
    });
    const pdf = await loadingTask.promise;
    
    const extractedText = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const lines: { y: number; text: string }[] = [];
      let currentY: number | null = null;
      let currentLineText = "";

      type TextItem = { str: string; transform: number[] };
      
      // Sort items by Y, then by X
      const items = (textContent.items as TextItem[]).sort((a, b) => {
        // textContent.items transformation
        if (Math.abs(b.transform[5] - a.transform[5]) > 2) {
          return b.transform[5] - a.transform[5]; // Sort by Y (descending usually, depends on coordinate system)
        }
        return a.transform[4] - b.transform[4]; // Sort by X
      });

      for (const item of items) {
        const y = Math.round(item.transform[5]);
        if (currentY === null || Math.abs(currentY - y) > 3) {
          if (currentY !== null) {
            lines.push({ y: currentY, text: currentLineText.trim() });
          }
          currentY = y;
          currentLineText = item.str;
        } else {
          currentLineText += " " + item.str;
        }
      }
      
      if (currentY !== null) {
        lines.push({ y: currentY, text: currentLineText.trim() });
      }

      extractedText.push({
        page: i,
        text: lines.map(l => l.text).join("\n"),
        lines
      });
    }

    return { ...state, extractedText };
  } catch (error) {
    console.error("Text extraction error:", error);
    return { ...state, needsOCR: true };
  }
}

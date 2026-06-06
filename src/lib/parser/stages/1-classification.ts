import { ParserState } from "@/lib/parser/types";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Ensure worker is not used in Node environment

export async function classifyPdf(state: ParserState): Promise<ParserState> {
  // A simple heuristic: try to read the first page text.
  // If it has very little text, it's likely scanned.
  try {
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(state.buffer),
      standardFontDataUrl: "node_modules/pdfjs-dist/standard_fonts/",
    });
    const pdf = await loadingTask.promise;
    
    if (pdf.numPages === 0) {
      return { ...state, pdfType: "scanned", needsOCR: true };
    }

    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const textStr = textContent.items.map((item) => ("str" in item && typeof item.str === "string" ? item.str : "")).join(" ").trim();

    // Check for garbage text (broken CMAP)
    let garbageCount = 0;
    for (let i = 0; i < textStr.length; i++) {
      const code = textStr.charCodeAt(i);
      if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || (code >= 0x007f && code <= 0x009f)) {
        garbageCount++;
      }
    }
    const isGarbage = textStr.length > 0 && (garbageCount / textStr.length) > 0.1;

    // Check for scrambled CMAP (random ASCII chars mapping to glyphs)
    const commonWords = ["the", "and", "of", "to", "in", "is", "for", "with", "calculate", "explain", "determine", "find", "what", "how", "draw", "circuit"];
    let wordMatches = 0;
    const lowerText = textStr.toLowerCase();
    for (const word of commonWords) {
      const regex = new RegExp(`\\b${word}\\b`, "g");
      const matches = lowerText.match(regex);
      if (matches) {
        wordMatches += matches.length;
      }
    }
    
    // If it's a long text but has less than 3 common words, it's scrambled
    const isScrambled = textStr.length > 200 && wordMatches < 3;

    // Threshold for considering a document scanned or unreadable
    if (textStr.length < 50 || isGarbage || isScrambled) {
      console.log(`Classification: needsOCR=true (length: ${textStr.length}, isGarbage: ${isGarbage}, isScrambled: ${isScrambled})`);
      return { ...state, pdfType: "scanned", needsOCR: true };
    } else {
      console.log(`Classification: needsOCR=false`);
      // Could be hybrid, but we assume native if it has text
      return { ...state, pdfType: "native", needsOCR: false };
    }
  } catch (error) {
    console.error("Classification error:", error);
    // Fallback to scanned if parsing fails
    return { ...state, pdfType: "scanned", needsOCR: true };
  }
}

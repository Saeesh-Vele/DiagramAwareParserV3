export interface ParserState {
  buffer: Buffer;
  tempFilePath: string;
  pdfType?: "native" | "scanned" | "hybrid";
  extractedText: { page: number; text: string; lines: { y: number; text: string }[] }[];
  needsOCR: boolean;
  ocrText?: { page: number; text: string; lines: { y: number; text: string }[] }[];
  questions: ExtractedQuestion[];
  diagrams: ExtractedDiagram[];
  finalJson?: Record<string, unknown>;
}

export interface ExtractedQuestion {
  questionNumber: string;
  text: string;
  parts: { label: string; text: string }[];
  page: number;
  yRange: { min: number; max: number };
  hasDiagram: boolean;
  diagram?: ExtractedDiagramData;
}

export interface ExtractedDiagram {
  questionNumber: string;
  data: ExtractedDiagramData;
}

export interface ExtractedDiagramData {
  diagramType?: string;
  nodes?: any[];
  relationships?: any[];
  components?: any[];
  connections?: any[];
  textLabels?: any[];
  description: string;
}

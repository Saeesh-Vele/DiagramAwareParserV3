import { runParserPipeline } from "./src/lib/parser/pipeline";
import fs from "fs/promises";

async function testPipeline() {
  try {
    const pdfBuffer = await fs.readFile("/Users/saeeshsandipvele/Prototype/diagram-parser/test-exam.pdf");
    const json = await runParserPipeline(pdfBuffer);
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testPipeline();

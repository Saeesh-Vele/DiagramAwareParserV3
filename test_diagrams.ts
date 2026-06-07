import { understandDiagrams } from "./src/lib/parser/stages/6-diagram-understanding";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const buf = fs.readFileSync("/Users/saeeshsandipvele/PROTOTYPE V3/Adobe Scan 4 Jun 2026.pdf");
  const state: any = { buffer: buf.buffer, needsOCR: true, diagrams: [] };
  const out = await understandDiagrams(state);
  console.log(JSON.stringify(out.diagrams, null, 2));
}
run().catch(console.error);

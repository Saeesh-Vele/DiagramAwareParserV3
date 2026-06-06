import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";

async function testPdfSupport() {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "dummy",
  });

  try {
    const pdfBuffer = await fs.readFile("/Users/saeeshsandipvele/Prototype/diagram-parser/test-exam.pdf");
    const base64Pdf = pdfBuffer.toString("base64");

    const response = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all diagrams from this exam paper. Return JSON with a list of diagrams, each containing 'questionNumber' (e.g. Q1), 'nodes', 'relationships', and 'description'."
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

    console.log(response.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err);
  }
}

testPdfSupport();

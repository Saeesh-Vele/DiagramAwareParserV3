import { NextRequest, NextResponse } from "next/server";
import { runParserPipeline } from "@/lib/parser/pipeline";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Run the robust synchronous pipeline
    const finalJson = await runParserPipeline(buffer);

    return NextResponse.json(finalJson);
  } catch (error) {
    console.error("API /parse error:", error);
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
  }
}

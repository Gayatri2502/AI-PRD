import { NextResponse } from "next/server";
import { runAiTask } from "@/lib/ai";
import { aiRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = aiRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const output = await runAiTask(parsed.data);
    return NextResponse.json({ output });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI request failed" }, { status: 500 });
  }
}

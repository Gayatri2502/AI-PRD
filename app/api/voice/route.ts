import { sameOrigin } from "@/lib/origin";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/firebase/server";
import { reserveRequest, usageContext } from "@/lib/firebase/usage";
import { transcribe } from "@/lib/finance/providers";
export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!sameOrigin(req))
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    if (Number(req.headers.get("content-length") || 0) > 4_100_000)
      return NextResponse.json(
        { error: "Record a shorter voice note (maximum 4 MB)." },
        { status: 413 },
      );
    const data = await req.formData(),
      file = data.get("audio");
    if (
      data.get("consent") !== "true" ||
      !(file instanceof File) ||
      file.size < 256 ||
      file.size > 4_000_000 ||
      !file.type.startsWith("audio/")
    )
      return NextResponse.json(
        { error: "A valid audio note and processing consent are required." },
        { status: 400 },
      );
    await reserveRequest(user.id);
    const bytes = Buffer.from(await file.arrayBuffer());
    const transcript = await usageContext.run(user.id, () =>
      transcribe(bytes, file.name, file.type),
    );
    if (/^\s*\[(NO_SPEECH|UNREADABLE)\]\s*$/.test(transcript))
      return NextResponse.json(
        {
          error:
            "No clear speech was detected. Please record again closer to the microphone.",
        },
        { status: 422 },
      );
    return NextResponse.json(
      { transcript },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transcription failed";
    return NextResponse.json(
      {
        error: message.startsWith("AUTH:")
          ? "Please sign in again."
          : /^(CONFIG|PROVIDER):/.test(message)
            ? message
            : "Transcription unavailable. Check your daily allowance and retry.",
      },
      { status: message.startsWith("AUTH:") ? 401 : 503 },
    );
  }
}

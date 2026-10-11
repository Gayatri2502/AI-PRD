import { NextRequest, NextResponse, after } from "next/server";
import { attachVoiceMeter } from "@/lib/finance/voice-meter";
import { z } from "zod";
import { createHash } from "node:crypto";
import { currentUser, ownBusiness } from "@/lib/firebase/server";
import { reserveRequest } from "@/lib/firebase/usage";
import { sameOrigin } from "@/lib/origin";
import { realtimeConfig } from "@/lib/finance/realtime";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";
const input = z.object({
  businessId: z.string().uuid(),
  consent: z.literal(true),
  language: z.enum(["English", "Hindi", "Marathi", "Mixed"]),
  sdp: z.string().min(10).max(50000).startsWith("v=0"),
});

export async function GET() {
  try {
    await currentUser();
    return NextResponse.json({ available: Boolean((process.env.OPENAI_API_KEY || process.env.folio)) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ available: false }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const user = await currentUser();
    if (Number(req.headers.get("content-length") || 0) > 60000)
      return NextResponse.json({ error: "Session request too large" }, { status: 413 });
    const body = input.parse(await req.json());
    const business = await ownBusiness(body.businessId, user.id);
    const key = (process.env.OPENAI_API_KEY || process.env.folio);
    if (!key) return NextResponse.json({ error: "OpenAI voice is not configured. Add the server-only OPENAI_API_KEY in Vercel." }, { status: 503 });
    await reserveRequest(user.id);
    const form = new FormData();
    form.set("sdp", body.sdp);
    form.set("session", JSON.stringify(realtimeConfig(business.data || {}, body.language)));
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "OpenAI-Safety-Identifier": createHash("sha256").update(user.id).digest("hex") },
      body: form,
      signal: AbortSignal.timeout(40000),
    });
    if (!response.ok) return NextResponse.json({ error: response.status === 429 ? "OpenAI voice quota or billing limit reached. Check your OpenAI API account." : "OpenAI could not start voice. Check API billing, model access and key permissions." }, { status: 502 });
    const callId = response.headers.get("location")?.split("/").pop();
    if (!callId || !/^rtc_[A-Za-z0-9_-]+$/.test(callId)) throw Error("Missing call identity");
    const meter = await attachVoiceMeter(user.id, callId, key);
    after(() => meter.done);
    return NextResponse.json({ sdp: await response.text() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const auth = e instanceof Error && e.message.startsWith("AUTH:");
    return NextResponse.json({ error: auth ? "Please sign in again." : e instanceof z.ZodError ? "A valid voice offer, language and consent are required." : "Unable to start voice. Check your connection and daily allowance." }, { status: auth ? 401 : 400 });
  }
}

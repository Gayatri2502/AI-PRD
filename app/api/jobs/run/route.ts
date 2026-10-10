import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runOne } from "@/lib/finance/jobs";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const provided =
    req.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (
    !expected ||
    expected.length < 32 ||
    provided.length !== expected.length ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ worked: await runOne() });
  } catch {
    return NextResponse.json(
      { error: "Worker unavailable; check server configuration." },
      { status: 503 },
    );
  }
}

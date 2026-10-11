import { sameOrigin } from "@/lib/origin";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/firebase/server";
import { reserveRequest, usageContext } from "@/lib/firebase/usage";
import { firebaseGenerate } from "@/lib/firebase/ai";
export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!sameOrigin(req))
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    await reserveRequest(user.id);
    const reply = await usageContext.run(user.id, () =>
      firebaseGenerate(
        "For this fictional business, explain in two short sentences what is known and ask one simple missing-information question for a business-loan project report. Do not invent financial numbers.",
        {
          name: "Sample Services",
          location: "Pune",
          industry: "Bookkeeping services",
          purpose: "Expanding the team",
          confirmedFinancials: false,
        },
      ),
    );
    return NextResponse.json(
      { reply },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const auth = e instanceof Error && e.message.startsWith("AUTH:");
    return NextResponse.json(
      {
        error: auth
          ? "Sign in to try the live AI example."
          : "AI example unavailable. Check your daily allowance or try again shortly.",
      },
      { status: auth ? 401 : 503 },
    );
  }
}

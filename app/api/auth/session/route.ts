import { NextRequest, NextResponse } from "next/server";
import { authAdmin } from "@/lib/firebase/admin";
export const runtime = "nodejs";
const cookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("origin") !== req.nextUrl.origin)
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const { idToken } = await req.json();
    if (typeof idToken !== "string" || idToken.length > 10000)
      throw Error("Invalid token");
    const token = await authAdmin().verifyIdToken(idToken, true);
    if (Date.now() / 1000 - token.auth_time > 300) throw Error("Sign in again");
    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    const session = await authAdmin().createSessionCookie(idToken, {
      expiresIn,
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("__session", session, {
      ...cookie,
      maxAge: expiresIn / 1000,
    });
    return res;
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not establish a session. Check Firebase setup and sign in again.",
      },
      { status: 401 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", "", { ...cookie, maxAge: 0 });
  return res;
}

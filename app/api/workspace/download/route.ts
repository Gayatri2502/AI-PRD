import { NextRequest, NextResponse } from "next/server";
import { currentUser, adminDB, checked } from "@/lib/firebase/server";
import { z } from "zod";
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const reportId = z
      .string()
      .uuid()
      .parse(req.nextUrl.searchParams.get("id"));
    const format = z
      .enum(["pdf", "docx", "xlsx"])
      .parse(req.nextUrl.searchParams.get("format"));
    const db = adminDB();
    const report = checked(
      await db
        .from("report_versions")
        .select("paths")
        .eq("id", reportId)
        .eq("user_id", user.id)
        .single(),
    );
    if (!report.paths[format])
      return NextResponse.json(
        { error: "Report file not available" },
        { status: 404 },
      );
    const signed = checked(
      await db.storage
        .from("business-private")
        .createSignedUrl(report.paths[format], 60, { download: true }),
    );
    return NextResponse.redirect(signed.signedUrl);
  } catch {
    return NextResponse.json(
      { error: "Sign in and select your own report." },
      { status: 403 },
    );
  }
}

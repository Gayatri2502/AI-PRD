import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  adminDB,
  currentUser,
  ownBusiness,
  checked,
} from "@/lib/firebase/server";
import { initialInput, inputSchema } from "@/lib/finance/model";
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";
const id = z.string().uuid();
const safeError = (e: unknown) => {
  const message = e instanceof Error ? e.message : "Request failed";
  const known = /^(CONFIG|AUTH|NOT_FOUND|INPUT|CONFLICT|DATABASE|LIMIT):/.test(
    message,
  );
  return NextResponse.json(
    {
      error: known
        ? message
        : e instanceof z.ZodError
          ? e.issues.map((x) => x.path.join(".") + ": " + x.message).join("; ")
          : "Unable to complete request. Please retry.",
    },
    {
      status: message.startsWith("AUTH:")
        ? 401
        : message.startsWith("CONFIG:")
          ? 503
          : message.startsWith("NOT_FOUND:")
            ? 404
            : 400,
    },
  );
};
export async function GET() {
  try {
    const user = await currentUser(),
      db = adminDB();
    const businesses = checked(
      await db
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
    );
    const business = businesses?.[0] || null;
    if (!business)
      return NextResponse.json({ business: null, user: { email: user.email } });
    const results = await Promise.all(
      [
        "conversations",
        "uploads",
        "extracted_figures",
        "report_versions",
        "jobs",
      ].map((t) =>
        db
          .from(t)
          .select("*")
          .eq("user_id", user.id)
          .eq("business_id", business.id)
          .order("created_at", { ascending: t === "conversations" })
          .limit(100),
      ),
    );
    return NextResponse.json(
      {
        business,
        user: { email: user.email },
        ...Object.fromEntries(
          ["conversations", "uploads", "figures", "reports", "jobs"].map(
            (k, n) => [k, checked(results[n])],
          ),
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return safeError(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    if (
      req.headers.get("origin") &&
      req.headers.get("origin") !== req.nextUrl.origin
    )
      throw Error("INPUT: Invalid origin.");
    if (Number(req.headers.get("content-length") || 0) > 1000000)
      throw Error("INPUT: Request too large.");
    const body = await req.json();
    const user = await currentUser(),
      db = adminDB();
    if (body.action === "create") {
      const existing = checked(
        await db
          .from("businesses")
          .select("id")
          .eq("user_id", user.id)
          .limit(1),
      );
      if (existing?.length) throw Error("INPUT: A workspace already exists.");
      return NextResponse.json(
        checked(
          await db
            .from("businesses")
            .insert({ user_id: user.id, data: initialInput })
            .select()
            .single(),
        ),
      );
    }
    const businessId = id.parse(body.businessId);
    const business = await ownBusiness(businessId, user.id);
    if (body.action === "save") {
      const data = z
        .object({
          profile: z.record(z.string().max(4000)),
          assumptions: z.record(z.unknown()),
          historical: z.array(z.unknown()),
          reportType: z.enum(["project", "cma"]),
          style: z.enum(["classic", "modern", "consulting"]),
          units: z.enum(["rupees", "lakhs", "crores"]),
          charts: z.boolean(),
          lenderRequirements: z.string().max(8000),
          confirmed: z.boolean(),
        })
        .passthrough()
        .parse(body.data);
      const revision = z.number().int().parse(body.revision);
      const rows = checked(
        await db
          .from("businesses")
          .update({
            data,
            name: data.profile.name || "My business",
            revision: revision + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", businessId)
          .eq("user_id", user.id)
          .eq("revision", revision)
          .select(),
      );
      if (!rows?.length)
        throw Error(
          "CONFLICT: This draft changed in another tab. Reload before editing.",
        );
      return NextResponse.json(rows[0]);
    }
    if (body.action === "prepare-upload") {
      const name = z
          .string()
          .max(180)
          .parse(body.name)
          .replace(/[^\p{L}\p{N}._ -]/gu, "_"),
        size = z
          .number()
          .int()
          .positive()
          .max(25 * 1024 * 1024)
          .parse(body.size),
        kind = z.enum(["audio", "financial", "style"]).parse(body.kind),
        mime = z.string().max(100).parse(body.mime);
      const ext = name.split(".").pop()?.toLowerCase();
      if (
        !(
          kind === "audio"
            ? ["webm", "mp3", "wav", "m4a", "ogg", "mp4"]
            : ["pdf", "docx", "xlsx", "csv", "png", "jpg", "jpeg"]
        ).includes(ext || "")
      )
        throw Error("INPUT: File type not supported.");
      const uploadId = randomUUID(),
        path = `${user.id}/${businessId}/${uploadId}/${name}`;
      checked(
        await db
          .from("uploads")
          .insert({
            id: uploadId,
            user_id: user.id,
            business_id: businessId,
            name,
            path,
            mime,
            size,
            kind,
            status: "pending-upload",
          }),
      );
      return NextResponse.json({ uploadId, path });
    }
    if (body.action === "process-upload") {
      const uploadId = id.parse(body.uploadId);
      const upload = checked(
        await db
          .from("uploads")
          .select("*")
          .eq("id", uploadId)
          .eq("user_id", user.id)
          .eq("business_id", businessId)
          .single(),
      );
      const info = await db.storage.from("business-private").info(upload.path);
      if (info.error || Number(info.data?.size) !== upload.size)
        throw Error("INPUT: Upload incomplete or file size mismatch.");
      if (upload.kind === "style") {
        return enqueue("format", { uploadId });
      }
      if (!body.consent)
        throw Error(
          "INPUT: Confirm external processing before sending files or audio to providers.",
        );
      checked(
        await db
          .from("uploads")
          .update({ status: "queued" })
          .eq("id", uploadId),
      );
      return enqueue(upload.kind === "audio" ? "transcribe" : "extract", {
        uploadId,
        consent: true,
      });
    }
    if (body.action === "conversation") {
      if (!body.consent)
        throw Error("INPUT: Confirm external processing first.");
      const transcript = z.string().min(1).max(30000).parse(body.transcript);
      const message = checked(
        await db
          .from("conversations")
          .insert({
            business_id: businessId,
            user_id: user.id,
            role: "user",
            content: transcript,
          })
          .select()
          .single(),
      );
      const records = checked(
        await db
          .from("extracted_figures")
          .select("data")
          .eq("user_id", user.id)
          .eq("business_id", businessId)
          .eq("reviewed", true)
          .limit(100),
      );
      return enqueue("conversation", {
        records,
        transcript,
        language: z
          .enum(["English", "Hindi", "Marathi", "Mixed"])
          .parse(body.language),
        profile: business.data.profile,
        messageId: message.id,
        consent: true,
      });
    }
    if (body.action === "edit-transcript") {
      const messageId = id.parse(body.messageId),
        content = z.string().min(1).max(30000).parse(body.content);
      checked(
        await db
          .from("conversations")
          .update({ content })
          .eq("id", messageId)
          .eq("user_id", user.id)
          .eq("business_id", businessId)
          .eq("role", "user"),
      );
      return NextResponse.json({ ok: true });
    }
    if (body.action === "review-figure") {
      checked(
        await db
          .from("extracted_figures")
          .update({ reviewed: Boolean(body.reviewed) })
          .eq("id", id.parse(body.figureId))
          .eq("user_id", user.id)
          .eq("business_id", businessId),
      );
      return NextResponse.json({ ok: true });
    }
    if (body.action === "generate") {
      const data = inputSchema.parse(body.data);
      if (!data.confirmed)
        throw Error(
          "INPUT: Confirm your business summary and assumptions first.",
        );
      const unreviewed = checked(
        await db
          .from("extracted_figures")
          .select("id")
          .eq("user_id", user.id)
          .eq("business_id", businessId)
          .eq("reviewed", false),
      );
      if (unreviewed?.length)
        throw Error("INPUT: Review extracted figures before generating.");
      checked(
        await db
          .from("assumptions")
          .insert({
            user_id: user.id,
            business_id: businessId,
            data: data.assumptions,
            confirmed_at: new Date().toISOString(),
          }),
      );
      return enqueue("report", { input: data, consent: Boolean(body.consent) });
    }
    if (body.action === "retry") {
      const job = checked(
        await db
          .from("jobs")
          .select("*")
          .eq("id", id.parse(body.jobId))
          .eq("user_id", user.id)
          .eq("business_id", businessId)
          .single(),
      );
      if (job.status !== "failed")
        throw Error("INPUT: Only failed jobs can be retried.");
      return enqueue(job.kind, job.payload);
    }
    throw Error("INPUT: Unknown action.");
    async function enqueue(kind: string, payload: unknown) {
      const job = checked(
        await db.rpc("enqueue_job", {
          owner_id: user.id,
          business: businessId,
          job_kind: kind,
          job_payload: payload,
        }),
      );
      after(async () => {
        try {
          const { runOne } = await import("@/lib/finance/jobs");
          await runOne(user.id);
        } catch {
          /* Durable queued job remains recoverable by the worker. */
        }
      });
      return NextResponse.json(job, { status: 202 });
    }
  } catch (e) {
    return safeError(e);
  }
}

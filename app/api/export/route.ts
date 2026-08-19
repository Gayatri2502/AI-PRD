import { NextResponse } from "next/server";
import { toDocx, toHtml, toJson, toMarkdown } from "@/lib/export";
import { exportRequestSchema } from "@/lib/validation";

const contentTypes = { markdown: "text/markdown", html: "text/html", json: "application/json", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", pdf: "application/pdf" };

export async function POST(request: Request) {
  const parsed = exportRequestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { title, content, format } = parsed.data;
  if (format === "docx") return new Response(await toDocx(title, content), { headers: { "content-type": contentTypes.docx } });
  if (format === "html") return new Response(toHtml(title, content), { headers: { "content-type": contentTypes.html } });
  if (format === "json") return new Response(toJson(title, content), { headers: { "content-type": contentTypes.json } });
  if (format === "pdf") return new Response("PDF export is routed through @react-pdf/renderer in the production worker.", { headers: { "content-type": "text/plain" } });
  return new Response(toMarkdown(title, content), { headers: { "content-type": contentTypes.markdown } });
}

import { toHtml, toJson, toMarkdown } from "@/lib/export";
import type { ExportFormat } from "@/types/export";

export function exportString(title: string, content: string, format: Exclude<ExportFormat, "pdf" | "docx">) {
  if (format === "html") return toHtml(title, content);
  if (format === "json") return toJson(title, content);
  return toMarkdown(title, content);
}

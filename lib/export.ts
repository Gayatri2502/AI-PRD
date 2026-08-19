import { Document, Packer, Paragraph, TextRun } from "docx";

export function toMarkdown(title: string, content: string) { return `# ${title}\n\n${content.trim()}\n`; }
export function toJson(title: string, content: string) { return JSON.stringify({ title, content, exportedAt: new Date().toISOString() }, null, 2); }
export function toHtml(title: string, content: string) {
  const body = content.split("\n").map((line) => `<p>${escapeHtml(line)}</p>`).join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
}
export async function toDocx(title: string, content: string) {
  const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 36 })] }), ...content.split("\n").map((line) => new Paragraph(line))] }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }

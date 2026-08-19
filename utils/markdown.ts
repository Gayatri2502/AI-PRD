export function heading(anchor: string) { return anchor.replace(/^#+\s*/, "").trim(); }
export function wordCount(markdown: string) { return markdown.split(/\s+/).filter(Boolean).length; }

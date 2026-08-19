export type ExportFormat = "pdf" | "docx" | "markdown" | "html" | "json";
export type ExportRequest = { title: string; content: string; format: ExportFormat };

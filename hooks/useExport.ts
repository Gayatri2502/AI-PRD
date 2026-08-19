"use client";

import type { ExportFormat } from "@/types/export";

export function useExport() {
  async function exportFile(title: string, content: string, format: ExportFormat) {
    const response = await fetch("/api/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, content, format }) });
    if (!response.ok) throw new Error("Export failed");
    return response.blob();
  }
  return { exportFile };
}

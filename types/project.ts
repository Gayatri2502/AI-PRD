export type ProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ProjectSummary = { id: string; name: string; description: string; status: ProjectStatus; updatedAt: string };
export type PrdDocument = { id: string; title: string; content: string; projectId: string; updatedAt: string };

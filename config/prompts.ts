export type PromptKind =
  | "generate-prd"
  | "improve-prd"
  | "rewrite"
  | "summarize"
  | "generate-apis"
  | "generate-database"
  | "generate-user-stories"
  | "generate-acceptance-criteria"
  | "generate-timeline"
  | "generate-risks"
  | "generate-wireframes"
  | "generate-architecture"
  | "generate-mermaid"
  | "generate-sprint-plan"
  | "chat-with-prd";

export const promptModules: Record<PromptKind, string> = {
  "generate-prd": "Create a complete, implementation-ready PRD with every required section, concise decisions, assumptions, and acceptance criteria.",
  "improve-prd": "Improve clarity, completeness, measurable requirements, risk coverage, and delivery sequencing without changing the product intent.",
  rewrite: "Rewrite the selected PRD text for the requested audience and tone while preserving technical meaning.",
  summarize: "Summarize the PRD into executive, product, engineering, and launch-readiness views.",
  "generate-apis": "Generate REST API resources, request/response schemas, auth rules, errors, and pagination conventions.",
  "generate-database": "Generate a normalized relational schema with indexes, constraints, retention notes, and migration risks.",
  "generate-user-stories": "Generate INVEST-style user stories grouped by persona and release phase.",
  "generate-acceptance-criteria": "Generate testable acceptance criteria using Given/When/Then and edge-case coverage.",
  "generate-timeline": "Generate a phased timeline with dependencies, milestones, staffing assumptions, and confidence levels.",
  "generate-risks": "Generate product, technical, security, compliance, and delivery risks with mitigations.",
  "generate-wireframes": "Generate wireframe suggestions as screen inventories, layout notes, and interaction states.",
  "generate-architecture": "Generate system architecture, components, integrations, data flow, and operational concerns.",
  "generate-mermaid": "Generate valid Mermaid diagrams for ERD, sequence, and architecture views.",
  "generate-sprint-plan": "Generate sprint goals, backlog slices, owners, dependencies, and demo outcomes.",
  "chat-with-prd": "Answer questions using the PRD context first. Flag uncertainty and suggest concrete PRD edits when useful."
};

export function buildSystemPrompt(kind: PromptKind) {
  return [
    "You are AI PRD, a senior product and engineering copilot.",
    "Return practical, production-ready output with clear headings and no filler.",
    "When generating requirements, include measurable acceptance criteria and implementation risks.",
    promptModules[kind]
  ].join("\n");
}

export type DiagramKind = "mermaid" | "flow" | "erd" | "architecture";
export type DiagramSpec = { kind: DiagramKind; title: string; source: string };

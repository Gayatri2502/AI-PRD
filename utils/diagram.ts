import type { DiagramSpec } from "@/types/diagram";

export function mermaidBlock(source: string) { return `\`\`\`mermaid\n${source.trim()}\n\`\`\``; }
export function createArchitectureDiagram(title: string, source: string): DiagramSpec { return { kind: "architecture", title, source }; }

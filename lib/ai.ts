import OpenAI from "openai";
import { buildSystemPrompt, type PromptKind } from "@/config/prompts";
import { PRD_SECTIONS } from "@/lib/constants";

export async function runAiTask({ kind, input, context }: { kind: PromptKind; input: string; context?: string }) {
  if (!process.env.OPENAI_API_KEY) return demoAiResponse(kind, input, context);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.35,
    messages: [
      { role: "system", content: buildSystemPrompt(kind) },
      { role: "user", content: [context ? `Context:\n${context}` : "", `Input:\n${input}`, kind === "generate-prd" ? `Required sections:\n${PRD_SECTIONS.join("\n")}` : ""].filter(Boolean).join("\n\n") }
    ]
  });
  return response.choices[0]?.message.content?.trim() ?? "";
}

function demoAiResponse(kind: PromptKind, input: string, context?: string) {
  if (kind === "generate-prd") {
    return [`# Generated PRD`, ...PRD_SECTIONS.map((section) => `\n## ${section}\n\nDraft content for ${section.toLowerCase()} based on: ${input}`)].join("\n");
  }
  return [
    `## Demo AI Response`,
    `OpenAI is not configured yet, so this local response shows the app flow without external calls.`,
    ``,
    `**Requested task:** ${kind}`,
    `**User input:** ${input}`,
    context ? `**Context detected:** ${context.slice(0, 220)}${context.length > 220 ? "..." : ""}` : "",
    ``,
    `Add OPENAI_API_KEY to .env.local to enable live AI generation.`
  ].filter(Boolean).join("\n");
}

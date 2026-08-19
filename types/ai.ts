export type AiRole = "system" | "user" | "assistant";
export type AiMessage = { role: AiRole; content: string };
export type AiTaskResult = { output: string; tokens?: number };

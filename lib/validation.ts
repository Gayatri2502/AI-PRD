import { z } from "zod";
import type { PromptKind } from "@/config/prompts";

export const ideaInputSchema = z.object({ idea: z.string().min(20), answers: z.record(z.string()).default({}) });
export const aiRequestSchema = z.object({ kind: z.custom<PromptKind>(), projectId: z.string().optional(), prdId: z.string().optional(), input: z.string().min(1), context: z.string().optional() });
export const exportRequestSchema = z.object({ format: z.enum(["pdf", "docx", "markdown", "html", "json"]), title: z.string().min(1), content: z.string().min(1) });
export const projectSchema = z.object({ name: z.string().min(2), description: z.string().min(10) });

"use client";

import { useMemo, useState } from "react";
import { Bot, Download, FileText, History, Send, Sparkles } from "lucide-react";
import { PRD_SECTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const starter = `# AI PRD\n\n## Executive Summary\n\nDescribe the product, users, value, and target launch.\n\n## Problem Statement\n\nClarify the pain, urgency, and current alternatives.\n\n## Functional Requirements\n\n- Generate a complete PRD from an idea.\n- Ask clarification questions before drafting.\n- Export to PDF, DOCX, Markdown, HTML, and JSON.`;

export default function WorkspacePage() {
  const [content, setContent] = useState(starter);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>(["Ask me to improve a section, generate APIs, create risks, or summarize the PRD."]);
  const wordCount = useMemo(() => content.split(/\s+/).filter(Boolean).length, [content]);

  async function askAi() {
    if (!input.trim()) return;
    setMessages((current) => [...current, input]);
    const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "chat-with-prd", input, context: content }) });
    const json = await response.json();
    setMessages((current) => [...current, json.output ?? json.error ?? "No response"]);
    setInput("");
  }

  async function exportMarkdown() {
    const response = await fetch("/api/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "AI PRD", content, format: "markdown" }) });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ai-prd.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <main className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr_22rem]"><aside className="border-r bg-card/40 p-4"><h1 className="font-semibold">Workspace</h1><nav className="mt-6 space-y-2 text-sm">{PRD_SECTIONS.map((section) => <a key={section} href={`#${section.replaceAll(" ", "-")}`} className="block rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground">{section}</a>)}</nav></aside><section className="p-6"><header className="mb-5 flex items-center justify-between"><div><h2 className="text-2xl font-semibold">Rich PRD Editor</h2><p className="text-sm text-muted-foreground">Auto-save ready, Markdown friendly, {wordCount} words.</p></div><div className="flex gap-2"><Button className="bg-secondary text-foreground"><History className="h-4 w-4" />Versions</Button><Button onClick={exportMarkdown}><Download className="h-4 w-4" />Export</Button></div></header><Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[72vh] font-mono leading-7" /></section><aside className="border-l bg-card/40 p-4"><div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><h3 className="font-semibold">AI Assistant</h3></div><div className="mt-5 space-y-3">{messages.map((message, index) => <div key={`${message}-${index}`} className="rounded-md border bg-background p-3 text-sm text-muted-foreground">{message}</div>)}</div><div className="mt-4 flex gap-2"><Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Improve the API section..." className="min-h-20" /><Button onClick={askAi} className="h-20 px-3"><Send className="h-4 w-4" /></Button></div><Button className="mt-3 w-full" onClick={() => setInput("Generate the missing acceptance criteria and risks.")}><Sparkles className="h-4 w-4" />Suggested prompt</Button></aside></main>;
}

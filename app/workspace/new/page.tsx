"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CLARIFICATION_QUESTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [idea, setIdea] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createProject() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: idea.slice(0, 60) || "Untitled PRD", description: idea }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.formErrors?.[0] ?? json.error ?? "Could not create project");
      router.push(`/workspace/${json.id ?? "demo"}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create project");
    } finally {
      setBusy(false);
    }
  }

  return <main className="mx-auto min-h-screen max-w-4xl bg-background px-6 py-12"><h1 className="text-4xl font-semibold">Create a PRD</h1><p className="mt-3 text-muted-foreground">Start with the idea, answer clarification questions, then generate the full document.</p>{step === 1 ? <section className="mt-8 rounded-lg border bg-card p-6"><Textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Describe the product idea, audience, desired outcome, and constraints." /><Button className="mt-4" disabled={idea.length < 20} onClick={() => setStep(2)}>Continue</Button></section> : <section className="mt-8 rounded-lg border bg-card p-6"><div className="space-y-4">{CLARIFICATION_QUESTIONS.map((question) => <label key={question} className="block"><span className="text-sm font-medium">{question}</span><Input className="mt-2" value={answers[question] ?? ""} onChange={(e) => setAnswers((current) => ({ ...current, [question]: e.target.value }))} /></label>)}</div>{error && <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button className="mt-6" onClick={createProject} disabled={busy}>{busy ? "Creating..." : "Generate workspace"}</Button></section>}</main>;
}

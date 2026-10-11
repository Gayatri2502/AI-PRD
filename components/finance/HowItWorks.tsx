"use client";
import { useState } from "react";
import {
  Mic,
  ScanLine,
  Calculator,
  FileCheck2,
  Play,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { readJSON } from "@/lib/http";
const steps = [
  {
    icon: Mic,
    title: "Tell your story",
    text: "Speak or type about your business. English, Hindi and Marathi are supported.",
    detail: "“I run a bookkeeping business in Pune and want to grow my team.”",
  },
  {
    icon: ScanLine,
    title: "Review the details",
    text: "Check extracted figures and answer one missing-information question at a time.",
    detail:
      "Business: services · Location: Pune · Purpose: expansion. Financial values remain unknown until you supply them.",
  },
  {
    icon: Calculator,
    title: "Calculate clearly",
    text: "Deterministic calculations turn confirmed assumptions into financial schedules.",
    detail:
      "Project cost = owner contribution + borrowing. Missing amounts are never silently replaced with zero.",
  },
  {
    icon: FileCheck2,
    title: "Create your draft",
    text: "Review a Project Report or CMA Report, then choose an export format.",
    detail:
      "Reports keep assumptions, year labels and supporting references visible. Review before sharing with a lender.",
  },
];
export default function HowItWorks() {
  const [step, setStep] = useState(0),
    [reply, setReply] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function demo() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/demo", { method: "POST" });
      if (response.status === 401)
        throw Error("Sign in to try the live AI example.");
      const data = await readJSON(response);
      setReply(data.reply);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again shortly.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="how-it-works"
      className="landing-section interactive-flow"
      aria-labelledby="interactive-heading"
    >
      <div className="flow-heading">
        <div>
          <p className="eyebrow">FROM CONVERSATION TO CLARITY</p>
          <h2 id="interactive-heading">See how your story becomes a report.</h2>
          <p>Select a step to explore the process.</p>
        </div>
        <img
          src="/finance-orbit.svg"
          width="180"
          height="150"
          alt="Illustration of financial documents connected to an assistant"
        />
      </div>
      <div
        className="flow-nodes"
        role="tablist"
        aria-label="Report preparation steps"
      >
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.title}
              id={`flow-tab-${i}`}
              role="tab"
              aria-selected={step === i}
              aria-controls="flow-detail"
              tabIndex={step === i ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const n = (i + (e.key === "ArrowRight" ? 1 : 3)) % 4;
                  setStep(n);
                  document.getElementById(`flow-tab-${n}`)?.focus();
                }
              }}
              onClick={() => setStep(i)}
              className={step === i ? "active" : ""}
            >
              <Icon size={26} />
              <span>0{i + 1}</span>
              <strong>{s.title}</strong>
              {i < 3 && <ArrowRight className="flow-arrow" size={18} />}
            </button>
          );
        })}
      </div>
      <div
        id="flow-detail"
        role="tabpanel"
        aria-labelledby={`flow-tab-${step}`}
        className="flow-detail"
      >
        <p>{steps[step].text}</p>
        <div className="flow-example">{steps[step].detail}</div>
      </div>
      <div className="live-demo">
        <div>
          <h3>Try the connected AI assistant</h3>
          <p>
            Use a fictional service business to see a real AI follow-up.
            Requires sign-in and uses one daily request. No personal documents
            are sent.
          </p>
        </div>
        <button className="primary" disabled={busy} onClick={() => void demo()}>
          {busy ? <Loader2 className="spin" size={18} /> : <Play size={18} />}{" "}
          {busy ? "Thinking…" : "Run live example"}
        </button>
        {reply && (
          <p className="demo-reply" role="status">
            {reply}
          </p>
        )}
        {error && (
          <p role="status">
            {error} <Link href="/login">Sign in</Link>
          </p>
        )}
      </div>
    </section>
  );
}

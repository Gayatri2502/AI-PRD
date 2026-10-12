"use client";
import { useMemo } from "react";
import Decimal from "decimal.js";
import { Calculator, CheckCircle2, Clock3 } from "lucide-react";
import { calculate } from "@/lib/finance/engine";
import { inputSchema, labels, ReportInput } from "@/lib/finance/model";

export default function CalculationActivity({ data, jobs }: { data: ReportInput; jobs: { id: string; kind: string; status: string; progress?: number }[] }) {
  const state = useMemo(() => {
    const parsed = inputSchema.safeParse(data);
    if (!parsed.success) return { result: null, missing: [...new Set(parsed.error.issues.map(issue => {
      const key = String(issue.path.at(-1));
      return `${issue.path.includes("opening") ? "Opening balance: " : ""}${labels[key] || key.replace(/([A-Z])/g, " $1")}`;
    }))], error: "" };
    try { return { result: calculate(parsed.data), missing: [], error: "" }; }
    catch (e) { return { result: null, missing: [], error: e instanceof Error ? e.message : "Check your financial assumptions." }; }
  }, [data]);
  const a = data.assumptions;
  const sum = (values: string[]) => values.every(v => typeof v === "string" && /^\d+(\.\d{1,2})?$/.test(v)) ? values.reduce((n, v) => n.plus(v), new Decimal(0)).toFixed(2) : null;
  const money = (value: string | null | undefined) => value == null ? "Awaiting inputs" : `₹${new Decimal(value).div(data.units === "crores" ? 10000000 : data.units === "lakhs" ? 100000 : 1).toFixed(2)}${data.units === "rupees" ? "" : ` ${data.units}`}`;
  const first = state.result?.metrics.find(m => m.year === a.startYear);
  const active = jobs.filter(j => ["queued", "running"].includes(j.status));
  const cards = [
    { title: "Project investment", value: money(sum([a.capex, a.workingCapitalMargin, a.otherProjectCosts])), formula: "Fixed assets + working capital cash + setup costs" },
    { title: "Funding available", value: money(sum([a.ownerContribution, a.loan])), formula: "Owner contribution + proposed term loan" },
    { title: "First-year profit", value: money(first?.pat), formula: "Sales − costs − depreciation − interest − tax" },
    { title: "Debt repayment cover", value: first ? first.dscr === null ? "Not applicable" : `${new Decimal(first.dscr).toFixed(2)}×` : "Awaiting inputs", formula: "Profit + depreciation + term interest, divided by term debt payments" },
  ];
  return <section className="calculation-activity" aria-label="Live financial calculations">
    <div className="calculation-heading"><div><p className="eyebrow">FOLIO’S CALCULATION DESK</p><h2><Calculator size={21} /> Your numbers, taking shape</h2><p>Recalculated from your current draft. All figures remain provisional until you review them.</p></div><span className="draft-pill">{state.result ? "Draft calculated" : "Collecting inputs"}</span></div>
    <div className="calculation-cards">{cards.map(card => <article key={card.title}><span>{card.title}</span><strong>{card.value}</strong><small>{card.formula}</small></article>)}</div>
    <div className="calculation-status" role="status">{state.result ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}<span>{state.result ? `Calculated ${a.years} projected years, ${state.result.schedule.length} repayment months, cash flow and balance-sheet checks.` : "Waiting for complete financial inputs before calculating profit, cash flow and repayment ratios."}</span></div>
    {active.map(job => <p className="calculation-job" key={job.id}>{({ report: "Preparing report", conversation: "Understanding business details", extraction: "Reading financial records" } as Record<string,string>)[job.kind] || "Processing documents"} · {job.status}{typeof job.progress === "number" ? ` · ${job.progress}%` : ""}</p>)}
    {(state.missing.length > 0 || state.error || !!state.result?.issues.length) && <details><summary>{state.missing.length ? `${state.missing.length} inputs need attention` : "Review calculation checks"}</summary>{state.error && <p>{state.error}</p>}<ul>{(state.missing.length ? state.missing : state.result?.issues || []).map(value => <li key={value}>{value}</li>)}</ul></details>}
    {state.result && <details><summary>Calculation method & reconciliation</summary><p>{state.result.method}</p><ul>{state.result.checks.map(check => <li key={check.year}>FY {check.year}: balance-sheet difference {money(check.balanceDifference)} · cash difference {money(check.cashDifference)} · loan difference {money(check.loanDifference)}</li>)}</ul></details>}
  </section>;
}

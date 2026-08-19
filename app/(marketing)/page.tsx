import Link from "next/link";
import { ArrowRight, Bot, Check, FileText, GitBranch, Sparkles } from "lucide-react";
import { pricingPlans } from "@/config/pricing";
import { appConfig } from "@/config/app";

const features = [
  { icon: Bot, title: "AI clarification flow", body: "Turns vague ideas into structured discovery questions before drafting." },
  { icon: FileText, title: "Complete PRD generator", body: "Generates requirements, user stories, APIs, schemas, risks, timeline, and rollout plans." },
  { icon: GitBranch, title: "Diagrams included", body: "Produces Mermaid and architecture guidance alongside the written PRD." }
];

export default function MarketingPage() {
  return (
    <main className="min-h-screen theme-grid bg-background">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold">AI PRD</Link>
        <div className="hidden gap-6 text-sm text-muted-foreground md:flex"><a href="#features">Features</a><a href="#templates">Templates</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div>
        <Link href="/login" className="rounded-md border px-4 py-2 text-sm">Sign in</Link>
      </nav>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div className="animate-float-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground"><Sparkles className="h-4 w-4 text-primary" /> Product strategy at AI speed</div>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-normal md:text-7xl">{appConfig.name}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{appConfig.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground">Start drafting <ArrowRight className="h-4 w-4" /></Link><Link href="/workspace/new" className="inline-flex h-11 items-center rounded-md border px-5 text-sm font-medium">Try workspace</Link></div>
        </div>
        <div className="gradient-border rounded-lg"><div className="glass-panel rounded-lg p-5"><div className="rounded-md border bg-background/70 p-4"><div className="mb-4 flex items-center justify-between"><span className="text-sm font-medium">Generated PRD</span><span className="text-xs text-emerald-400">Auto-saved</span></div>{["Executive Summary", "Functional Requirements", "API Specification", "Risk Analysis", "Sprint Plan"].map((item) => <div key={item} className="mb-3 rounded-md border bg-card p-3 text-sm">{item}</div>)}</div></div></div>
      </section>
      <section id="features" className="mx-auto grid max-w-7xl gap-4 px-6 py-12 md:grid-cols-3">{features.map((feature) => <article key={feature.title} className="rounded-lg border bg-card p-6"><feature.icon className="mb-5 h-6 w-6 text-primary" /><h2 className="font-semibold">{feature.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.body}</p></article>)}</section>
      <section id="templates" className="mx-auto max-w-7xl px-6 py-12"><h2 className="text-3xl font-semibold">Templates</h2><div className="mt-6 grid gap-4 md:grid-cols-3">{["SaaS MVP", "Mobile App", "Internal Platform"].map((template) => <div key={template} className="rounded-lg border bg-card p-5"><h3 className="font-medium">{template}</h3><p className="mt-2 text-sm text-muted-foreground">Structured starter sections, diagrams, and delivery planning.</p></div>)}</div></section>
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-12"><h2 className="text-3xl font-semibold">Pricing</h2><div className="mt-6 grid gap-4 md:grid-cols-3">{pricingPlans.map((plan) => <article key={plan.id} className="rounded-lg border bg-card p-6"><h3 className="text-xl font-semibold">{plan.name}</h3><p className="mt-3 text-3xl font-bold">${plan.monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p><ul className="mt-5 space-y-2 text-sm text-muted-foreground">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="h-4 w-4 text-emerald-400" />{feature}</li>)}</ul></article>)}</div></section>
      <section id="faq" className="mx-auto max-w-7xl px-6 py-12"><h2 className="text-3xl font-semibold">FAQ</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{["Can I export PRDs?", "Does it support teams?", "Can I bring my own OpenAI key?", "Is Supabase required?"].map((q) => <div key={q} className="rounded-lg border bg-card p-5"><h3 className="font-medium">{q}</h3><p className="mt-2 text-sm text-muted-foreground">Yes. The app is wired for production integrations and can be configured through environment variables.</p></div>)}</div></section>
      <footer className="mx-auto flex max-w-7xl justify-between px-6 py-10 text-sm text-muted-foreground"><span>AI PRD</span><span>Build better requirements.</span></footer>
    </main>
  );
}

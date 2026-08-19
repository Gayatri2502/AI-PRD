import Link from "next/link";
import { Bell, CreditCard, FileText, Plus, Search, Users } from "lucide-react";
import { dashboardNav } from "@/config/navigation";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const projects = ["AI PRD", "Creator CRM", "Usage Analytics Portal"];
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[17rem_1fr]">
      <aside className="border-r bg-card/40 p-5"><h1 className="text-lg font-semibold">AI PRD</h1><nav className="mt-8 space-y-1">{dashboardNav.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><item.icon className="h-4 w-4" />{item.label}</Link>)}</nav></aside>
      <section className="p-6">
        <header className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-3xl font-semibold">Dashboard</h2><p className="mt-1 text-sm text-muted-foreground">Projects, credits, analytics, templates, team, and billing in one place.</p></div><div className="flex items-center gap-2"><div className="hidden h-10 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground md:flex"><Search className="h-4 w-4" />Search</div><Bell className="h-5 w-5 text-muted-foreground" /><Link href="/workspace/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" />New PRD</Link></div></header>
        <div className="mt-8 grid gap-4 md:grid-cols-4"><Card className="p-5"><FileText className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-semibold">12</p><p className="text-sm text-muted-foreground">Recent projects</p></Card><Card className="p-5"><CreditCard className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-semibold">748</p><p className="text-sm text-muted-foreground">AI credits</p></Card><Card className="p-5"><Users className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-semibold">5</p><p className="text-sm text-muted-foreground">Team members</p></Card><Card className="p-5"><p className="text-2xl font-semibold">93%</p><p className="mt-5 text-sm text-muted-foreground">Requirements coverage</p></Card></div>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><Card className="p-5"><h3 className="font-semibold">Recent Projects</h3><div className="mt-4 space-y-3">{projects.map((project) => <Link key={project} href="/workspace/demo" className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent"><span>{project}</span><span className="text-muted-foreground">Open</span></Link>)}</div></Card><Card className="p-5"><h3 className="font-semibold">Templates</h3><div className="mt-4 space-y-3 text-sm text-muted-foreground"><p>SaaS MVP PRD</p><p>Mobile App PRD</p><p>Enterprise Integration PRD</p></div></Card></div>
      </section>
    </main>
  );
}

import { adminNav } from "@/config/navigation";
import { Card } from "@/components/ui/card";

export default function AdminPage() {
  return <main className="min-h-screen bg-background p-6"><h1 className="text-3xl font-semibold">Admin Dashboard</h1><p className="mt-2 text-sm text-muted-foreground">Users, subscriptions, templates, analytics, and logs.</p><div className="mt-8 grid gap-4 md:grid-cols-4">{adminNav.map((item) => <Card key={item.href} className="p-5"><item.icon className="h-5 w-5 text-primary" /><h2 className="mt-4 font-medium">{item.label}</h2><p className="mt-2 text-sm text-muted-foreground">Operational controls and audit visibility.</p></Card>)}</div></main>;
}

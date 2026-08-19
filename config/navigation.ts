import { BarChart3, CreditCard, FileText, Home, LayoutTemplate, MessageSquare, Settings, Shield, Users } from "lucide-react";

export const marketingNav = [
  { label: "Features", href: "#features" },
  { label: "Templates", href: "#templates" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" }
];

export const dashboardNav = [
  { label: "Overview", href: "/dashboard", icon: Home },
  { label: "Projects", href: "/dashboard/projects", icon: FileText },
  { label: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
  { label: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings }
];

export const adminNav = [
  { label: "Admin", href: "/admin", icon: Shield },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Templates", href: "/admin/templates", icon: LayoutTemplate },
  { label: "Logs", href: "/admin/logs", icon: BarChart3 }
];

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { pricingPlans } from "@/config/pricing";
import { absoluteUrl } from "@/lib/utils";

export async function POST(request: Request) {
  const { planId, interval = "monthly" } = await request.json();
  const plan = pricingPlans.find((item) => item.id === planId);
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ url: "/dashboard?billing=demo", demoMode: true });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: absoluteUrl("/dashboard/billing?success=true"),
    cancel_url: absoluteUrl("/dashboard/billing?canceled=true"),
    line_items: [{ price_data: { currency: "usd", recurring: { interval: interval === "yearly" ? "year" : "month" }, product_data: { name: `AI PRD ${plan.name}` }, unit_amount: (interval === "yearly" ? plan.yearly : plan.monthly) * 100 }, quantity: 1 }]
  });
  return NextResponse.json({ url: session.url });
}

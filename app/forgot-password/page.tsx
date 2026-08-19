"use client";

import { useState } from "react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      setMessage("Password reset is disabled in local demo mode. Add Supabase env vars to enable it.");
      return;
    }
    const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/dashboard/settings` });
    setMessage(error ? error.message : "Password reset email sent.");
  }
  return <main className="flex min-h-screen items-center justify-center bg-background px-6"><form onSubmit={submit} className="w-full max-w-sm rounded-lg border bg-card p-6"><h1 className="text-2xl font-semibold">Reset password</h1><Input className="mt-6" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />{message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}<Button className="mt-5 w-full">Send reset link</Button></form></main>;
}

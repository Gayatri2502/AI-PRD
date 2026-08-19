"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
      router.push("/dashboard");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/dashboard` } });
    setMessage(error ? error.message : "Check your email to verify your account.");
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-6"><form onSubmit={submit} className="w-full max-w-sm rounded-lg border bg-card p-6"><h1 className="text-2xl font-semibold">Create account</h1><p className="mt-2 text-sm text-muted-foreground">Start with credits and a clean workspace. Blank env uses local demo mode.</p><div className="mt-6 space-y-3"><Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /><Input placeholder="Password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>{message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}<Button className="mt-5 w-full">Create account</Button><Link href="/login" className="mt-4 block text-sm text-muted-foreground">Already have an account?</Link></form></main>;
}

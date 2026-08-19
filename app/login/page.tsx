"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const redirect = params.get("redirect") ?? "/dashboard";
    if (!isSupabaseConfigured()) {
      router.push(redirect);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return setError(authError.message);
    router.push(redirect);
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-6"><form onSubmit={submit} className="w-full max-w-sm rounded-lg border bg-card p-6"><h1 className="text-2xl font-semibold">Welcome back</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to continue your PRDs. Local demo mode works without credentials.</p><div className="mt-6 space-y-3"><Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /><Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>{error && <p className="mt-3 text-sm text-destructive">{error}</p>}<Button className="mt-5 w-full">Sign in</Button><div className="mt-4 flex justify-between text-sm text-muted-foreground"><Link href="/signup">Create account</Link><Link href="/forgot-password">Forgot password</Link></div></form></main>;
}

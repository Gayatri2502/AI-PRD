"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/auth-client";

const AuthContext = createContext<{ user: User | null; loading: boolean; demoMode: boolean }>({ user: null, loading: true, demoMode: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const demoMode = !isSupabaseConfigured();
  const supabase = useMemo(() => demoMode ? null : createSupabaseBrowserClient(), [demoMode]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  return <AuthContext.Provider value={{ user, loading, demoMode }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() { return useContext(AuthContext); }

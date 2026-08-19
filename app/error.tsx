"use client";

import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" />
        <h1 className="text-2xl font-semibold">Something needs attention</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
      </section>
    </main>
  );
}

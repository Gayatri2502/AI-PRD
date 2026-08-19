"use client";

import { useState } from "react";

export function useChat(context = "") {
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  async function send(input: string) {
    setLoading(true);
    setMessages((current) => [...current, input]);
    const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "chat-with-prd", input, context }) });
    const json = await response.json();
    setMessages((current) => [...current, json.output ?? json.error ?? "Request failed"]);
    setLoading(false);
  }
  return { messages, loading, send };
}

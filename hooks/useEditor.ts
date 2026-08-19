"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

export function useEditor(initialContent: string) {
  const [content, setContent] = useState(initialContent);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounced = useDebounce(content, 900);
  useEffect(() => { if (debounced) setSavedAt(new Date()); }, [debounced]);
  return { content, setContent, savedAt };
}

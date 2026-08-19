"use client";

import { useEffect, useState } from "react";
import type { ProjectSummary } from "@/types/project";

export function useProject() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  useEffect(() => { fetch("/api/projects").then((res) => res.json()).then((json) => setProjects(json.projects ?? [])).catch(() => setProjects([])); }, []);
  return { projects };
}

"use client";

import { createContext, useContext, useState } from "react";

const ProjectContext = createContext<{ activeProjectId: string | null; setActiveProjectId: (id: string | null) => void }>({ activeProjectId: null, setActiveProjectId: () => undefined });

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  return <ProjectContext.Provider value={{ activeProjectId, setActiveProjectId }}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() { return useContext(ProjectContext); }

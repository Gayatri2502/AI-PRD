import { create } from "zustand";

type ProjectState = { activeProjectId: string | null; setActiveProjectId: (activeProjectId: string | null) => void };
export const useProjectStore = create<ProjectState>((set) => ({ activeProjectId: null, setActiveProjectId: (activeProjectId) => set({ activeProjectId }) }));

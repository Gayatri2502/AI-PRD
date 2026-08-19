import { create } from "zustand";

type EditorState = { content: string; dirty: boolean; setContent: (content: string) => void; markSaved: () => void };
export const useEditorStore = create<EditorState>((set) => ({ content: "", dirty: false, setContent: (content) => set({ content, dirty: true }), markSaved: () => set({ dirty: false }) }));

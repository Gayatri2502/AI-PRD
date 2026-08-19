import { create } from "zustand";

type ChatState = { messages: string[]; addMessage: (message: string) => void; clear: () => void };
export const useChatStore = create<ChatState>((set) => ({ messages: [], addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })), clear: () => set({ messages: [] }) }));

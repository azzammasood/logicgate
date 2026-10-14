import { create } from "zustand";
import type { CompilerInput } from "@/lib/compiler";

/**
 * The Visual Builder's in-memory state, mirrored so the pseudocode sidebar can
 * compile it in the browser on every edit — no waiting for the debounced
 * autosave and a server round-trip.
 */
interface LiveDraftState {
  definitionId: string | null;
  input: CompilerInput | null;
  setDraft: (definitionId: string, input: CompilerInput) => void;
  clearDraft: (definitionId: string) => void;
}

export const useLiveDraftStore = create<LiveDraftState>((set) => ({
  definitionId: null,
  input: null,
  setDraft: (definitionId, input) => set({ definitionId, input }),
  clearDraft: (definitionId) =>
    set((s) => (s.definitionId === definitionId ? { definitionId: null, input: null } : s)),
}));

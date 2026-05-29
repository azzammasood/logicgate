import { create } from "zustand";

interface ActionOverlayState {
  active: boolean;
  message: string;
  show: (message: string) => void;
  hide: () => void;
}

export const useActionOverlay = create<ActionOverlayState>((set) => ({
  active: false,
  message: "",
  show: (message) => set({ active: true, message }),
  hide: () => set({ active: false }),
}));

/** Convenience helpers usable inside react-query callbacks (no hooks). */
export const actionOverlay = {
  show: (message: string) => useActionOverlay.getState().show(message),
  hide: () => useActionOverlay.getState().hide(),
};

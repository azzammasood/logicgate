import { create } from "zustand";

export type PreferencesSection = "ai" | "appearance";

interface UiState {
  sidebarOpen: boolean;
  activeTab: string;
  /** Opens the account Preferences dialog (from the account menu or the AI banner). */
  preferencesOpen: boolean;
  /** Which section the Preferences dialog should show. */
  preferencesSection: PreferencesSection;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setPreferencesOpen: (open: boolean) => void;
  setPreferencesSection: (section: PreferencesSection) => void;
  /** Open Preferences directly on a given section (defaults to AI). */
  openPreferences: (section?: PreferencesSection) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeTab: "builder",
  preferencesOpen: false,
  preferencesSection: "ai",
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setPreferencesOpen: (preferencesOpen) => set({ preferencesOpen }),
  setPreferencesSection: (preferencesSection) => set({ preferencesSection }),
  openPreferences: (section = "ai") =>
    set({ preferencesOpen: true, preferencesSection: section }),
}));


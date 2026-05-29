import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  currentWorkspaceId: string | null;
  setWorkspace: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspaceId: null,
      setWorkspace: (currentWorkspaceId) => set({ currentWorkspaceId }),
    }),
    { name: "logicgate-workspace" }
  )
);


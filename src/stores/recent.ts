import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecentState {
  /** Definition ids, most-recently-opened first. */
  recentIds: string[];
  pushRecent: (id: string) => void;
}

/**
 * Tracks which definitions the user has opened recently so the command palette
 * can surface those instead of the entire catalog. Persisted to localStorage.
 */
export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      recentIds: [],
      pushRecent: (id) =>
        set((s) => ({
          recentIds: [id, ...s.recentIds.filter((x) => x !== id)].slice(0, 12),
        })),
    }),
    { name: "logicgate-recent-definitions" }
  )
);

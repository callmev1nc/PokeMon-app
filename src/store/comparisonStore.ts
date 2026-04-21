import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ComparisonState {
  ids: string[];
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  isInComparison: (productId: string) => boolean;
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      ids: [],
      add: (id: string) => {
        const ids = get().ids;
        if (ids.length >= 4 || ids.includes(id)) return;
        set({ ids: [...ids, id] });
      },
      remove: (id: string) => set({ ids: get().ids.filter(i => i !== id) }),
      clear: () => set({ ids: [] }),
      isInComparison: (id: string) => get().ids.includes(id),
    }),
    { name: "pokemon-comparison" }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 20;

interface RecentlyViewedState {
  ids: string[];
  addViewed: (productId: string) => void;
  getViewedIds: () => string[];
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      ids: [],

      addViewed: (productId: string) => {
        const ids = get().ids;
        // Remove duplicate if exists, then prepend to front, cap at MAX_ITEMS
        const filtered = ids.filter((id) => id !== productId);
        const updated = [productId, ...filtered].slice(0, MAX_ITEMS);
        set({ ids: updated });
      },

      getViewedIds: () => {
        return get().ids;
      },
    }),
    { name: "pokemon-recently-viewed" }
  )
);

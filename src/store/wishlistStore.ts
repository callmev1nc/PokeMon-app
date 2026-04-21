import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  ids: string[];
  toggle: (productId: string) => void;
  isWished: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],

      toggle: (productId: string) => {
        const ids = get().ids;
        if (ids.includes(productId)) {
          set({ ids: ids.filter((id) => id !== productId) });
        } else {
          set({ ids: [...ids, productId] });
        }
      },

      isWished: (productId: string) => {
        return get().ids.includes(productId);
      },

      clear: () => set({ ids: [] }),
    }),
    { name: "pokemon-wishlist" }
  )
);

export function getWishlistCount(ids: string[]): number {
  return ids.length;
}

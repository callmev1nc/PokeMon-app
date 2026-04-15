import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity: number) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);

        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, product.stock);
          if (newQty <= 0) return;
          set({
            items: items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: newQty } : i
            ),
          });
        } else {
          const qty = Math.min(quantity, product.stock);
          if (qty <= 0) return;
          set({ items: [...items, { product, quantity: qty }] });
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId
              ? { ...i, quantity: Math.min(quantity, i.product.stock) }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "pokemon-cart",
    }
  )
);

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    if (item.product.price === null) return sum;
    return sum + item.product.price * item.quantity;
  }, 0);
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

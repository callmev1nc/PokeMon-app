import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, CartItem } from "@/lib/types";

const CART_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CartState {
  items: CartItem[];
  savedAt: number;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

function isExpired(savedAt: number): boolean {
  return Date.now() - savedAt > CART_EXPIRY_MS;
}

// Parse expiry once on init, not on every read
let _cartExpiryChecked = false;
function checkCartExpiry(): void {
  if (_cartExpiryChecked) return;
  _cartExpiryChecked = true;
  try {
    const raw = localStorage.getItem("pokemon-cart");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.savedAt && isExpired(parsed.state.savedAt)) {
        localStorage.removeItem("pokemon-cart");
      }
    }
  } catch {
    localStorage.removeItem("pokemon-cart");
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      savedAt: Date.now(),

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
            savedAt: Date.now(),
          });
        } else {
          const qty = Math.min(quantity, product.stock);
          if (qty <= 0) return;
          set({ items: [...items, { product, quantity: qty }], savedAt: Date.now() });
        }
      },

      removeItem: (productId: string) => {
        set({
          items: get().items.filter((i) => i.product.id !== productId),
          savedAt: Date.now(),
        });
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
          savedAt: Date.now(),
        });
      },

      clearCart: () => set({ items: [], savedAt: Date.now() }),
    }),
    {
      name: "pokemon-cart",
      storage: createJSONStorage(() => {
        checkCartExpiry();
        return localStorage;
      }),
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

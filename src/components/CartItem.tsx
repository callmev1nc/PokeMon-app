"use client";

import type { CartItem as CartItemType } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";

function formatPrice(price: number | null): string {
  if (price === null) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN").format(price * 1000) + " đ";
}

export default function CartItem({ item }: { item: CartItemType }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const lineTotal =
    item.product.price !== null
      ? item.product.price * item.quantity
      : null;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {item.product.name}
        </p>
        <p className="text-xs text-slate-400">
          {item.product.displayType} · {item.product.series}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {formatPrice(item.product.price)} / thẻ
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            className="px-2 py-1 text-slate-600 hover:bg-slate-100 text-xs"
          >
            -
          </button>
          <span className="px-2 py-1 text-xs font-medium min-w-[24px] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() =>
              updateQuantity(item.product.id, item.quantity + 1)
            }
            className="px-2 py-1 text-slate-600 hover:bg-slate-100 text-xs"
          >
            +
          </button>
        </div>
        <div className="text-right min-w-[70px]">
          <p className="text-sm font-semibold text-slate-800">
            {lineTotal !== null
              ? new Intl.NumberFormat("vi-VN").format(lineTotal * 1000) + " đ"
              : "—"}
          </p>
        </div>
        <button
          onClick={() => removeItem(item.product.id)}
          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
          aria-label="Xóa"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

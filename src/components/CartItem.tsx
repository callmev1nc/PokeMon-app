"use client";

import type { CartItem as CartItemType } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import { formatPrice, formatNumber } from "@/lib/format";

export default function CartItem({ item }: { item: CartItemType }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const locale = useLocaleStore((s) => s.locale);

  const displayPrice = (price: number | null): string => {
    if (price === null) return t("contact.price", locale);
    return formatPrice(price);
  };

  const lineTotal =
    item.product.price !== null
      ? item.product.price * item.quantity
      : null;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800/50 last:border-0 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-amber-400 transition-colors">
          {item.product.name}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {item.product.displayType} &middot; {item.product.series}
        </p>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          {displayPrice(item.product.price)} <span className="text-slate-600 font-normal">{t("cart.perCard", locale)}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-slate-700/50 rounded-lg overflow-hidden bg-slate-800/30">
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            className="px-2 py-1.5 text-slate-500 hover:bg-slate-700/50 hover:text-amber-400 text-xs font-bold transition-colors"
          >
            -
          </button>
          <span className="px-2 py-1.5 text-xs font-bold min-w-[24px] text-center text-slate-300">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            className="px-2 py-1.5 text-slate-500 hover:bg-slate-700/50 hover:text-amber-400 text-xs font-bold transition-colors"
          >
            +
          </button>
        </div>
        <div className="text-right min-w-[70px]">
          <p className="text-sm font-bold text-amber-400">
            {lineTotal !== null
              ? formatNumber(lineTotal * 1000) + " đ"
              : "—"}
          </p>
        </div>
        <button
          onClick={() => removeItem(item.product.id)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Remove"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

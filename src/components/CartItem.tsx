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
    <div className="flex items-start gap-3 py-3 border-b border-slate-200 dark:border-slate-800/50 last:border-0 group">
      {item.product.imageUrl ? (
        <img src={item.product.imageUrl} alt={item.product.name} className="w-10 h-14 object-contain rounded-lg bg-white shrink-0" />
      ) : (
        <div className="w-10 h-14 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-300 dark:text-slate-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.41a2.25 2.25 0 0 1 3.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-amber-400 transition-colors">
          {item.product.name}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          {item.product.displayType} &middot; {item.product.series}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {displayPrice(item.product.price)} <span className="text-slate-400 dark:text-slate-600 font-normal">{t("cart.perCard", locale)}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500 text-sm font-bold transition-colors min-w-[32px] text-center active:bg-slate-300 dark:active:bg-slate-600"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="px-2 py-2 text-sm font-bold min-w-[32px] text-center text-slate-700 dark:text-slate-200">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            className="px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-amber-500 text-sm font-bold transition-colors min-w-[32px] text-center active:bg-slate-300 dark:active:bg-slate-600"
            aria-label="Increase quantity"
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
          className="p-2 rounded-lg text-slate-400 dark:text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Remove item"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

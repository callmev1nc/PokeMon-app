"use client";

import { useCartStore, getCartTotal } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import { formatPrice, formatNumber } from "@/lib/format";

export default function CheckoutSummary() {
  const items = useCartStore((s) => s.items);
  const total = getCartTotal(items);
  const locale = useLocaleStore((s) => s.locale);

  const displayPrice = (price: number | null): string => {
    if (price === null) return t("contact.price", locale);
    return formatPrice(price);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-400 dark:text-slate-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        </div>
        <p className="text-slate-500 font-medium">{t("cart.empty", locale)}</p>
        <a
          href="/"
          className="inline-block mt-3 text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors"
        >
          {t("common.backToShop", locale)}
        </a>
      </div>
    );
  }

  return (
    <div className="vault-card overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-500/10 bg-gradient-to-r from-amber-500/5 to-transparent">
        <h3 className="text-amber-400 tracking-wider text-lg" style={{ fontFamily: "var(--font-display)" }}>
          {t("checkout.orderDetail", locale)}{" "}
          <span className="text-slate-400 dark:text-slate-500 font-body text-sm font-normal" style={{ fontFamily: "var(--font-body)" }}>
            ({t("cart.itemCount", locale).replace("{count}", String(items.length))})
          </span>
        </h3>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800/50">
        {items.map((item) => (
          <div key={item.product.id} className="px-5 py-3.5 flex items-center gap-3">
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
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{item.product.name}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {item.product.displayType} &middot; {item.product.series} &middot;{" "}
                <span className="font-mono">{item.product.code}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {item.quantity} x {displayPrice(item.product.price)}
              </p>
              <p className="text-sm font-bold text-amber-400">
                {item.product.price !== null
                  ? formatNumber(item.product.price * item.quantity * 1000) + " đ"
                  : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 bg-gradient-to-r from-amber-500/5 to-transparent border-t border-amber-500/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-400">{t("cart.total", locale)}</span>
          <span className="text-2xl font-bold text-amber-400" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
            {formatNumber(total * 1000)} đ
          </span>
        </div>
      </div>
    </div>
  );
}

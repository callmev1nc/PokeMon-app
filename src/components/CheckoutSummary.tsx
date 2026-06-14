"use client";

import { useMemo } from "react";
import { useCartStore, getCartTotal } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import { formatPrice, formatNumber } from "@/lib/format";

export default function CheckoutSummary() {
  const items = useCartStore((s) => s.items);
  const total = useMemo(() => getCartTotal(items), [items]);
  const locale = useLocaleStore((s) => s.locale);

  const customerStr = typeof window !== "undefined" ? sessionStorage.getItem("customerInfo") : null;
  const customer = customerStr ? JSON.parse(customerStr) : null;
  const deliveryMethod = customer?.deliveryMethod || "shopee";
  const shippingCost = deliveryMethod === "shopee" ? 15000 : 0;

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
      <div className="px-5 py-4 border-b border-slate-200 dark:border-amber-500/10 bg-gradient-to-r from-amber-500/5 to-transparent">
        <h3 className="text-amber-600 dark:text-amber-400 tracking-wider text-lg" style={{ fontFamily: "var(--font-display)" }}>
          {t("checkout.orderDetail", locale)}{" "}
          <span className="text-slate-500 dark:text-slate-500 font-body text-sm font-normal" style={{ fontFamily: "var(--font-body)" }}>
            ({t("cart.itemCount", locale).replace("{count}", String(items.length))})
          </span>
        </h3>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800/50">
        {items.map((item) => (
          <div key={item.product.id} className="px-5 py-3.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{item.product.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">
                {item.product.displayType} &middot; {item.product.series} &middot;{" "}
                <span className="font-mono">{item.product.code}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {item.quantity} x {displayPrice(item.product.price)}
              </p>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {item.product.price !== null
                  ? formatNumber(item.product.price * item.quantity * 1000) + " đ"
                  : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 bg-gradient-to-r from-amber-500/5 to-transparent border-t border-slate-200 dark:border-amber-500/10">
        {shippingCost > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">{t("customer.shippingFee", locale)}</span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{formatNumber(shippingCost)} đ</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t("cart.total", locale)}</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
            {formatNumber(total * 1000 + shippingCost)} đ
          </span>
        </div>
        {deliveryMethod === "grab" && (
          <p className="text-xs text-green-500 mt-1.5 font-medium flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            {t("customer.grabFeeNote", locale)}
          </p>
        )}
      </div>
    </div>
  );
}

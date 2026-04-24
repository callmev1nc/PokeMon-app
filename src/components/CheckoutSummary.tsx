"use client";

import { useCartStore, getCartTotal } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

export default function CheckoutSummary() {
  const items = useCartStore((s) => s.items);
  const total = getCartTotal(items);
  const locale = useLocaleStore((s) => s.locale);

  const formatPrice = (price: number | null): string => {
    if (price === null) return t("contact.price", locale);
    return new Intl.NumberFormat("vi-VN").format(price * 1000) + " đ";
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-200">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        </div>
        <p className="text-slate-400 font-medium">{t("cart.empty", locale)}</p>
        <a
          href="/"
          className="inline-block mt-3 text-brand hover:underline text-sm font-semibold"
        >
          {t("common.backToShop", locale)}
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-yellow/20 bg-gradient-to-r from-brand-yellow/5 to-transparent">
        <h3 className="font-bold text-slate-800" style={{ fontFamily: "var(--font-display)" }}>
          {t("checkout.orderDetail", locale)}{" "}
          <span className="text-slate-400 font-normal text-sm">
            ({t("cart.itemCount", locale).replace("{count}", String(items.length))})
          </span>
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((item) => (
          <div key={item.product.id} className="px-5 py-3.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{item.product.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {item.product.displayType} &middot; {item.product.series} &middot;{" "}
                <span className="font-mono">{item.product.code}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">
                {item.quantity} x {formatPrice(item.product.price)}
              </p>
              <p className="text-sm font-bold text-slate-800">
                {item.product.price !== null
                  ? new Intl.NumberFormat("vi-VN").format(item.product.price * item.quantity * 1000) + " đ"
                  : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 bg-gradient-to-r from-brand-yellow/5 to-transparent border-t border-brand-yellow/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">{t("cart.total", locale)}</span>
          <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
            {new Intl.NumberFormat("vi-VN").format(total * 1000)} đ
          </span>
        </div>
      </div>
    </div>
  );
}

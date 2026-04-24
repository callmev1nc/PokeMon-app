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
      <div className="text-center py-8">
        <p className="text-slate-400">{t("cart.empty", locale)}</p>
        <a
          href="/"
          className="inline-block mt-4 text-brand hover:underline text-sm font-medium"
        >
          {t("common.backToShop", locale)}
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">
          {t("checkout.orderDetail", locale)} <span className="text-slate-400 font-normal">({t("cart.itemCount", locale).replace("{count}", String(items.length))})</span>
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((item) => (
          <div key={item.product.id} className="px-5 py-3.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {item.product.name}
              </p>
              <p className="text-xs text-slate-400">
                {item.product.displayType} &middot; {item.product.series} &middot; <span className="font-mono">{item.product.code}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">
                {item.quantity} x {formatPrice(item.product.price)}
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {item.product.price !== null
                  ? new Intl.NumberFormat("vi-VN").format(
                      item.product.price * item.quantity * 1000
                    ) + " đ"
                  : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-600">{t("cart.total", locale)}</span>
          <span className="text-2xl font-bold text-brand">
            {new Intl.NumberFormat("vi-VN").format(total * 1000)} đ
          </span>
        </div>
      </div>
    </div>
  );
}

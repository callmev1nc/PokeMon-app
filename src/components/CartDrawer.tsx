"use client";

import { useCartStore, getCartTotal, getCartItemCount } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import CartItem from "./CartItem";

export default function CartDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = getCartTotal(items);
  const count = getCartItemCount(items);
  const locale = useLocaleStore((s) => s.locale);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`cart-drawer fixed top-0 right-0 h-full w-full max-w-md shadow-2xl z-50 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/10">
          <div>
            <h2 className="text-xl text-amber-400 tracking-wider" style={{ fontFamily: "var(--font-display)" }}>
              {t("cart.title", locale)}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {t("cart.itemCount", locale).replace("{count}", String(count))}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-amber-400 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300 dark:text-slate-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-500">{t("cart.empty", locale)}</p>
              <p className="text-xs mt-1 text-slate-400 dark:text-slate-600">{t("cart.emptySub", locale)}</p>
            </div>
          ) : (
            <div className="py-2">
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-amber-500/10 p-5 pb-6 space-y-3 bg-[var(--bg-sunken)] safe-bottom">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">{t("cart.total", locale)}</span>
              <span className="text-2xl font-bold text-amber-400" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
                {formatNumber(total * 1000)} đ
              </span>
            </div>
            <a
              href="/customer-info"
              className="btn-primary btn-press block w-full py-3 text-center rounded-xl font-semibold text-sm"
            >
              {t("cart.checkout", locale)}
            </a>
            <button
              onClick={clearCart}
              className="w-full py-2 text-xs text-slate-400 dark:text-slate-600 hover:text-red-400 transition-colors font-medium"
            >
              {t("cart.clearAll", locale)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

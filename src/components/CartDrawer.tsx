"use client";

import { useCartStore, getCartTotal, getCartItemCount } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`cart-drawer fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-brand-yellow/30">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {t("cart.title", locale)}
            </h2>
            <p className="text-xs text-slate-400">
              {t("cart.itemCount", locale).replace("{count}", String(count))}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Đóng"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 mb-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              <p className="text-sm font-medium">{t("cart.empty", locale)}</p>
              <p className="text-xs mt-1">{t("cart.emptySub", locale)}</p>
            </div>
          ) : (
            items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 p-5 space-y-3 bg-brand-yellow/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{t("cart.total", locale)}</span>
              <span className="text-2xl font-bold text-brand">
                {new Intl.NumberFormat("vi-VN").format(total * 1000)} đ
              </span>
            </div>
            <a
              href="/customer-info"
              className="btn-press block w-full py-3 bg-brand text-white text-center rounded-xl font-semibold shadow-md shadow-brand-yellow/30 hover:bg-brand-dark transition-colors"
            >
              {t("cart.checkout", locale)}
            </a>
            <button
              onClick={clearCart}
              className="w-full py-2 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              {t("cart.clearAll", locale)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

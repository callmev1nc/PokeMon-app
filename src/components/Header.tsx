"use client";

import { useCartStore, getCartItemCount } from "@/store/cartStore";

export default function Header({
  onCartClick,
}: {
  onCartClick: () => void;
}) {
  const items = useCartStore((s) => s.items);
  const count = getCartItemCount(items);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🃏</span>
          <h1 className="text-xl font-bold text-slate-800">
            Pokemon Card Store
          </h1>
        </a>

        <div className="flex items-center gap-4">
          <a
            href="/admin"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Quản lý
          </a>
          <button
            onClick={onCartClick}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Giỏ hàng"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-slate-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

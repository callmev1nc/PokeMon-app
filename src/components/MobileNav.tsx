"use client";

import { useCartStore, getCartItemCount } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

export default function MobileNav({ onCartClick }: { onCartClick?: () => void }) {
  const cartCount = useCartStore((s) => getCartItemCount(s.items));
  const wishIds = useWishlistStore((s) => s.ids);
  const locale = useLocaleStore((s) => s.locale);

  return (
    <nav className="mobile-nav sm:hidden">
      <div className="flex items-center justify-around h-14">
        <a
          href="/"
          className="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:text-amber-400 transition-colors py-1 px-3 min-w-[56px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-[10px] font-semibold">{t("common.home", locale)}</span>
        </a>

        <a
          href="/account"
          className="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:text-amber-400 transition-colors py-1 px-3 min-w-[56px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          <span className="text-[10px] font-semibold">{t("common.account", locale)}</span>
        </a>

        <button
          onClick={onCartClick}
          className="relative flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:text-amber-400 transition-colors py-1 px-3 min-w-[56px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute top-0 right-1 bg-amber-500 text-black text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
          <span className="text-[10px] font-semibold">{t("cart.title", locale)}</span>
        </button>

        <a
          href="/account?tab=wishlist"
          className="relative flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:text-amber-400 transition-colors py-1 px-3 min-w-[56px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-5 h-5 ${wishIds.length > 0 ? "fill-red-500 text-red-500" : "fill-none"}`} strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          {wishIds.length > 0 && (
            <span className="absolute top-0 right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {wishIds.length > 9 ? "9+" : wishIds.length}
            </span>
          )}
          <span className="text-[10px] font-semibold">{t("common.wishlist", locale)}</span>
        </a>
      </div>
    </nav>
  );
}
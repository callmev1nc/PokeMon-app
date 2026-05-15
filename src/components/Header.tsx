"use client";

import { useCartStore, getCartItemCount } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useThemeStore } from "@/store/themeStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

export default function Header({
  onCartClick,
}: {
  onCartClick: () => void;
}) {
  const cartCount = useCartStore((s) => getCartItemCount(s.items));
  const wishIds = useWishlistStore((s) => s.ids);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="V1ncc TCG Card Shop"
            className="h-10 w-auto rounded-lg ring-1 ring-amber-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-2deg]"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-amber-400 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              {t("shop.name", locale)}
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-0.5 tracking-widest uppercase">
              {t("shop.tagline", locale)}
            </p>
          </div>
        </a>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {/* Track Order */}
          <a
            href="/order-tracking"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-amber-400 transition-colors px-3 py-2 rounded-xl hover:bg-amber-500/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H6.375c-.621 0-1.125-.504-1.125-1.125V14.25m17.25 4.5V6.375c0-.621-.504-1.125-1.125-1.125H4.125c-.621 0-1.125.504-1.125 1.125v8.25" />
            </svg>
            <span>{t("order.track", locale)}</span>
          </a>

          {/* Account */}
          <a
            href="/account"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-amber-400 transition-colors px-3 py-2 rounded-xl hover:bg-amber-500/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span>{t("common.account", locale)}</span>
          </a>

          {/* Compare */}
          <a
            href="/compare"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-amber-400 transition-colors px-3 py-2 rounded-xl hover:bg-amber-500/10"
            title={t("compare.title", locale)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </a>

          {/* Admin */}
          <a
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-amber-400 transition-colors px-3 py-2 rounded-xl hover:bg-amber-500/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <span>{t("common.manage", locale)}</span>
          </a>

          {/* Language */}
          <button
            onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
            className="p-2.5 rounded-xl hover:bg-amber-500/10 transition-all active:scale-95"
            aria-label={locale === "vi" ? "Switch to English" : "Chuyen sang tieng Viet"}
          >
            <span className="text-lg leading-none">{locale === "vi" ? "🇻🇳" : "🇬🇧"}</span>
          </button>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-amber-500/10 transition-all active:scale-95"
            aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

          {/* Wishlist */}
          <button
            onClick={() => window.location.href = "/account?tab=wishlist"}
            className="relative p-2.5 rounded-xl hover:bg-amber-500/10 transition-all active:scale-95"
            aria-label="Wishlist"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-5 h-5 transition-colors ${wishIds.length > 0 ? "fill-red-500 text-red-500" : "fill-none text-slate-400 dark:text-slate-500"}`} strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            {wishIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {wishIds.length > 9 ? "9+" : wishIds.length}
              </span>
            )}
          </button>

          {/* Cart */}
          <button
            onClick={onCartClick}
            className="relative p-2.5 rounded-xl hover:bg-amber-500/10 transition-all active:scale-95"
            aria-label={t("cart.title", locale)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400 hover:text-amber-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            {cartCount > 0 && (
              <span key={cartCount} className="absolute -top-0.5 -right-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm animate-badge-pop">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { SHOP_NAME, SHOP_DESCRIPTION, FACEBOOK_URL } from "@/lib/constants";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import RecentlyViewedBar from "@/components/RecentlyViewedBar";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import MobileNav from "@/components/MobileNav";

export default function HomePage() {
  const locale = useLocaleStore((s) => s.locale);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Header onCartClick={() => setCartOpen(true)} />

      {/* Hero */}
      <section className="hero-gradient relative">
        <div className="pokeball-deco top-[-80px] right-[-100px] opacity-50" />
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 relative z-10">
          <div className="flex items-center gap-8">
            <div className="flex-1 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-amber-500/20 text-xs font-medium mb-4">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-amber-700 dark:text-amber-200">{t("hero.newStock", locale)}</span>
              </div>
              <h2
                className="text-3xl md:text-5xl font-bold mb-3 leading-tight text-slate-800 dark:text-slate-100 holo-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {SHOP_NAME}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
                {SHOP_DESCRIPTION}
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <span className="inline-flex items-center gap-2 text-xs text-amber-700 dark:text-amber-200 bg-amber-500/10 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-500/20 font-medium">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {t("hero.authentic", locale)}
                </span>
                <span className="inline-flex items-center gap-2 text-xs text-amber-700 dark:text-amber-200 bg-amber-500/10 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-500/20 font-medium">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H6.375c-.621 0-1.125-.504-1.125-1.125V14.25m17.25 4.5V6.375c0-.621-.504-1.125-1.125-1.125H4.125c-.621 0-1.125.504-1.125 1.125v8.25" />
                  </svg>
                  {t("hero.shipping", locale)}
                </span>
              </div>
            </div>
            <img
              src="/logo.png"
              alt="Pokemon"
              className="hidden md:block h-32 w-auto rounded-2xl shadow-xl shadow-amber-500/10 bg-amber-500/10 border border-amber-500/20 backdrop-blur p-3 animate-float"
            />
          </div>
        </div>
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40V20C240 0 480 0 720 20C960 40 1200 40 1440 20V40H0Z" className="fill-[var(--background)]" />
          </svg>
        </div>
      </section>

      {/* Featured Cards */}
      {!loading && products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-6">
          <h3 className="text-lg font-bold mb-4 text-slate-700 dark:text-slate-200 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Featured Cards
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {products.slice(0, 4).map((product) => (
              <a
                key={product.id}
                href={`/product?id=${encodeURIComponent(product.id)}`}
                className="group relative bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <div className="aspect-[2.5/3.5] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" loading="eager" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{product.name}</p>
                  <p className="text-amber-400 font-bold text-sm mt-1" style={{ fontFamily: "var(--font-display)" }}>
                    {product.price !== null ? new Intl.NumberFormat("vi-VN").format(product.price) + "k" : "Liên hệ"}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Pokemon Type Categories */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <h3 className="text-lg font-bold mb-4 text-slate-700 dark:text-slate-200" style={{ fontFamily: "var(--font-display)" }}>
          Browse by Type
        </h3>
        <div className="flex gap-3 flex-wrap">
          {[
            { type: "Fire", icon: "🔥", color: "from-orange-500 to-red-500" },
            { type: "Water", icon: "💧", color: "from-blue-400 to-blue-600" },
            { type: "Grass", icon: "🌿", color: "from-green-400 to-emerald-600" },
            { type: "Electric", icon: "⚡", color: "from-yellow-400 to-amber-500" },
            { type: "Psychic", icon: "🔮", color: "from-pink-400 to-purple-500" },
            { type: "Dragon", icon: "🐉", color: "from-indigo-500 to-purple-700" },
          ].map((item) => {
            const count = !loading ? products.filter(p => p.type?.toLowerCase() === item.type.toLowerCase()).length : 0;
            return (
              <button
                key={item.type}
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('type', item.type);
                  window.location.href = url.toString();
                }}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r ${item.color} text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2`}
              >
                <span>{item.icon}</span>
                {item.type}
                {count > 0 && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{count}</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-20 sm:pb-6">
        {!loading && (
          <ErrorBoundary>
            <RecentlyViewedBar products={products} />
          </ErrorBoundary>
        )}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="animate-fade-in">
            <ErrorBoundary>
              <ProductGrid products={products} />
            </ErrorBoundary>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-amber-500/10 bg-[var(--bg-sunken)]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img src="/logo.png" alt="" className="h-8 w-auto" />
                <span className="font-bold text-amber-400" style={{ fontFamily: "var(--font-display)" }}>
                  V1ncc TCG
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("shop.footer", locale)}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-3">
                {t("footer.links", locale)}
              </h4>
              <div className="flex flex-col gap-2">
                <a href="/" className="text-xs text-slate-500 hover:text-amber-400 transition-colors">
                  {t("shop.name", locale)}
                </a>
                <a href="/order-tracking" className="text-xs text-slate-500 hover:text-amber-400 transition-colors">
                  {t("order.track", locale)}
                </a>
                <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-amber-400 transition-colors">
                  Facebook
                </a>
              </div>
            </div>

            {/* Trust */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-3">
                {t("footer.trust", locale)}
              </h4>
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {t("hero.authentic", locale)}
                </span>
                <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {t("hero.shipping", locale)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-slate-400 dark:text-slate-600">
              &copy; {new Date().getFullYear()} V1ncc TCG Card Shop
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-600">
              Pokemon &amp; Pokemon card names are trademarks of Nintendo/Game Freak
            </p>
          </div>
        </div>
      </footer>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileNav onCartClick={() => setCartOpen(true)} />
    </>
  );
}

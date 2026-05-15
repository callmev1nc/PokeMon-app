"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/lib/types";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { t, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { TYPE_COLORS } from "@/lib/constants";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import CartDrawer from "@/components/CartDrawer";
import CardImage from "@/components/CardImage";
import { useToast } from "@/components/NotificationToast";

export default function WishlistPage() {
  const locale = useLocaleStore((s) => s.locale);
  const ids = useWishlistStore((s) => s.ids);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const clearWish = useWishlistStore((s) => s.clear);
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[] | { data: Product[] }) => setProducts(Array.isArray(data) ? data : data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const wishlistProducts = products.filter((p) => ids.includes(p.id));

  return (
    <>
      <Header onCartClick={() => setCartOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 py-8 pb-20 sm:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-2xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
          >
            {t("common.wishlist", locale)} ({ids.length})
          </h1>
          {wishlistProducts.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowConfirm(true)}
                className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-colors"
              >
                {t("cart.clearAll", locale)}
              </button>
              {showConfirm && (
                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-lg p-3 z-30 min-w-[180px]">
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                    {locale === "vi" ? "Xóa tất cả sản phẩm yêu thích?" : "Remove all wishlist items?"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { clearWish(); setShowConfirm(false); }}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold"
                    >
                      {t("common.delete", locale)}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      {t("common.cancel", locale)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">{t("common.loading", locale)}</p>
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-sunken)] rounded-2xl border border-slate-200 dark:border-slate-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              {locale === "vi" ? "Danh sách yêu thích trống" : "Your wishlist is empty"}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              {locale === "vi" ? "Nhấn vào trái tim trên sản phẩm để thêm" : "Tap the heart on products to add them"}
            </p>
            <a
              href="/"
              className="inline-block mt-4 px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              {t("common.backToShop", locale)}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="product-card rounded-2xl border border-transparent overflow-hidden flex flex-col text-slate-700 dark:text-slate-200"
              >
                <div className="p-3 pb-0 relative group">
                  <a href={`/product?id=${encodeURIComponent(product.id)}`}>
                    <div className="relative overflow-hidden rounded-xl">
                      <CardImage
                        src={product.imageUrl}
                        name={product.name}
                        displayType={product.displayType}
                      />
                    </div>
                  </a>
                  <button
                    onClick={() => toggleWish(product.id)}
                    className="absolute top-5 right-5 p-2.5 rounded-full shadow-md bg-red-500/10 text-red-400 z-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-red-400" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-2">
                  <a href={`/product?id=${encodeURIComponent(product.id)}`} className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight line-clamp-2 hover:text-amber-400 transition-colors">
                    {product.name}
                  </a>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${
                      TYPE_COLORS[product.displayType] || "bg-slate-100 text-slate-600"
                    }`}>
                      {product.displayType}
                    </span>
                  </div>
                  <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                    <p className="text-lg font-bold text-amber-400" style={{ fontFamily: "var(--font-display)" }}>
                      {product.price !== null ? formatPrice(product.price) : t("contact.price", locale)}
                    </p>
                    {product.price !== null && product.stock > 0 && (
                      <button
                        onClick={() => { addItem(product, 1); showToast(`${t("cart.added", locale)} 1 × ${product.name}`, "success"); }}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors btn-press"
                      >
                        {t("cart.add", locale)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <a href="/" className="text-sm text-amber-400 hover:underline">
            &larr; {t("common.backToShop", locale)}
          </a>
        </div>
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileNav onCartClick={() => setCartOpen(true)} />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { SHOP_NAME, SHOP_DESCRIPTION } from "@/lib/constants";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import RecentlyViewedBar from "@/components/RecentlyViewedBar";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Header onCartClick={() => setCartOpen(true)} />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <h2 className="text-2xl md:text-4xl font-bold mb-2">
                {SHOP_NAME}
              </h2>
              <p className="text-red-100 text-sm md:text-base max-w-lg">
                {SHOP_DESCRIPTION}
              </p>
              <div className="flex gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Hàng chính hãng
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H6.375c-.621 0-1.125-.504-1.125-1.125V14.25m17.25 4.5V6.375c0-.621-.504-1.125-1.125-1.125H4.125c-.621 0-1.125.504-1.125 1.125v8.25" />
                  </svg>
                  Giao hàng toàn quốc
                </span>
              </div>
            </div>
            <img
              src="/logo.png"
              alt="Pokemon"
              className="hidden md:block h-28 w-auto rounded-2xl shadow-lg bg-white/10 backdrop-blur-sm p-2"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!loading && (
          <RecentlyViewedBar products={products} />
        )}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
      <footer className="border-t border-slate-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-6 w-auto" />
            <span>V1ncc TCG Card Shop</span>
          </div>
          <p>Thẻ bài Pokémon chất lượng, giá tốt</p>
        </div>
      </footer>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

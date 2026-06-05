"use client";

import { useEffect, useState, useMemo } from "react";
import type { Product } from "@/lib/types";
import Header from "@/components/Header";
import NavigationBar from "@/components/NavigationBar";
import CartDrawer from "@/components/CartDrawer";
import MobileNav from "@/components/MobileNav";
import { formatPrice } from "@/lib/format";

export default function SetsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sets = useMemo(() => {
    const map = new Map<string, { name: string; count: number; minPrice: number; maxPrice: number }>();
    products.forEach((p) => {
      const prefix = p.code.split("-")[0]?.toUpperCase() || "OTHER";
      if (!map.has(prefix)) {
        map.set(prefix, { name: prefix, count: 0, minPrice: Infinity, maxPrice: 0 });
      }
      const s = map.get(prefix)!;
      s.count++;
      if (p.price !== null) {
        s.minPrice = Math.min(s.minPrice, p.price);
        s.maxPrice = Math.max(s.maxPrice, p.price);
      }
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [products]);

  const filteredProducts = selectedSet
    ? products.filter((p) => p.code.split("-")[0]?.toUpperCase() === selectedSet)
    : products;

  return (
    <>
      <Header onCartClick={() => setCartOpen(true)} />
      <NavigationBar />
      <main className="flex-1 bg-[#FAFAFA] dark:bg-[#0F1629]">
        <section className="bg-gradient-to-r from-[#3B82F6] to-[#E53E3E] py-10 text-center">
          <h1 className="text-white text-4xl font-black tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            📦 Sets & Series
          </h1>
          <p className="text-white/80 text-sm mt-2">Browse cards by set</p>
        </section>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-40 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
                {sets.map((set) => (
                  <button
                    key={set.name}
                    onClick={() => setSelectedSet(selectedSet === set.name ? null : set.name)}
                    className={`p-4 rounded-xl text-center transition-all duration-200 ${
                      selectedSet === set.name
                        ? "bg-[#E53E3E] text-white shadow-lg scale-105"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#E53E3E]/30 hover:shadow-md"
                    }`}
                  >
                    <div className="font-black text-lg" style={{ fontFamily: "var(--font-display)" }}>{set.name}</div>
                    <div className={`text-xs mt-1 ${selectedSet === set.name ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                      {set.count} cards
                    </div>
                    {set.minPrice !== Infinity && (
                      <div className={`text-[10px] mt-0.5 ${selectedSet === set.name ? "text-white/60" : "text-slate-400"}`}>
                        {formatPrice(set.minPrice)} — {formatPrice(set.maxPrice)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedSet && (
                <div className="mb-4">
                  <button onClick={() => setSelectedSet(null)} className="text-xs text-[#E53E3E] font-semibold hover:underline">
                    ← Back to all sets
                  </button>
                  <span className="text-xs text-slate-400 ml-2">{filteredProducts.length} cards in {selectedSet}</span>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {filteredProducts.slice(0, 48).map((product) => (
                  <a
                    key={product.id}
                    href={`/product?id=${encodeURIComponent(product.id)}`}
                    className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-all"
                  >
                    <div className="p-2">
                      <div className="aspect-[2.5/3.5] bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl font-bold">
                            {product.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="px-3 pb-3">
                      <p className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">{product.name}</p>
                      <p className="text-[10px] text-slate-400">{product.series}</p>
                      {product.price !== null && (
                        <p className="text-[#E53E3E] font-bold text-sm mt-1" style={{ fontFamily: "var(--font-display)" }}>
                          {formatPrice(product.price)}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileNav onCartClick={() => setCartOpen(true)} />
    </>
  );
}

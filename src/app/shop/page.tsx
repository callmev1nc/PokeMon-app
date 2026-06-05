"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import Header from "@/components/Header";
import NavigationBar from "@/components/NavigationBar";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import MobileNav from "@/components/MobileNav";

export default function ShopPage() {
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
      <NavigationBar />
      <main className="flex-1 bg-[#FAFAFA] dark:bg-[#0F1629]">
        <section className="bg-gradient-to-r from-[#E53E3E] to-[#F6AD55] py-10 text-center">
          <h1 className="text-white text-4xl font-black tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            🃏 Shop All Cards
          </h1>
          <p className="text-white/80 text-sm mt-2">{products.length}+ authentic Pokemon TCG cards</p>
        </section>
        <div className="max-w-7xl mx-auto px-4 py-6 pb-24 sm:pb-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-[400px] animate-pulse" />
              ))}
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </main>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileNav onCartClick={() => setCartOpen(true)} />
    </>
  );
}

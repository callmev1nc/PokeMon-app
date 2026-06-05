"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import Header from "@/components/Header";
import NavigationBar from "@/components/NavigationBar";
import HeroBanner from "@/components/HeroBanner";
import HotItemsSection from "@/components/HotItemsSection";
import TypeBrowser from "@/components/TypeBrowser";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import MobileNav from "@/components/MobileNav";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleTypeClick = (type: string) => {
    setTypeFilter(type);
    const shopSection = document.getElementById("shop");
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <Header onCartClick={() => setCartOpen(true)} />
      <NavigationBar />

      <main className="flex-1 bg-[#FAFAFA] dark:bg-[#0F1629]">
        <HeroBanner />

        {!loading && products.length > 0 && (
          <>
            <HotItemsSection products={products} />
            <TypeBrowser products={products} onTypeClick={handleTypeClick} />
          </>
        )}

        <div id="shop" className="max-w-7xl mx-auto px-4 py-6 pb-24 sm:pb-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-[400px] animate-pulse" />
              ))}
            </div>
          ) : (
            <ProductGrid products={products} initialTypeFilter={typeFilter} />
          )}
        </div>
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileNav onCartClick={() => setCartOpen(true)} />
    </>
  );
}

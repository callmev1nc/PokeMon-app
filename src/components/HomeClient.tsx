"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import Header from "@/components/Header";
import NavigationBar from "@/components/NavigationBar";
import HeroBanner from "@/components/HeroBanner";
import HotItemsSection from "@/components/HotItemsSection";
import TypeBrowser from "@/components/TypeBrowser";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import MobileNav from "@/components/MobileNav";

export default function HomeClient({ products }: { products: Product[] }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

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

      <main className="flex-1 bg-[var(--bg-surface-alt)]">
        <HeroBanner />

        {products.length > 0 && (
          <>
            <HotItemsSection />
            <TypeBrowser products={products} onTypeClick={handleTypeClick} />
          </>
        )}

        <div id="shop" className="max-w-7xl mx-auto px-4 pt-1 pb-24 sm:pb-4">
          <ProductGrid products={products} initialTypeFilter={typeFilter} />
        </div>
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileNav onCartClick={() => setCartOpen(true)} />
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/lib/types";
import Header from "@/components/Header";
import NavigationBar from "@/components/NavigationBar";
import HeroBanner from "@/components/HeroBanner";
import HotItemsSection from "@/components/HotItemsSection";
import TypeBrowser from "@/components/TypeBrowser";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import MobileNav from "@/components/MobileNav";
import { initSearchIndex } from "@/lib/search";

export default function HomeClient({ products }: { products: Product[] }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  // Single source of truth for the search query — shared by the hero and the grid.
  const [search, setSearch] = useState("");

  useEffect(() => {
    initSearchIndex(products);
  }, [products]);

  const scrollToShop = () => {
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTypeClick = (type: string) => {
    setTypeFilter(type);
    scrollToShop();
  };

  return (
    <>
      <Header onCartClick={() => setCartOpen(true)} />
      <NavigationBar />

      <main className="flex-1 bg-[var(--bg-surface-alt)]">
        <HeroBanner
          search={search}
          onSearchChange={setSearch}
          onSubmit={scrollToShop}
          onShopByType={() =>
            document.getElementById("types-browser")?.scrollIntoView({ behavior: "smooth" })
          }
        />

        {products.length > 0 && (
          <>
            <HotItemsSection />
            <div id="types-browser">
              <TypeBrowser products={products} onTypeClick={handleTypeClick} />
            </div>
          </>
        )}

        <div id="shop" className="max-w-7xl mx-auto px-4 pt-1 pb-24 sm:pb-4">
          <ProductGrid
            products={products}
            initialTypeFilter={typeFilter}
            search={search}
            onSearchChange={setSearch}
          />
        </div>
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileNav onCartClick={() => setCartOpen(true)} />
    </>
  );
}

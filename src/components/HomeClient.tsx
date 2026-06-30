"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { Product } from "@/lib/types";
import Header from "@/components/Header";
import NavigationBar from "@/components/NavigationBar";
import HeroBanner from "@/components/HeroBanner";
import HotItemsSection from "@/components/HotItemsSection";
import TypeBrowser from "@/components/TypeBrowser";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import MobileNav from "@/components/MobileNav";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
  },
};

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
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={sectionVariants}
          >
            <HotItemsSection />
            <TypeBrowser products={products} onTypeClick={handleTypeClick} />
          </motion.div>
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

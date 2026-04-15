"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";

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

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Đang tải sản phẩm...</p>
            </div>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import type { Product } from "@/lib/types";
import { POKEMON_TYPES, POKEMON_TYPE_ENERGY_ICONS } from "@/lib/constants";
import Header from "@/components/Header";
import NavigationBar from "@/components/NavigationBar";
import CartDrawer from "@/components/CartDrawer";
import MobileNav from "@/components/MobileNav";
import { formatPrice } from "@/lib/format";

const TYPE_GRADIENTS: Record<string, string> = {
  Fire: "from-[#F97316] to-[#EA580C]",
  Water: "from-[#3B82F6] to-[#2563EB]",
  Grass: "from-[#22C55E] to-[#16A34A]",
  Lightning: "from-[#EAB308] to-[#CA8A04]",
  Psychic: "from-[#EC4899] to-[#DB2777]",
  Fighting: "from-[#DC2626] to-[#B91C1C]",
  Colorless: "from-[#A8A878] to-[#8A8A5C]",
  Flying: "from-[#A890F0] to-[#7C5FC7]",
  Poison: "from-[#A040A0] to-[#803080]",
  Ground: "from-[#E0C068] to-[#C0A048]",
  Rock: "from-[#B8A038] to-[#988028]",
  Bug: "from-[#A8B820] to-[#8A9818]",
  Ghost: "from-[#705898] to-[#584080]",
  Dragon: "from-[#7038F8] to-[#5820D0]",
  Metal: "from-[#B8B8D0] to-[#9898B0]",
  Ice: "from-[#98D8D8] to-[#78B8B8]",
  Darkness: "from-[#705848] to-[#504038]",
  Fairy: "from-[#EE99AC] to-[#D07890]",
};

export default function TypesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const typeData = useMemo(() => {
    const map = new Map<string, { count: number; preview: Product[] }>();
    POKEMON_TYPES.forEach((t) => map.set(t, { count: 0, preview: [] }));
    products.forEach((p) => {
      if (!p.type) return;
      const data = map.get(p.type);
      if (data) {
        data.count++;
        if (data.preview.length < 3) data.preview.push(p);
      }
    });
    return [...map.entries()]
      .filter(([_, d]) => d.count > 0)
      .sort((a, b) => b[1].count - a[1].count);
  }, [products]);

  const filteredProducts = selectedType
    ? products.filter((p) => p.type === selectedType)
    : [];

  return (
    <>
      <Header onCartClick={() => setCartOpen(true)} />
      <NavigationBar />
      <main className="flex-1 bg-[#FAFAFA] dark:bg-[#0F1629]">
        <section className="bg-gradient-to-r from-[#F6AD55] via-[#E53E3E] to-[#3B82F6] py-10 text-center">
          <h1 className="text-white text-4xl font-black tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            ⚡ Browse by Type
          </h1>
          <p className="text-white/80 text-sm mt-2">Find cards by Pokemon elemental type</p>
        </section>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-48 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {typeData.map(([type, data]) => {
                  const gradient = TYPE_GRADIENTS[type] || "from-gray-500 to-gray-600";
                  const icon = POKEMON_TYPE_ENERGY_ICONS[type];
                  const isActive = selectedType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(isActive ? null : type)}
                      className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
                        isActive ? "ring-4 ring-white shadow-xl scale-[1.02]" : ""
                      } bg-gradient-to-br ${gradient}`}
                    >
                      <div className="relative z-10">
                        {icon && (
                          <img src={icon} alt="" className="w-10 h-10 brightness-0 invert mb-3" />
                        )}
                        <h3 className="text-white font-black text-lg" style={{ fontFamily: "var(--font-display)" }}>
                          {type}
                        </h3>
                        <p className="text-white/70 text-xs">{data.count} cards</p>
                      </div>
                      <div className="flex gap-1 mt-3">
                        {data.preview.map((p) => (
                          <div key={p.id} className="w-8 h-11 rounded bg-white/20 backdrop-blur-sm overflow-hidden">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="w-full h-full object-contain" />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedType && filteredProducts.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      {POKEMON_TYPE_ENERGY_ICONS[selectedType] && (
                        <img src={POKEMON_TYPE_ENERGY_ICONS[selectedType]} alt="" className="w-5 h-5" />
                      )}
                      {selectedType} — {filteredProducts.length} cards
                    </h2>
                    <button onClick={() => setSelectedType(null)} className="text-xs text-[#E53E3E] font-semibold hover:underline">
                      ← All Types
                    </button>
                  </div>
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
                          <p className="text-[10px] text-slate-400">{product.displayType} • {product.series}</p>
                          {product.price !== null && (
                            <p className="text-[#E53E3E] font-bold text-sm mt-1" style={{ fontFamily: "var(--font-display)" }}>
                              {formatPrice(product.price)}
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileNav onCartClick={() => setCartOpen(true)} />
    </>
  );
}

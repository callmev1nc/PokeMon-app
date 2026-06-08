"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { POKEMON_TYPE_ENERGY_ICONS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import CardImage from "./CardImage";

export default function HotItemsSection() {
  const [hotItems, setHotItems] = useState<Product[]>([]);
  const addToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetch("/api/hot-items")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHotItems(data);
      })
      .catch(() => {});
  }, []);

  if (hotItems.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-[#E53E3E] flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            🔥 Hot Items
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sản phẩm bán chạy nhất 3 tháng qua!
          </p>
        </div>
        <a href="/hot-items" className="text-[#E53E3E] text-xs font-semibold hover:underline">
          View All →
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {hotItems.map((product) => {
          const energyIcon = product.type ? POKEMON_TYPE_ENERGY_ICONS[product.type] : null;
          return (
            <div
              key={product.id}
              className="bg-white dark:bg-slate-800/50 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="relative">
                <div className="p-2 pb-0">
                  <CardImage src={product.imageUrl} name={product.name} displayType={product.displayType} />
                </div>
                <div className="absolute top-3 left-3 bg-[#E53E3E] text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                  🔥 HOT
                </div>
                {energyIcon && (
                  <div className="absolute top-3 right-3">
                    <img src={energyIcon} alt="" className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="p-3 pt-2">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                  {product.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {energyIcon && <img src={energyIcon} alt="" className="w-3 h-3" />}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {product.type} • {product.series?.split(" ")[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[#E53E3E] font-extrabold text-sm" style={{ fontFamily: "var(--font-display)" }}>
                    {formatPrice(product.price)}
                  </span>
                  {product.stock > 0 && product.price !== null ? (
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="bg-[#E53E3E] text-white w-7 h-7 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-[#C53030] transition-colors"
                    >
                      +
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Hết hàng</span>
                  )}
                </div>
                {product.stock > 0 && product.stock <= 3 && (
                  <p className="text-[9px] text-[#F6AD55] font-semibold mt-1">
                    ⚠ Only {product.stock} left!
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

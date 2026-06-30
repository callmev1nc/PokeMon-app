"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { POKEMON_TYPE_ENERGY_ICONS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCardTilt } from "@/hooks/useCardTilt";
import CardImage from "./CardImage";

function HotCard({ product, index }: { product: Product; index: number }) {
  const addToCart = useCartStore((s) => s.addItem);
  const { ref, handleMouseMove, handleMouseLeave } = useCardTilt();
  const reduced = useReducedMotion();
  const energyIcon = product.type ? POKEMON_TYPE_ENERGY_ICONS[product.type] : null;

  return (
    <motion.div
      ref={ref}
      data-type={product.type}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      className="bg-[var(--card-bg)] rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-[var(--elev-2)] transition-shadow duration-300"
      style={{ transformStyle: "preserve-3d", willChange: reduced ? "auto" : "transform" }}
    >
      <div className="relative" style={{ transformStyle: "preserve-3d" }}>
        <div className="p-2 pb-0" style={{ transform: "translateZ(20px)" }}>
          <CardImage src={product.imageUrl} name={product.name} displayType={product.displayType} type={product.type} />
        </div>
        <div className="absolute top-3 left-3 bg-brand text-white text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ transform: "translateZ(30px)" }}>
          🔥 HOT
        </div>
        {energyIcon && (
          <div className="absolute top-3 right-3" style={{ transform: "translateZ(30px)" }}>
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
          <span className="font-display text-brand font-extrabold text-sm">
            {formatPrice(product.price)}
          </span>
          {product.stock > 0 && product.price !== null ? (
            <button
              onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
              className="pressable bg-brand text-white w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-brand-dark transition-colors"
            >
              +
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">Hết hàng</span>
          )}
        </div>
        {product.stock > 0 && product.stock <= 3 && (
          <p className="text-[9px] text-accent font-semibold mt-1">
            ⚠ Only {product.stock} left!
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function HotItemsSection() {
  const [hotItems, setHotItems] = useState<Product[]>([]);

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
    <section className="max-w-7xl mx-auto px-4 py-1.5 sm:py-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-display text-xl font-black text-brand flex items-center gap-2">
            🔥 Hot Items
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sản phẩm bán chạy nhất 3 tháng qua!
          </p>
        </div>
        <a href="/hot-items" className="pressable text-brand text-xs font-semibold hover:underline">
          View All →
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {hotItems.map((product, index) => (
          <HotCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}

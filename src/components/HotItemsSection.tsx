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
        <div className="absolute top-3 left-3 bg-brand text-white text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5" style={{ transform: "translateZ(30px)" }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5" aria-hidden>
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153-.4-2.292-1-3a2.5 2.5 0 0 1 2.5 2.5z" />
          </svg>
          HOT
        </div>
        {energyIcon && (
          <div className="absolute top-3 right-3" style={{ transform: "translateZ(30px)" }}>
            <img src={energyIcon} alt="" className="w-4 h-4 rounded-full object-cover" />
          </div>
        )}
      </div>
      <div className="p-3 pt-2">
        <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
          {product.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {energyIcon && <img src={energyIcon} alt="" className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-black/10" />}
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
            Only {product.stock} left
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
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#F97316]" aria-hidden>
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153-.4-2.292-1-3a2.5 2.5 0 0 1 2.5 2.5z" />
            </svg>
            Hot Items
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sản phẩm bán chạy nhất 3 tháng qua!
          </p>
        </div>
        <a href="/hot-items" className="pressable text-brand text-xs font-semibold hover:underline">
          View All →
        </a>
      </div>

      {/* Horizontal "shelf": a single row that scrolls sideways so every hot item
          stays one swipe away without growing the page vertically (the old wrapping
          grid pushed the shop grid far below the fold). Snap + hidden scrollbar.
          Full list still available at /hot-items via "View All". */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory items-start px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {hotItems.map((product, index) => (
          <div key={product.id} className="snap-start shrink-0 w-[158px] sm:w-[200px] lg:w-[228px]">
            <HotCard product={product} index={index} />
          </div>
        ))}
      </div>
    </section>
  );
}

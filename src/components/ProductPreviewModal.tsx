"use client";

import { useEffect, useCallback, useState } from "react";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { POKEMON_TYPE_ENERGY_ICONS, TYPE_COLORS } from "@/lib/constants";
import CardImage from "./CardImage";

interface ProductPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductPreviewModal({ product, isOpen, onClose }: ProductPreviewModalProps) {
  const addToCart = useCartStore((s) => s.addItem);
  const locale = useLocaleStore((s) => s.locale);
  const [isMobile, setIsMobile] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // Detect mobile so we can render a bottom sheet instead of a centered modal.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !product) return null;

  const energyIcon = product.type ? POKEMON_TYPE_ENERGY_ICONS[product.type] : null;

  const handleAddToCart = () => {
    addToCart(product, 1);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 p-0 sm:p-4 ${isMobile ? "flex items-end" : "flex items-center justify-center"}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Panel: centered modal (desktop) / bottom sheet (mobile) */}
      <div
        className={`relative bg-[var(--bg-surface)] shadow-[var(--elev-4)] w-full overflow-hidden ${
          isMobile
            ? "rounded-t-3xl max-h-[92vh] flex flex-col animate-slide-up safe-bottom"
            : "rounded-2xl max-w-lg animate-modal-up"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="pressable absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        <div className={`flex flex-col sm:flex-row ${isMobile ? "overflow-y-auto" : ""}`}>
          {/* Image section */}
          <div className="sm:w-1/2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50 p-4 flex items-center justify-center min-h-[200px] sm:min-h-[300px]">
            <div className="w-36 sm:w-40">
              <CardImage src={product.imageUrl} name={product.name} displayType={product.displayType} priority />
            </div>
          </div>

          {/* Details section */}
          <div className="sm:w-1/2 p-5 flex flex-col gap-3">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide ${
                TYPE_COLORS[product.displayType] || "bg-slate-100 text-slate-600"
              }`}>
                {product.displayType}
              </span>
              {energyIcon && (
                <img src={energyIcon} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-black/10" />
              )}
              {product.type && (
                <span className="text-[10px] text-slate-400 font-medium">{product.type}</span>
              )}
            </div>

            {/* Name */}
            <h3 className="font-bold text-base text-[var(--text-primary)] leading-tight">
              {product.name}
            </h3>

            {/* Series & Code */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{product.series}</span>
              <span className="text-slate-300">·</span>
              <span className="font-mono">{product.code}</span>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? "bg-green-400" : "bg-red-400"}`} />
              <span className={`text-xs font-medium ${product.stock > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                {product.stock > 0 ? `${product.stock} còn lại` : t("product.outOfStock", locale)}
              </span>
            </div>

            {/* Price */}
            <div className="mt-auto pt-3 border-t border-[var(--border-subtle)]">
              <span className="font-display text-2xl font-extrabold text-brand">
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {product.stock > 0 && product.price !== null ? (
                <button
                  onClick={handleAddToCart}
                  className="pressable flex-1 bg-brand hover:bg-brand-dark text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t("cart.add", locale)}
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-400 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed"
                >
                  {product.price === null ? t("product.contact", locale) : t("product.outOfStock", locale)}
                </button>
              )}
              <a
                href={`/product?id=${encodeURIComponent(product.id)}`}
                className="pressable px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] text-sm font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

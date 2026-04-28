"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Product } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import LowStockBadge from "./LowStockBadge";
import CardImage from "./CardImage";

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { ref: fadeRef, visible } = useFadeIn();
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore(
    useCallback((s) => {
      const item = s.items.find((i) => i.product.id === product.id);
      return item?.quantity ?? 0;
    }, [product.id])
  );
  const toggleWish = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.ids.includes(product.id));
  const locale = useLocaleStore((s) => s.locale);
  const maxQty = product.stock - inCart;
  const isOutOfStock = product.stock === 0;
  const noPrice = product.price === null;

  const displayPrice = (price: number | null): string => {
    if (price === null) return t("contact.price", locale);
    return formatPrice(price);
  };

  const handleAdd = () => {
    if (maxQty <= 0 || noPrice) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    setQty(1);
  };

  return (
    <div
      ref={fadeRef}
      className={`product-card rounded-2xl border border-transparent overflow-hidden flex flex-col text-slate-700 dark:text-slate-200 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Image */}
      <div className="p-3 pb-0 relative group">
        <a href={`/product?id=${encodeURIComponent(product.id)}`}>
          <div className="relative overflow-hidden rounded-xl">
            <CardImage
              src={product.imageUrl}
              name={product.name}
              displayType={product.displayType}
              priority={priority}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </a>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWish(product.id);
          }}
          className={`absolute top-5 right-5 p-2.5 rounded-full shadow-md transition-all duration-300 z-10 ${
            isWished
              ? "bg-red-500/10 text-red-400 scale-110"
              : "bg-slate-100 dark:bg-slate-800/50 backdrop-blur-sm text-slate-400 dark:text-slate-500 hover:text-red-400 hover:bg-red-500/10 sm:opacity-0 sm:group-hover:opacity-100"
          }`}
          aria-label={isWished ? "Bỏ yêu thích" : "Yêu thích"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-4 h-4 transition-colors ${isWished ? "fill-red-400" : "fill-none"}`} strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </button>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <a href={`/product?id=${encodeURIComponent(product.id)}`} className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight line-clamp-2 hover:text-amber-400 transition-colors">
            {product.name}
          </a>
          <LowStockBadge stock={product.stock} />
        </div>

        {product.series && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tracking-tight">{product.series}</p>
        )}

        <div className="flex items-center gap-2">
          <span
            className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${
              TYPE_COLORS[product.displayType] || "bg-slate-100 text-slate-600"
            } ${product.displayType === "Holo" ? "badge-holo" : ""}`}
          >
            {product.displayType}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize font-medium">
            {product.group}
          </span>
        </div>

        {/* Price + Stock */}
        <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700/50">
          <p className={`text-2xl font-bold tracking-tight ${noPrice ? "text-slate-400" : "text-amber-400"}`} style={{ fontFamily: "var(--font-display)" }}>
            {displayPrice(product.price)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {t("product.remaining", locale)}{" "}
            <span className={`font-semibold ${product.stock <= 3 ? "text-amber-500" : "text-slate-500 dark:text-slate-400"}`}>
              {product.stock}
            </span>
            {inCart > 0 && (
              <span className="text-amber-400 ml-1 font-medium">
                ({t("product.inCart", locale)} {inCart})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Add to cart */}
      <div className="px-4 pb-4 flex items-center gap-2">
        {!isOutOfStock && !noPrice && (
          <>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700/50">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 text-sm font-bold transition-colors min-w-[36px]"
              >
                -
              </button>
              <span className="px-2 py-2.5 text-sm font-semibold min-w-[36px] text-center text-slate-600 dark:text-slate-300">
                {qty}
              </span>
              <button
                onClick={() => setQty(Math.min(maxQty, qty + 1))}
                className="px-3 py-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 text-sm font-bold transition-colors min-w-[36px]"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={maxQty <= 0}
              className={`btn-press btn-primary flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                added
                  ? "bg-emerald-500 text-white shadow-emerald-500/20 shadow-md"
                  : maxQty <= 0
                  ? "bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  : ""
              }`}
            >
              {added ? t("cart.added", locale) : t("cart.add", locale)}
            </button>
          </>
        )}
        {isOutOfStock && (
          <button
            disabled
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed"
          >
            {t("product.outOfStock", locale)}
          </button>
        )}
        {noPrice && !isOutOfStock && (
          <button
            disabled
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed"
          >
            {t("product.contact", locale)}
          </button>
        )}
      </div>
    </div>
  );
}

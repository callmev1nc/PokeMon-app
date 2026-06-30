"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { toRenderUrl, toPlaceholderUrl, isTcgdexUrl } from "@/lib/imageUtils";
import type { Product } from "@/lib/types";

function ThumbnailImage({ product }: { product: Product }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const src = product.imageUrl ? toRenderUrl(product.imageUrl) : null;
  const lowSrc =
    product.imageUrl && isTcgdexUrl(product.imageUrl)
      ? toPlaceholderUrl(product.imageUrl)
      : null;

  if (!src || error) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-amber-100/20 to-slate-200 dark:from-amber-900/20 dark:to-slate-800 flex items-center justify-center">
        <span className="text-sm font-bold text-amber-400/60">
          {product.name.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-slate-100 dark:bg-slate-900">
      {lowSrc && !loaded && (
        <img
          src={lowSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain blur-sm scale-105"
        />
      )}
      <img
        src={src}
        alt={product.name}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export default function RecentlyViewedBar({
  products,
}: {
  products: Product[];
}) {
  const viewedIds = useRecentlyViewedStore((s) => s.ids);
  const locale = useLocaleStore((s) => s.locale);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const viewedProducts = viewedIds
    .map((id) => productMap.get(id))
    .filter((p): p is Product => p !== undefined);

  const displayPrice = (price: number | null): string => {
    if (price === null) return t("contact.price", locale);
    return formatPrice(price);
  };

  if (viewedProducts.length === 0) return null;

  return (
    <section className="py-4">
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.15em" }}>
        {t("recent.title", locale)}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {viewedProducts.map((product, i) => (
          <motion.a
            key={product.id}
            href={`/product?id=${encodeURIComponent(product.id)}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
            className="flex-shrink-0 flex items-center gap-3 bg-white dark:bg-[#0F1629] border border-slate-200 dark:border-slate-700/30 rounded-xl p-2 pr-4 shadow-sm hover:shadow-amber-500/10 hover:border-amber-500/20 transition-all duration-300 min-w-[200px] max-w-[260px] group"
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-900">
              <ThumbnailImage product={product} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 line-clamp-1 leading-tight group-hover:text-amber-400 transition-colors">
                {product.name}
              </p>
              <p className="text-xs font-bold text-amber-400 mt-0.5">
                {displayPrice(product.price)}
              </p>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

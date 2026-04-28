"use client";

import { useState, useMemo } from "react";
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
      <div className="w-full h-full bg-gradient-to-br from-red-100 to-orange-200 flex items-center justify-center">
        <span className="text-sm font-bold text-white/80">
          {product.name.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-slate-50">
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
    <section className="py-4 animate-fade-in">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-body)" }}>
        {t("recent.title", locale)}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {viewedProducts.map((product) => (
          <a
            key={product.id}
            href={`/product?id=${encodeURIComponent(product.id)}`}
            className="flex-shrink-0 flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-2 pr-4 shadow-sm hover:shadow-md hover:border-brand-yellow/30 transition-all duration-300 min-w-[200px] max-w-[260px] group"
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50">
              <ThumbnailImage product={product} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 line-clamp-1 leading-tight group-hover:text-brand transition-colors">
                {product.name}
              </p>
              <p className="text-xs font-bold text-brand mt-0.5">
                {displayPrice(product.price)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

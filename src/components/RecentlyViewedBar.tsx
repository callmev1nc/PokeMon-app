"use client";

import { useState } from "react";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
<<<<<<< HEAD
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import type { Product } from "@/lib/types";

=======
import { toRenderUrl, toPlaceholderUrl, isTcgdexUrl } from "@/lib/imageUtils";
import type { Product } from "@/lib/types";

function formatPrice(price: number | null): string {
  if (price === null) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN").format(price * 1000) + " đ";
}

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
      <div className="w-full h-full bg-gradient-to-br from-red-200 to-orange-300 flex items-center justify-center">
        <span className="text-lg font-bold text-white/80">
          {product.name.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-slate-50">
      {lowSrc && !loaded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={lowSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain blur-sm scale-105"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
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

>>>>>>> 5e4ccf27b5855a23e39fb3ee2a9594d28b15d474
export default function RecentlyViewedBar({
  products,
}: {
  products: Product[];
}) {
  const viewedIds = useRecentlyViewedStore((s) => s.ids);
  const locale = useLocaleStore((s) => s.locale);

  const formatPrice = (price: number | null): string => {
    if (price === null) return t("contact.price", locale);
    return new Intl.NumberFormat("vi-VN").format(price * 1000) + " đ";
  };

  const viewedProducts = viewedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  if (viewedProducts.length === 0) return null;

  return (
    <section className="py-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        {t("recent.title", locale)}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {viewedProducts.map((product) => (
          <a
            key={product.id}
            href={`/product?id=${encodeURIComponent(product.id)}`}
            className="flex-shrink-0 flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-2 pr-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all min-w-[220px] max-w-[280px]"
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
              <ThumbnailImage product={product} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-800 line-clamp-1 leading-tight">
                {product.name}
              </p>
              <p className="text-xs font-semibold text-brand mt-0.5">
                {formatPrice(product.price)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

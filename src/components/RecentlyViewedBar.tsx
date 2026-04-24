"use client";

import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import type { Product } from "@/lib/types";

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

  // Filter products to only those recently viewed, preserving viewed order
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
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-white/80">
                    {product.name.charAt(0)}
                  </span>
                </div>
              )}
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

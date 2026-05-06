"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/lib/types";
import { useComparisonStore } from "@/store/comparisonStore";
import { useLocaleStore } from "@/store/localeStore";
import { t, type Locale } from "@/lib/i18n";

function formatPrice(price: number | null, locale: Locale): string {
  if (price === null) return t("contact.price", locale);
  return new Intl.NumberFormat("vi-VN").format(price * 1000) + " đ";
}

export default function ComparePage() {
  const locale = useLocaleStore((s) => s.locale);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const ids = useComparisonStore((s) => s.ids);
  const remove = useComparisonStore((s) => s.remove);
  const clear = useComparisonStore((s) => s.clear);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[] | { data: Product[] }) => {
        setProducts(Array.isArray(data) ? data : data?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const compareProducts = products.filter((p) => ids.includes(p.id));

  const fields: { key: keyof Product; label: string; render: (p: Product) => string }[] = [
    { key: "name", label: t("compare.name", locale), render: (p) => p.name },
    { key: "price", label: t("compare.price", locale), render: (p) => formatPrice(p.price, locale) },
    { key: "stock", label: t("compare.stockField", locale), render: (p) => String(p.stock) },
    { key: "type", label: t("compare.type", locale), render: (p) => p.type },
    { key: "group", label: t("compare.group", locale), render: (p) => p.group },
    { key: "series", label: t("compare.series", locale), render: (p) => p.series || "-" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100 uppercase tracking-wider" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>{t("compare.title", locale)}</h1>
        {compareProducts.length > 0 && (
          <button
            onClick={clear}
            className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-colors"
          >
            {t("cart.clearAll", locale)}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-400">{t("common.loading", locale)}</p>
        </div>
      ) : compareProducts.length === 0 ? (
        <div className="text-center py-16 bg-[#0F1629] rounded-2xl border border-slate-700/50">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-600 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <p className="text-slate-400 text-lg font-medium">{t("compare.empty", locale)}</p>
          <p className="text-slate-500 text-sm mt-1">
            {t("compare.emptySub", locale)}
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            {t("compare.viewProducts", locale)}
          </a>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-[#0F1629] rounded-2xl border border-slate-700/50 overflow-hidden shadow-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                  {t("compare.attribute", locale)}
                </th>
                {compareProducts.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {p.imageUrl && (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-20 h-20 object-contain rounded-lg"
                        />
                      )}
                      <button
                        onClick={() => remove(p.id)}
                        className="text-xs px-3 py-1 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 font-semibold transition-colors"
                      >
                        {t("common.delete", locale)}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.key} className="border-b border-slate-700/50 last:border-b-0">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-400 bg-slate-800/30">
                    {field.label}
                  </td>
                  {compareProducts.map((p) => (
                    <td
                      key={p.id}
                      className="px-4 py-3 text-sm text-slate-300 text-center"
                    >
                      {field.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <a href="/" className="text-sm text-amber-400 hover:underline">
          &larr; {t("common.backToShop", locale)}
        </a>
      </div>
    </div>
  );
}

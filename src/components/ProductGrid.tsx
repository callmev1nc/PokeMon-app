"use client";

import { useMemo, useState } from "react";
import type { Product, DisplayType, SortOption, GroupCategory } from "@/lib/types";
import { DISPLAY_TYPES } from "@/lib/constants";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import ProductCard from "./ProductCard";
import FilterBar from "./FilterBar";

const PAGE_SIZE = 24;

export default function ProductGrid({ products }: { products: Product[] }) {
  const [selectedTypes, setSelectedTypes] = useState<DisplayType[]>([
    "Normal",
    "Holo",
    "Prize Card",
    "EX",
    "Holo Prize Card",
    "EX Prize Card",
  ]);
  const [selectedGroups, setSelectedGroups] = useState<GroupCategory[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const locale = useLocaleStore((s) => s.locale);

  const toggleType = (type: DisplayType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setVisibleCount(PAGE_SIZE);
  };

  const toggleGroup = (group: GroupCategory) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
    setVisibleCount(PAGE_SIZE);
  };

  const filtered = useMemo(() => {
    let result = products;

    if (selectedGroups.length > 0) {
      result = result.filter((p) => selectedGroups.includes(p.group as GroupCategory));
    }

    if (selectedGroups.length === 0 && selectedTypes.length < DISPLAY_TYPES.length) {
      result = result.filter((p) => selectedTypes.includes(p.displayType));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.series.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return (a.price ?? Infinity) - (b.price ?? Infinity);
        case "price-desc":
          return (b.price ?? -Infinity) - (a.price ?? -Infinity);
        case "stock-asc":
          return a.stock - b.stock;
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [products, selectedTypes, selectedGroups, search, sort]);

  const totalStock = filtered.reduce((sum, p) => sum + p.stock, 0);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div>
      <FilterBar
        selectedTypes={selectedTypes}
        onToggleType={toggleType}
        selectedGroups={selectedGroups}
        onToggleGroup={toggleGroup}
        search={search}
        onSearchChange={(v) => { setSearch(v); setVisibleCount(PAGE_SIZE); }}
        sort={sort}
        onSortChange={(v) => { setSort(v); setVisibleCount(PAGE_SIZE); }}
        filteredTotal={filtered.length}
        filteredStock={totalStock}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg">{t("filter.noResults", locale)}</p>
          <p className="text-sm mt-1">{t("filter.noResultsSub", locale)}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 8} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                {t("filter.loadMore", locale).replace("{count}", String(filtered.length - visibleCount))}
              </button>
            </div>
          )}

          {!hasMore && filtered.length > PAGE_SIZE && (
            <p className="text-center text-xs text-slate-400 mt-6">
              {t("filter.allShown", locale).replace("{count}", String(filtered.length))}
            </p>
          )}
        </>
      )}
    </div>
  );
}

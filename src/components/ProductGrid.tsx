"use client";

import { useMemo, useState, useEffect, useRef, useCallback, useDeferredValue } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { Product, DisplayType, SortOption, GroupCategory } from "@/lib/types";
import { DISPLAY_TYPES } from "@/lib/constants";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import { initSearchIndex, fuzzySearch } from "@/lib/search";
import { parseSearchQuery } from "@/lib/smartSearch";
import ProductCard from "./ProductCard";
import { InlineErrorBoundary } from "./ErrorBoundary";
import FilterBar from "./FilterBar";
import ProductPreviewModal from "./ProductPreviewModal";

const PAGE_SIZE = 24;
const CARD_HEIGHT = 420;
const CARD_GAP = 16;

function useColumnCount(ref: React.RefObject<HTMLDivElement | null>) {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w >= 1280) setCols(4);
      else if (w >= 1024) setCols(3);
      else if (w >= 640) setCols(2);
      else setCols(1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return cols;
}

export default function ProductGrid({ products, initialTypeFilter }: { products: Product[]; initialTypeFilter?: string | null }) {
  const [selectedTypes, setSelectedTypes] = useState<DisplayType[]>([
    "Normal", "Holo", "Prize Card", "EX", "Holo Prize Card", "EX Prize Card",
  ]);
  const [selectedGroups, setSelectedGroups] = useState<GroupCategory[]>([]);
  const [selectedPokemonTypes, setSelectedPokemonTypes] = useState<string[]>(
    initialTypeFilter ? [initialTypeFilter] : []
  );
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const locale = useLocaleStore((s) => s.locale);
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useColumnCount(parentRef);

  useEffect(() => { initSearchIndex(products); }, [products]);

  useEffect(() => {
    if (initialTypeFilter) {
      setSelectedPokemonTypes([initialTypeFilter]);
    }
  }, [initialTypeFilter]);

  const suggestions = useMemo(() => fuzzySearch(deferredSearch), [deferredSearch]);

  const resetVisible = useCallback(() => setVisibleCount(PAGE_SIZE), []);

  const toggleType = useCallback((type: DisplayType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    resetVisible();
  }, [resetVisible]);

  const toggleGroup = useCallback((group: GroupCategory) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
    resetVisible();
  }, [resetVisible]);

  const togglePokemonType = useCallback((type: string) => {
    setSelectedPokemonTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    resetVisible();
  }, [resetVisible]);

  const filtered = useMemo(() => {
    let result = products;

    if (selectedGroups.length > 0) {
      result = result.filter((p) => selectedGroups.includes(p.group as GroupCategory));
    }

    if (selectedPokemonTypes.length > 0) {
      result = result.filter((p) =>
        selectedPokemonTypes.some((t) => p.type?.toLowerCase() === t.toLowerCase())
      );
    }

    if (selectedTypes.length < DISPLAY_TYPES.length) {
      result = result.filter((p) => selectedTypes.includes(p.displayType));
    }

    if (deferredSearch.trim()) {
      const parsed = parseSearchQuery(deferredSearch);
      if (parsed.pokemonTypes.length > 0) {
        result = result.filter((p) =>
          parsed.pokemonTypes.some((t) => p.type?.toLowerCase() === t.toLowerCase())
        );
      }
      if (parsed.displayTypes.length > 0) {
        result = result.filter((p) => parsed.displayTypes.includes(p.displayType));
      }
      if (parsed.groups.length > 0) {
        result = result.filter((p) => parsed.groups.includes(p.group as GroupCategory));
      }
      if (parsed.freeText) {
        const q = parsed.freeText.toLowerCase();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            p.series.toLowerCase().includes(q)
        );
      }
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
  }, [products, selectedTypes, selectedGroups, deferredSearch, sort]);

  const totalStock = filtered.reduce((sum, p) => sum + p.stock, 0);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const rowCount = Math.ceil(visible.length / columns);
  const rowHeight = CARD_HEIGHT + CARD_GAP;

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeight,
    overscan: 5,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  // Infinite scroll: load more when near bottom of page
  useEffect(() => {
    function onScroll() {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 600;
      if (nearBottom && hasMore) {
        setVisibleCount((c) => c + PAGE_SIZE);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMore]);

  // Reset visible count when filters change
  useEffect(() => { resetVisible(); }, [selectedTypes, selectedGroups, deferredSearch, sort, resetVisible]);

  const gridClass = columns === 4 ? "grid-cols-4" : columns === 3 ? "grid-cols-3" : columns === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div ref={parentRef}>
      <FilterBar
        selectedTypes={selectedTypes}
        onToggleType={toggleType}
        selectedGroups={selectedGroups}
        onToggleGroup={toggleGroup}
        selectedPokemonTypes={selectedPokemonTypes}
        onTogglePokemonType={togglePokemonType}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        filteredTotal={filtered.length}
        filteredStock={totalStock}
        suggestions={suggestions}
        onSuggestionClick={setPreviewProduct}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg">{t("filter.noResults", locale)}</p>
          <p className="text-sm mt-1">{t("filter.noResultsSub", locale)}</p>
        </div>
      ) : (
        <>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const startIdx = virtualRow.index * columns;
              const rowItems = visible.slice(startIdx, startIdx + columns);
              return (
                <div
                  key={virtualRow.index}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className={`grid gap-4 ${gridClass}`}>
                    {rowItems.map((product, i) => (
                      <InlineErrorBoundary key={product.id}>
                        <ProductCard product={product} priority={startIdx + i < 8} />
                      </InlineErrorBoundary>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="text-center py-4">
              <p className="text-xs text-slate-400">{t("common.loading", locale)}</p>
            </div>
          )}

          {!hasMore && filtered.length > PAGE_SIZE && (
            <p className="text-center text-xs text-slate-500 mt-4">
              {t("filter.allShown", locale).replace("{count}", String(filtered.length))}
            </p>
          )}
        </>
      )}

      <ProductPreviewModal
        product={previewProduct}
        isOpen={!!previewProduct}
        onClose={() => setPreviewProduct(null)}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { Product, DisplayType, SortOption, GroupCategory } from "@/lib/types";
import { DISPLAY_TYPES } from "@/lib/constants";
import ProductCard from "./ProductCard";
import FilterBar from "./FilterBar";

export default function ProductGrid({ products }: { products: Product[] }) {
  const [selectedTypes, setSelectedTypes] = useState<DisplayType[]>([
    "Normal",
    "Holo",
    "Prize Card",
    "EX",
    "Holo Prize Card",
  ]);
  const [selectedGroups, setSelectedGroups] = useState<GroupCategory[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("name-asc");

  const toggleType = (type: DisplayType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleGroup = (group: GroupCategory) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const filtered = useMemo(() => {
    let result = products;

    // Filter by group category
    if (selectedGroups.length > 0) {
      result = result.filter((p) => selectedGroups.includes(p.group as GroupCategory));
    }

    // Filter by display type (only if no group is selected)
    if (selectedGroups.length === 0 && selectedTypes.length < DISPLAY_TYPES.length) {
      result = result.filter((p) => selectedTypes.includes(p.displayType));
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.series.toLowerCase().includes(q)
      );
    }

    // Sort
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

  return (
    <div>
      <FilterBar
        selectedTypes={selectedTypes}
        onToggleType={toggleType}
        selectedGroups={selectedGroups}
        onToggleGroup={toggleGroup}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        filteredTotal={filtered.length}
        filteredStock={totalStock}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg">Không tìm thấy sản phẩm nào</p>
          <p className="text-sm mt-1">Thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

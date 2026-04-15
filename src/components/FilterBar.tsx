"use client";

import type { DisplayType, SortOption, GroupCategory } from "@/lib/types";
import {
  DISPLAY_TYPES,
  TYPE_COLORS,
  GROUP_CATEGORIES,
  GROUP_LABELS,
  GROUP_COLORS,
} from "@/lib/constants";

interface FilterBarProps {
  selectedTypes: DisplayType[];
  onToggleType: (type: DisplayType) => void;
  selectedGroups: GroupCategory[];
  onToggleGroup: (group: GroupCategory) => void;
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  filteredTotal: number;
  filteredStock: number;
}

export default function FilterBar({
  selectedTypes,
  onToggleType,
  selectedGroups,
  onToggleGroup,
  search,
  onSearchChange,
  sort,
  onSortChange,
  filteredTotal,
  filteredStock,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Search */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Display Type filter chips */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {DISPLAY_TYPES.map((type) => {
            const isActive = selectedTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => onToggleType(type)}
                className={`btn-press px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? TYPE_COLORS[type] + " shadow-sm"
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Group category filter chips */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {GROUP_CATEGORIES.map((group) => {
            const isActive = selectedGroups.includes(group);
            return (
              <button
                key={group}
                onClick={() => onToggleGroup(group)}
                className={`btn-press px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? GROUP_COLORS[group] + " shadow-sm"
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                }`}
              >
                {GROUP_LABELS[group] || group}
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name-asc">Tên A-Z</option>
          <option value="price-asc">Giá tăng dần</option>
          <option value="price-desc">Giá giảm dần</option>
          <option value="stock-asc">Tồn kho thấp nhất</option>
        </select>

        {/* Count */}
        <span className="text-sm text-slate-500 ml-auto">
          {filteredTotal} sản phẩm · {filteredStock} thẻ còn lại
        </span>
      </div>
    </div>
  );
}

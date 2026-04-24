"use client";

import type { DisplayType, SortOption, GroupCategory } from "@/lib/types";
import {
  DISPLAY_TYPES,
  TYPE_COLORS,
  GROUP_CATEGORIES,
  GROUP_LABELS,
  GROUP_COLORS,
} from "@/lib/constants";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

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
  const locale = useLocaleStore((s) => s.locale);

  return (
    <div className="flex flex-col gap-3 mb-6 sticky top-16 z-20 py-3 -mx-4 px-4 bg-surface-alt/90 backdrop-blur-md">
      {/* Search */}
      <div className="relative group">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-yellow transition-colors"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder={t("filter.search", locale)}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm placeholder:text-slate-300 focus:border-brand-yellow transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {/* Display Type chips */}
      <div className="flex gap-2 flex-wrap">
        {DISPLAY_TYPES.map((type) => {
          const isActive = selectedTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              className={`btn-press px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                isActive
                  ? TYPE_COLORS[type] + " filter-chip-active shadow-sm"
                  : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200 hover:text-slate-500"
              } ${type === "Holo" && isActive ? "badge-holo" : ""}`}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Group + Sort + Count */}
      <div className="flex flex-wrap items-center gap-2">
        {GROUP_CATEGORIES.map((group) => {
          const isActive = selectedGroups.includes(group);
          return (
            <button
              key={group}
              onClick={() => onToggleGroup(group)}
              className={`btn-press px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                isActive
                  ? GROUP_COLORS[group] + " filter-chip-active shadow-sm"
                  : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200 hover:text-slate-500"
              }`}
            >
              {GROUP_LABELS[group] || group}
            </button>
          );
        })}

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-3 py-1.5 bg-white border border-slate-200/80 rounded-lg text-xs text-slate-600 cursor-pointer"
          >
            <option value="name-asc">{t("sort.name", locale)}</option>
            <option value="price-asc">{t("sort.priceAsc", locale)}</option>
            <option value="price-desc">{t("sort.priceDesc", locale)}</option>
            <option value="stock-asc">{t("sort.stock", locale)}</option>
          </select>

          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
            {filteredTotal} {t("filter.countShort", locale)}
          </span>
        </div>
      </div>
    </div>
  );
}

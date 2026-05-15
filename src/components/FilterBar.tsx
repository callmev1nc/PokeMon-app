"use client";

import { useRef, useEffect, useState } from "react";
import type { DisplayType, SortOption, GroupCategory, Product } from "@/lib/types";
import {
  DISPLAY_TYPES,
  TYPE_COLORS,
  GROUP_CATEGORIES,
  GROUP_LABELS,
  GROUP_COLORS,
  POKEMON_TYPES,
  POKEMON_TYPE_COLORS,
  POKEMON_TYPE_ICONS,
} from "@/lib/constants";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

interface FilterBarProps {
  selectedTypes: DisplayType[];
  onToggleType: (type: DisplayType) => void;
  selectedGroups: GroupCategory[];
  onToggleGroup: (group: GroupCategory) => void;
  selectedPokemonTypes: string[];
  onTogglePokemonType: (type: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  filteredTotal: number;
  filteredStock: number;
  suggestions?: Product[];
}

export default function FilterBar({
  selectedTypes,
  onToggleType,
  selectedGroups,
  onToggleGroup,
  selectedPokemonTypes,
  onTogglePokemonType,
  search,
  onSearchChange,
  sort,
  onSortChange,
  filteredTotal,
  filteredStock,
  suggestions = [],
}: FilterBarProps) {
  const locale = useLocaleStore((s) => s.locale);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!search.trim()) { setShowDropdown(false); return; }
    setShowDropdown(true);
  }, [suggestions, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-3 mb-6 sticky top-16 z-20 py-3 -mx-4 px-4 bg-[var(--background)]/90 backdrop-blur-md">
      {/* Search */}
      <div className="relative group" ref={wrapperRef}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-yellow transition-colors"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder={t("filter.search", locale)}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => { if (search.trim() && suggestions.length > 0) setShowDropdown(true); }}
          onKeyDown={(e) => { if (e.key === "Escape") setShowDropdown(false); }}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:border-brand-yellow transition-all"
        />
        {search && (
          <button
            onClick={() => { onSearchChange(""); setShowDropdown(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}

        {/* Autocomplete dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
            {suggestions.map((product) => (
              <a
                key={product.id}
                href={`/product?id=${encodeURIComponent(product.id)}`}
                onMouseDown={(e) => { e.preventDefault(); setShowDropdown(false); }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/30 last:border-b-0"
              >
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="w-8 h-8 object-contain rounded" />
                ) : (
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center text-xs text-slate-400 font-bold">
                    {product.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-200 truncate font-medium">
                    {product.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {product.code}
                  </p>
                </div>
                <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide ${
                  TYPE_COLORS[product.displayType] || "bg-slate-100 text-slate-600"
                }`}>
                  {product.displayType}
                </span>
              </a>
            ))}
          </div>
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
                  : "bg-white dark:bg-[#0F1629] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300"
              } ${type === "Holo" && isActive ? "badge-holo" : ""}`}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Pokemon Type chips */}
      <div className="flex gap-1.5 flex-wrap items-center">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium py-1 mr-1">
          Type:
        </span>
        {POKEMON_TYPES.slice(0, 12).map((type) => {
          const isActive = selectedPokemonTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => onTogglePokemonType(type)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                isActive
                  ? POKEMON_TYPE_COLORS[type]
                  : "bg-white dark:bg-[#0F1629] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300"
              }`}
            >
              <span>{POKEMON_TYPE_ICONS[type]}</span>
              <span className="hidden sm:inline">{type}</span>
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
                  : "bg-white dark:bg-[#0F1629] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300"
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
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            <option value="name-asc">{t("sort.name", locale)}</option>
            <option value="price-asc">{t("sort.priceAsc", locale)}</option>
            <option value="price-desc">{t("sort.priceDesc", locale)}</option>
            <option value="stock-asc">{t("sort.stock", locale)}</option>
          </select>

          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
            {filteredTotal} {t("filter.countShort", locale)}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import { fuzzySearch } from "@/lib/search";
import { TYPE_COLORS } from "@/lib/constants";

/**
 * Smart-search hero (replaces the "Open a Pack" hero).
 * - Live fuzzy autocomplete via the shared search index (src/lib/search).
 * - Drives the product grid through the shared `search` query owned by HomeClient.
 * - Enter / "See all results" scrolls to #shop (the grid filters reactively).
 * - SSR-safe: input value comes from props ("" on server); entrances are CSS
 *   animations; no motion `opacity:0` gating on content. Reduced-motion respected.
 */
export default function HeroBanner({
  search,
  onSearchChange,
  onSubmit,
  onShopByType,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
  onShopByType: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLFormElement>(null);
  const reduced = useReducedMotion();
  const locale = useLocaleStore((s) => s.locale);
  const [showSug, setShowSug] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 1.04]);

  const suggestions = useMemo(() => fuzzySearch(search, 6), [search]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowSug(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSug(false);
    onSubmit();
  };

  return (
    <section
      ref={ref}
      className="vault-spotlight relative overflow-hidden bg-[var(--vault-stage)]"
      aria-label="Search cards"
    >
      {/* Stage backdrop */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <motion.div
          className="absolute inset-0"
          style={{ background: "var(--spotlight)", scale: reduced ? 1 : stageScale }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 45% at 50% 100%, rgba(200,150,74,0.20), transparent 70%)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 120% 80% at 50% -10%, transparent 60%, rgba(0,0,0,0.55) 100%)" }}
        />
      </div>

      <motion.div
        className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-8 sm:pt-16 sm:pb-10 lg:pt-20 lg:pb-12 text-center"
        style={{ y: reduced ? 0 : copyY }}
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-accent)] bg-white/[0.03] text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--color-gold-bright)] animate-fade-in stagger-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold-bright)] animate-pulse" />
          Authentic singles · Vietnam
        </span>

        <h1 className="mt-4 font-display font-semibold text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.01em] text-[var(--text-primary)] animate-fade-in stagger-2">
          Find your next card
        </h1>
        <p className="mt-4 text-[var(--text-secondary)] text-base sm:text-lg animate-fade-in stagger-3">
          Normal, Holo, EX &amp; Prize singles — searchable by name, set, or type.
        </p>

        {/* Search */}
        <form onSubmit={submit} ref={wrapRef} className="relative mt-7 max-w-xl mx-auto animate-fade-in stagger-4">
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { onSearchChange(e.target.value); setShowSug(true); }}
            onFocus={() => { if (suggestions.length > 0) setShowSug(true); }}
            onKeyDown={(e) => { if (e.key === "Escape") setShowSug(false); }}
            placeholder={t("hero.searchPlaceholder", locale)}
            aria-label={t("filter.search", locale)}
            className="w-full pl-12 pr-4 py-4 rounded-full bg-white/[0.04] border border-[var(--border-accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-gold-bright)] focus:ring-2 focus:ring-[var(--color-gold-bright)]/30 outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)] min-h-[52px]"
          />

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {showSug && search.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: reduced ? 0 : 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-surface)] border border-[var(--border-accent)] rounded-2xl shadow-[var(--shadow-float)] overflow-hidden z-50 max-h-80 overflow-y-auto"
              >
                {suggestions.length > 0 ? (
                  suggestions.map((p) => (
                    <a
                      key={p.id}
                      href={`/product?id=${encodeURIComponent(p.id)}`}
                      onMouseDown={(e) => { e.preventDefault(); setShowSug(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0 text-left"
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-8 h-8 object-contain rounded" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-[var(--bg-sunken)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate font-medium">{p.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{p.code}</p>
                      </div>
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide ${TYPE_COLORS[p.displayType] || "bg-slate-200 text-slate-600"}`}>
                        {p.displayType}
                      </span>
                    </a>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-[var(--text-muted)]">No matches — press Enter to browse all.</p>
                )}
                <button
                  type="submit"
                  className="w-full text-center py-2.5 text-xs font-semibold text-[var(--color-gold-bright)] hover:bg-[var(--bg-hover)] transition-colors border-t border-[var(--border-subtle)]"
                >
                  See all results{search.trim() ? ` for “${search.trim()}”` : ""}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Quick links */}
        <div className="mt-6 flex gap-2 justify-center flex-wrap animate-fade-in stagger-5">
          <a
            href="/sets"
            className="pressable inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[var(--text-primary)] border border-[var(--border-accent)] bg-white/[0.02] hover:bg-white/[0.05] transition-colors min-h-[40px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 12 3l9 4.5M3 7.5v9L12 21l9-4.5v-9M3 7.5 12 12m9-4.5L12 12m0 0v9" />
            </svg>
            Shop by Set
          </a>
          <button
            onClick={onShopByType}
            className="pressable inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[var(--text-primary)] border border-[var(--border-accent)] bg-white/[0.02] hover:bg-white/[0.05] transition-colors min-h-[40px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 0 9 9M12 3v9h9" />
            </svg>
            Shop by Type
          </button>
        </div>
      </motion.div>

      {/* Fade into page background */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-b from-transparent to-[var(--background)] pointer-events-none" aria-hidden />
    </section>
  );
}

"use client";

import { POKEMON_TYPE_ENERGY_ICONS } from "@/lib/constants";

/**
 * Colorful circular energy/type icon (replaces the old white-silhouette treatment).
 * - Circle crop is pure CSS (`rounded-full` + `object-cover`); no image processing.
 * - Falls back to the original `.svg` silhouette if a `.png` photo is missing.
 */
export default function EnergyIcon({
  type,
  className = "w-4 h-4",
}: {
  type: string;
  className?: string;
}) {
  const src = POKEMON_TYPE_ENERGY_ICONS[type];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      className={`rounded-full object-cover ring-1 ring-black/20 dark:ring-white/15 ${className}`}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src.endsWith(".png")) img.src = img.src.replace(/\.png$/, ".svg");
      }}
    />
  );
}

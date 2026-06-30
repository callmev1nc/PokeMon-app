"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { toRenderUrl } from "@/lib/imageUtils";

interface CardImageProps {
  src?: string | null;
  name: string;
  displayType: string;
  type?: string | null;
  priority?: boolean;
}

const TYPE_PLACEHOLDER_COLORS: Record<string, string> = {
  Normal: "from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800",
  Holo: "from-cyan-100/40 to-blue-100/40 dark:from-cyan-900/40 dark:to-blue-900/40",
  "Prize Card": "from-amber-100/40 to-yellow-100/40 dark:from-amber-900/40 dark:to-yellow-900/40",
  EX: "from-red-100/40 to-rose-100/40 dark:from-red-900/40 dark:to-rose-900/40",
  "Holo Prize Card": "from-purple-100/40 to-fuchsia-100/40 dark:from-purple-900/40 dark:to-fuchsia-900/40",
  "EX Prize Card": "from-rose-100/40 to-red-100/40 dark:from-rose-900/40 dark:to-red-900/40",
};

export default function CardImage({
  src,
  name,
  displayType,
  type,
  priority = false,
}: CardImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const gradient =
    TYPE_PLACEHOLDER_COLORS[displayType] || "from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800";

  const highSrc = useMemo(() => (src ? toRenderUrl(src) : src), [src]);

  if (!highSrc || error) {
    return (
      <div
        data-type={type || undefined}
        className={`aspect-[2.5/3.5] bg-gradient-to-br ${gradient} rounded-2xl flex flex-col items-center justify-center gap-1 p-2`}
        style={type ? { background: "var(--tint, transparent)" } : undefined}
      >
        <span className="text-3xl font-bold text-amber-400/50 drop-shadow-sm">
          {name.charAt(0)}
        </span>
        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center leading-tight">
          {displayType}
        </span>
      </div>
    );
  }

  return (
    <div
      data-type={type || undefined}
      className={`aspect-[2.5/3.5] bg-gradient-to-br ${gradient} rounded-2xl overflow-hidden relative`}
      style={type ? { background: "var(--tint, transparent)" } : undefined}
    >
      <Image
        src={highSrc}
        alt={name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        priority={priority}
        loading={priority ? undefined : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`object-contain transition-opacity duration-[var(--dur-page)] ease-[var(--ease-out)] dark:brightness-110 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

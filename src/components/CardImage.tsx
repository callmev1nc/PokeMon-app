"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { toRenderUrl, toPlaceholderUrl, isTcgdexUrl } from "@/lib/imageUtils";

interface CardImageProps {
  src?: string | null;
  name: string;
  displayType: string;
  priority?: boolean;
}

const TYPE_PLACEHOLDER_COLORS: Record<string, string> = {
  Normal: "from-slate-700 to-slate-800",
  Holo: "from-cyan-900/40 to-blue-900/40",
  "Prize Card": "from-amber-900/40 to-yellow-900/40",
  EX: "from-red-900/40 to-rose-900/40",
  "Holo Prize Card": "from-purple-900/40 to-fuchsia-900/40",
  "EX Prize Card": "from-rose-900/40 to-red-900/40",
};

export default function CardImage({
  src,
  name,
  displayType,
  priority = false,
}: CardImageProps) {
  const [error, setError] = useState(false);
  const [highLoaded, setHighLoaded] = useState(false);
  const [placeholderLoaded, setPlaceholderLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const gradient =
    TYPE_PLACEHOLDER_COLORS[displayType] || "from-slate-700 to-slate-800";

  const highSrc = useMemo(() => (src ? toRenderUrl(src) : src), [src]);
  const placeholderSrc = useMemo(
    () => (src && isTcgdexUrl(src) ? toPlaceholderUrl(src) : null),
    [src]
  );

  useEffect(() => {
    if (!highSrc || priority) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.src = highSrc;
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [highSrc, priority]);

  if (!highSrc || error) {
    return (
      <div
        className={`aspect-[2.5/3.5] bg-gradient-to-br ${gradient} rounded-xl flex flex-col items-center justify-center gap-1 p-2`}
      >
        <span className="text-3xl font-bold text-amber-400/50 drop-shadow-sm">
          {name.charAt(0)}
        </span>
        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide text-center leading-tight">
          {displayType}
        </span>
      </div>
    );
  }

  const showPlaceholder = placeholderSrc && !highLoaded;

  return (
    <div
      ref={ref}
      className="aspect-[2.5/3.5] bg-slate-900 rounded-xl overflow-hidden relative"
    >
      {showPlaceholder && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          onLoad={() => setPlaceholderLoaded(true)}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 blur-sm scale-105 ${
            placeholderLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={highSrc}
        alt={name}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setHighLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-contain transition-opacity duration-500 ${
          highLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

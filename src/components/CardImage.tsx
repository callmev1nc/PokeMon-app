"use client";

import { useState, useMemo } from "react";
import { toRenderUrl } from "@/lib/imageUtils";

interface CardImageProps {
  src?: string | null;
  name: string;
  displayType: string;
}

const TYPE_PLACEHOLDER_COLORS: Record<string, string> = {
  Normal: "from-gray-200 to-gray-300",
  Holo: "from-blue-200 to-blue-400",
  "Prize Card": "from-yellow-200 to-yellow-400",
  EX: "from-red-200 to-red-400",
  "Holo Prize Card": "from-purple-200 to-purple-400",
  "EX Prize Card": "from-rose-200 to-rose-400",
};

export default function CardImage({ src, name, displayType }: CardImageProps) {
  const [error, setError] = useState(false);

  const gradient =
    TYPE_PLACEHOLDER_COLORS[displayType] || "from-slate-200 to-slate-300";

  const renderSrc = useMemo(() => (src ? toRenderUrl(src) : src), [src]);

  if (!renderSrc || error) {
    return (
      <div
        className={`aspect-[2.5/3.5] bg-gradient-to-br ${gradient} rounded-xl flex flex-col items-center justify-center gap-1 p-2`}
      >
        <span className="text-3xl font-bold text-white/80 drop-shadow-sm">
          {name.charAt(0)}
        </span>
        <span className="text-[9px] font-semibold text-white/70 uppercase tracking-wide text-center leading-tight">
          {displayType}
        </span>
      </div>
    );
  }

  return (
    <div className="aspect-[2.5/3.5] bg-slate-50 rounded-xl overflow-hidden relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={renderSrc}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setError(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

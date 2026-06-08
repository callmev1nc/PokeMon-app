"use client";

import { POKEMON_TYPES, POKEMON_TYPE_ENERGY_ICONS } from "@/lib/constants";

const TYPE_GRADIENTS: Record<string, string> = {
  Fire: "from-[#F97316] to-[#EA580C]",
  Water: "from-[#3B82F6] to-[#2563EB]",
  Grass: "from-[#22C55E] to-[#16A34A]",
  Lightning: "from-[#EAB308] to-[#CA8A04]",
  Psychic: "from-[#EC4899] to-[#DB2777]",
  Fighting: "from-[#DC2626] to-[#B91C1C]",
  Colorless: "from-[#A8A878] to-[#8A8A5C]",
  Flying: "from-[#A890F0] to-[#7C5FC7]",
  Poison: "from-[#A040A0] to-[#803080]",
  Ground: "from-[#E0C068] to-[#C0A048]",
  Rock: "from-[#B8A038] to-[#988028]",
  Bug: "from-[#A8B820] to-[#8A9818]",
  Ghost: "from-[#705898] to-[#584080]",
  Dragon: "from-[#7038F8] to-[#5820D0]",
  Metal: "from-[#B8B8D0] to-[#9898B0]",
  Ice: "from-[#98D8D8] to-[#78B8B8]",
  Darkness: "from-[#705848] to-[#504038]",
  Fairy: "from-[#EE99AC] to-[#D07890]",
};

interface TypeBrowserProps {
  products: { type: string }[];
  onTypeClick?: (type: string) => void;
}

export default function TypeBrowser({ products, onTypeClick }: TypeBrowserProps) {
  const typeCounts = products.reduce<Record<string, number>>((acc, p) => {
    if (p.type) acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  const sortedTypes = POKEMON_TYPES.filter((t) => typeCounts[t]).sort(
    (a, b) => (typeCounts[b] || 0) - (typeCounts[a] || 0)
  );

  return (
    <section className="max-w-7xl mx-auto px-4 py-3">
      <div className="flex items-center gap-2 mb-4">
        <img src="/energy/lightning.svg" alt="" className="w-5 h-5" />
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100" style={{ fontFamily: "var(--font-display)" }}>
          Browse by Type
        </h2>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Find cards by Pokemon elemental type
      </p>
      <div className="flex gap-2 flex-wrap">
        {sortedTypes.map((type) => {
          const gradient = TYPE_GRADIENTS[type] || "from-gray-500 to-gray-600";
          const icon = POKEMON_TYPE_ENERGY_ICONS[type];
          const count = typeCounts[type] || 0;
          return (
            <button
              key={type}
              onClick={() => onTypeClick?.(type)}
              className={`bg-gradient-to-r ${gradient} text-white pl-2 pr-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200`}
            >
              {icon && <img src={icon} alt="" className="w-4 h-4 brightness-0 invert" />}
              {type}
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] ml-0.5">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

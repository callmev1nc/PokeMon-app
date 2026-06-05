import type { DisplayType, GroupCategory } from "@/lib/types";
import { POKEMON_TYPES } from "@/lib/constants";

export interface ParsedSearch {
  raw: string;
  pokemonTypes: string[];
  displayTypes: DisplayType[];
  groups: GroupCategory[];
  freeText: string;
}

const DISPLAY_TYPE_ALIASES: Record<string, DisplayType> = {
  normal: "Normal",
  holo: "Holo",
  holographic: "Holo",
  "prize card": "Prize Card",
  prize: "Prize Card",
  ex: "EX",
  "holo prize card": "Holo Prize Card",
  "holo prize": "Holo Prize Card",
  "ex prize card": "EX Prize Card",
  "ex prize": "EX Prize Card",
};

const GROUP_ALIASES: Record<string, GroupCategory> = {
  pokemon: "pokemon",
  item: "item",
  items: "item",
  tool: "tool",
  tools: "tool",
  stadium: "stadium",
  supporter: "suppoter",
  supporters: "suppoter",
  energy: "energy",
  "special energy": "special energy",
};

export function parseSearchQuery(query: string): ParsedSearch {
  const normalized = query.toLowerCase().trim();
  if (!normalized) {
    return { raw: query, pokemonTypes: [], displayTypes: [], groups: [], freeText: "" };
  }

  const tokens = normalized.split(/\s+/);
  const pokemonTypes: string[] = [];
  const displayTypes: DisplayType[] = [];
  const groups: GroupCategory[] = [];
  const usedIndices = new Set<number>();

  // Try multi-word matches first
  const multiWordPatterns: Array<{ pattern: string; target: "display" | "group"; value: string }> = [
    { pattern: "holo prize card", target: "display", value: "Holo Prize Card" },
    { pattern: "ex prize card", target: "display", value: "EX Prize Card" },
    { pattern: "prize card", target: "display", value: "Prize Card" },
    { pattern: "holo prize", target: "display", value: "Holo Prize Card" },
    { pattern: "ex prize", target: "display", value: "EX Prize Card" },
    { pattern: "special energy", target: "group", value: "special energy" },
  ];

  for (const { pattern, target, value } of multiWordPatterns) {
    const idx = normalized.indexOf(pattern);
    if (idx !== -1) {
      if (target === "display" && !displayTypes.includes(value as DisplayType)) {
        displayTypes.push(value as DisplayType);
      } else if (target === "group" && !groups.includes(value as GroupCategory)) {
        groups.push(value as GroupCategory);
      }
      const wordsBefore = normalized.slice(0, idx).split(/\s+/).length - 1;
      const wordCount = pattern.split(/\s+/).length;
      for (let i = wordsBefore; i < wordsBefore + wordCount; i++) usedIndices.add(i);
    }
  }

  // Single-word matches
  tokens.forEach((token, i) => {
    if (usedIndices.has(i)) return;

    // Pokemon type match
    const matchedType = POKEMON_TYPES.find(
      (t) => t.toLowerCase() === token || t.toLowerCase().startsWith(token)
    );
    if (matchedType && !pokemonTypes.includes(matchedType)) {
      pokemonTypes.push(matchedType);
      usedIndices.add(i);
      return;
    }

    // Display type match
    const displayAlias = DISPLAY_TYPE_ALIASES[token];
    if (displayAlias && !displayTypes.includes(displayAlias)) {
      displayTypes.push(displayAlias);
      usedIndices.add(i);
      return;
    }

    // Group match
    const groupAlias = GROUP_ALIASES[token];
    if (groupAlias && !groups.includes(groupAlias)) {
      groups.push(groupAlias);
      usedIndices.add(i);
      return;
    }
  });

  const freeText = tokens.filter((_, i) => !usedIndices.has(i)).join(" ");

  return { raw: query, pokemonTypes, displayTypes, groups, freeText };
}

#!/usr/bin/env npx tsx
// ============================================================
// BUILD POKEMON TYPES
// Fetches Pokemon elemental types from tcgdex.dev SDK
// ============================================================

import * as fs from "fs";
import * as path from "path";
import TCGdex from "@tcgdex/sdk";

interface Product {
  id: string;
  code: string;
  name: string;
  series: string;
  type: string;
  group: string;
}

interface CardResume {
  id: string;
  localId: string;
  name: string;
  types?: string[];
  category?: string;
}

// Internal set code → tcgdex set ID
const SET_MAP: Record<string, string> = {
  SVI: "sv01",
  PAL: "sv02",
  OBF: "sv03",
  MEW: "sv03.5",
  PAR: "sv04",
  PAF: "sv04.5",
  PEL: "sv04.5",
  TEF: "sv05",
  TWM: "sv06",
  SFA: "sv06.5",
  SCR: "sv07",
  SSP: "sv08",
  PRE: "sv08.5",
  JTG: "sv09",
  DRI: "sv10",
  BLK: "sv10.5b",
  WHT: "sv10.5w",
  MEG: "me01",
  PFL: "me02",
  FPL: "me02",
  ASC: "me02.5",
  POR: "me03",
  SVE: "sve",
  SVP: "svp",
};

const NAME_ONLY_SETS = new Set(["sv04.5"]);

const SERIES_NAME_MAP: Record<string, string> = {
  "SUN AND MOON": "sm1",
  "CELESTIAL STORM": "sm7",
  "SHINNING LEGEND": "sm3.5",
  "SHINING LEGEND": "sm3.5",
  "LOST THUNDER": "sm8",
};

const SWSH_SET_BY_TOTAL: Record<string, string> = {
  "202": "swsh1",
  "192": "swsh2",
  "189": "swsh3",
  "72": "swsh4.5",
  "73": "swsh4.5",
  "163": "swsh5",
  "172": "swsh9",
  "264": "swsh8",
  "159": "swsh12.5",
  "78": "swsh10.5",
};

const tcgdex = new TCGdex("en");
tcgdex.setCacheTTL(3600);

interface ParsedSeries {
  setCode: string;
  cardNumber: string;
  totalCards: string;
  forceNameMatch?: boolean;
}

function parseSeries(series: string): ParsedSeries | null {
  let s = series.trim();
  if (!s) return null;

  s = s.replace(/(\d+)\s+(\d+)(\/\d+)/, "$1$2$3");
  s = s.replace(/(\d+)\/(\d+)\s+(\d+)/, (_, a, b, c) => `${a}/${b}${c}`);

  const match = s.match(/^(.+?)\s+(\d+)\/(\d+)$/i);
  if (match) {
    let code = match[1].trim().toUpperCase().replace(/\s+(EN|GG|TG)$/i, "");
    const forceNameMatch = SET_MAP[code] ? NAME_ONLY_SETS.has(SET_MAP[code]) : false;
    return {
      setCode: code,
      cardNumber: match[2],
      totalCards: match[3],
      forceNameMatch,
    };
  }

  const noTotalMatch = s.match(/^(.+?)\s+(\d+)$/i);
  if (noTotalMatch) {
    let code = noTotalMatch[1].trim().toUpperCase().replace(/\s+EN$/i, "");
    if (SET_MAP[code]) {
      return {
        setCode: code,
        cardNumber: noTotalMatch[2],
        totalCards: "0",
      };
    }
  }

  const textMatch = s.match(/^(.+?)\s+(\d+)\/(\d+)$/i);
  if (textMatch) {
    const nameKey = textMatch[1].trim().toUpperCase();
    if (SERIES_NAME_MAP[nameKey]) {
      return {
        setCode: nameKey,
        cardNumber: textMatch[2],
        totalCards: textMatch[3],
      };
    }
  }

  return null;
}

function getSetId(parsed: ParsedSeries): string | null {
  if (["D", "F", "E"].includes(parsed.setCode)) {
    const total = String(parseInt(parsed.totalCards, 10));
    return SWSH_SET_BY_TOTAL[total] || null;
  }
  if (SET_MAP[parsed.setCode]) return SET_MAP[parsed.setCode];
  if (SERIES_NAME_MAP[parsed.setCode]) return SERIES_NAME_MAP[parsed.setCode];
  return null;
}

function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s*-\s*/g, "-")
    .replace(/['']/g, "")
    .replace(/[^A-Z0-9\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function baseName(name: string): string {
  return normalizeName(name)
    .replace(
      /\s+(EX|V|VMAX|VSTAR|GX|LV\s*X|E4|BREAK|PRISMATIC|STELLAR|\d+)$/i,
      ""
    )
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;

  const ba = baseName(a);
  const bb = baseName(b);
  if (ba && bb && (ba === bb || ba.includes(bb) || bb.includes(ba))) return true;

  const naNoHyphen = na.replace(/-/g, "");
  const nbNoHyphen = nb.replace(/-/g, "");
  if (naNoHyphen === nbNoHyphen) return true;
  if (na.length > 3 && nb.length > 3) {
    if (na.includes(nb) || nb.includes(na)) return true;
    if (naNoHyphen.includes(nbNoHyphen) || nbNoHyphen.includes(naNoHyphen))
      return true;
  }

  if (ba.length >= 4 && bb.length >= 4) {
    const dist = levenshtein(ba.replace(/-/g, ""), bb.replace(/-/g, ""));
    if (dist <= 2) return true;
  }

  return false;
}

function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

const setCardCache = new Map<string, CardResume[]>();
const fullCardCache = new Map<string, any>();

async function fetchSetCards(setId: string): Promise<CardResume[]> {
  if (setCardCache.has(setId)) return setCardCache.get(setId)!;

  try {
    const set = await tcgdex.set.get(setId);
    if (set?.cards) {
      setCardCache.set(setId, set.cards as CardResume[]);
      return set.cards as CardResume[];
    }
  } catch {
    console.warn(`  Failed to fetch set: ${setId}`);
  }
  return [];
}

async function fetchFullCard(cardId: string): Promise<any> {
  if (fullCardCache.has(cardId)) return fullCardCache.get(cardId)!;

  try {
    const card = await tcgdex.card.get(cardId);
    fullCardCache.set(cardId, card);
    return card;
  } catch {
    return null;
  }
}

async function main() {
  console.log("=== Build Pokemon Types (tcgdex.dev SDK) ===\n");

  const rootDir = path.resolve(__dirname, "..");

  const productsPath = path.join(rootDir, "src", "data", "products.json");
  const products: Product[] = JSON.parse(
    fs.readFileSync(productsPath, "utf-8")
  );
  console.log(`Loaded ${products.length} products`);

  // Only process Pokemon-type products (not energy, item, trainer, etc.)
  const pokemonProducts = products.filter((p) => p.group === "pokemon");
  console.log(`Pokemon products: ${pokemonProducts.length}`);

  // Pre-fetch all needed sets
  const neededSets = new Set<string>();
  for (const product of pokemonProducts) {
    const parsed = parseSeries(product.series);
    if (parsed) {
      const setId = getSetId(parsed);
      if (setId) neededSets.add(setId);
    }
  }
  console.log(`Fetching ${neededSets.size} sets from tcgdex.dev...`);

  for (const setId of neededSets) {
    const cards = await fetchSetCards(setId);
    console.log(`  ${setId}: ${cards.length} cards`);
  }

  // Build pokemon type map
  const pokemonTypeMap: Record<string, string> = {};
  let matched = 0;
  let notPokemon = 0;
  let unmatched = 0;

  console.log("\nMatching products to pokemon types...");

  for (const product of pokemonProducts) {
    const parsed = parseSeries(product.series);
    if (!parsed) {
      unmatched++;
      continue;
    }

    const setId = getSetId(parsed);
    if (!setId) {
      unmatched++;
      continue;
    }

    const cards = await fetchSetCards(setId);
    if (cards.length === 0) {
      unmatched++;
      continue;
    }

    let match: CardResume | undefined;

    // First try by card number
    if (!parsed.forceNameMatch) {
      const paddedNumber = parsed.cardNumber.padStart(
        Math.max(parsed.cardNumber.length, 3),
        "0"
      );
      match = cards.find(
        (c) =>
          c.localId === parsed.cardNumber ||
          c.localId === paddedNumber ||
          (namesMatch(c.name, product.name) &&
            (c.localId === parsed.cardNumber ||
              c.localId === paddedNumber))
      );
    }

    // Fallback: match by name
    if (!match) {
      match = cards.find((c) => namesMatch(c.name, product.name));
    }

    // Fetch full card details to get types
    if (match?.id) {
      const fullCard = await fetchFullCard(match.id);
      if (fullCard?.types && fullCard.types.length > 0) {
        const pokemonType = fullCard.types[0]; // Get first type (e.g., "Fire", "Water", "Grass")
        pokemonTypeMap[product.id] = pokemonType;
        matched++;
      } else {
        notPokemon++;
      }
    } else {
      unmatched++;
    }
  }

  // Save pokemon types
  const outputPath = path.join(rootDir, "src", "data", "pokemon-types.json");
  fs.writeFileSync(outputPath, JSON.stringify(pokemonTypeMap, null, 2), "utf-8");

  console.log(`\n=== Pokemon Types Summary ===`);
  console.log(`Types mapped: ${matched}`);
  console.log(`Not Pokemon cards: ${notPokemon}`);
  console.log(`Unmatched: ${unmatched}`);
  console.log(`Output: ${outputPath}`);

  // Show sample types
  const sampleTypes = Object.values(pokemonTypeMap);
  const typeCounts = sampleTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(`\nType distribution:`);
  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([type, count]) => console.log(`  ${type}: ${count}`));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
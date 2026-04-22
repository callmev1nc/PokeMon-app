#!/usr/bin/env npx tsx
// ============================================================
// BUILD IMAGE MAP
// Generates src/data/image-map.json using tcgdex.dev SDK
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
}

interface CardResume {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

// Internal set code → tcgdex set ID
const SET_MAP: Record<string, string> = {
  SVI: "sv01",
  PAL: "sv02",
  OBF: "sv03",
  MEW: "sv03.5",
  PAR: "sv04",
  PAF: "sv04.5",
  PEL: "sv04.5",   // Paldean Fates GG — same set, match by name
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
  FPL: "me02",     // Alternative code for Phantasmal Flames
  ASC: "me02.5",
  POR: "me03",
  SVE: "sve",
  SVP: "svp",
};

// Sets where card numbering doesn't match tcgdex localId
// (e.g., GG subsets have their own numbering)
const NAME_ONLY_SETS = new Set(["sv04.5"]);

// Text-based series names → tcgdex set ID
const SERIES_NAME_MAP: Record<string, string> = {
  "SUN AND MOON": "sm1",
  "CELESTIAL STORM": "sm7",
  "SHINNING LEGEND": "sm3.5",
  "SHINING LEGEND": "sm3.5",
  "LOST THUNDER": "sm8",
};

// D/F/E are multi-set codes from Sword & Shield era.
// The total card count determines which specific set.
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

  // Fix malformed series with spaces in numbers: "TWM 15 1/167" → "TWM 151/167"
  s = s.replace(/(\d+)\s+(\d+)(\/\d+)/, "$1$2$3");
  // Fix: "JTG 152/1 59" → "JTG 152/159"
  s = s.replace(/(\d+)\/(\d+)\s+(\d+)/, (_, a, b, c) => `${a}/${b}${c}`);

  // Standard format: "CODE NUMBER/TOTAL" e.g. "MEG 054/132"
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

  // Format without total: "SVP 193" or "SVE EN 014"
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

  // Text-based series: "sun and moon 118/149"
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

// Cache of cards per set from tcgdex
const setCardCache = new Map<string, CardResume[]>();

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

async function main() {
  console.log("=== Build Image Map (tcgdex.dev SDK) ===\n");

  const rootDir = path.resolve(__dirname, "..");

  // 1. Load products
  const productsPath = path.join(rootDir, "src", "data", "products.json");
  const products: Product[] = JSON.parse(
    fs.readFileSync(productsPath, "utf-8")
  );
  console.log(`Loaded ${products.length} products`);

  const imageMap: Record<string, string> = {};
  let matched = 0;
  let byNumber = 0;
  let byName = 0;
  let unmatched = 0;
  const unmatchedProducts: string[] = [];

  // 2. Pre-fetch all needed sets
  const neededSets = new Set<string>();
  for (const product of products) {
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

  // 3. Match products to cards
  console.log("\nMatching products to cards...");

  for (const product of products) {
    const compositeKey = `${product.code}|${product.type}|${product.series}`;

    const parsed = parseSeries(product.series);
    if (!parsed) {
      unmatched++;
      unmatchedProducts.push(`${product.name} | ${product.series}`);
      continue;
    }

    const setId = getSetId(parsed);
    if (!setId) {
      unmatched++;
      unmatchedProducts.push(`${product.name} | ${product.series} (unknown set)`);
      continue;
    }

    const cards = await fetchSetCards(setId);
    if (cards.length === 0) {
      unmatched++;
      unmatchedProducts.push(`${product.name} | ${product.series} (empty set ${setId})`);
      continue;
    }

    let match: CardResume | undefined;

    // For name-only sets (like PEL/GG), skip number matching
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

    // Fallback: match by name only
    if (!match) {
      match = cards.find((c) => namesMatch(c.name, product.name));
      if (match) byName++;
    } else {
      byNumber++;
    }

    if (match?.image) {
      imageMap[product.id] = match.image;
      imageMap[compositeKey] = match.image;
      matched++;
    } else {
      unmatched++;
      const reason = match ? "no image" : "not found";
      unmatchedProducts.push(`${product.name} | ${product.series} (${reason})`);
    }
  }

  // 4. Fallback: fill gaps with pokemontcg.io
  const gaps = products.filter((p) => !imageMap[p.id]);
  if (gaps.length > 0) {
    console.log(`\nFilling ${gaps.length} gaps with pokemontcg.io...`);
    const POKEMON_TCG_API = "https://api.pokemontcg.io/v2";
    const totalsToSets: Record<string, string> = {
      "111": "sv3pt5",
      "149": "sm1",
      "73": "sm35",
      "156": "swsh1",
    };
    const energyNames: Record<string, string> = {
      "PC-ENERGY-1": "Grass Energy",
      "PC-ENERGY-2": "Water Energy",
      "PC-ENERGY-3": "Fighting Energy",
      "PC-ENERGY-4": "Metal Energy",
      "PC-ENERGY-5": "Psychic Energy",
    };
    let fallbackCount = 0;

    for (const product of gaps) {
      if (
        !product.series ||
        product.series === "Series" ||
        product.series === "?+20" ||
        product.series === ""
      )
        continue;

      const compositeKey = `${product.code}|${product.type}|${product.series}`;
      let url: string | null = null;

      try {
        // SVE energy cards
        const energyName = energyNames[product.code];
        if (energyName) {
          const res = await fetch(
            `${POKEMON_TCG_API}/cards?q=set.id:sve+name:"${encodeURIComponent(energyName)}"&pageSize=3`
          );
          if (res.ok) {
            const data = await res.json();
            url = data.data?.[0]?.images?.large || null;
          }
        }

        // Cards with number/total only (no set code)
        if (!url) {
          const numMatch = product.series.match(/^(\d+)\/(\d+)$/);
          if (numMatch) {
            const setId = totalsToSets[numMatch[2]];
            if (setId) {
              const res = await fetch(
                `${POKEMON_TCG_API}/cards?q=set.id:${setId}+number:${numMatch[1]}&pageSize=3`
              );
              if (res.ok) {
                const data = await res.json();
                url = data.data?.[0]?.images?.large || null;
              }
            }
          }
        }

        // Text-based series (shinning legend, etc.)
        if (!url && product.series.toLowerCase().includes("legend")) {
          const res = await fetch(
            `${POKEMON_TCG_API}/cards?q=set.id:sm35+name:"${encodeURIComponent(product.name)}"&pageSize=3`
          );
          if (res.ok) {
            const data = await res.json();
            url = data.data?.[0]?.images?.large || null;
          }
        }

        // Generic name search for anything else
        if (!url) {
          const res = await fetch(
            `${POKEMON_TCG_API}/cards?q=name:"${encodeURIComponent(product.name)}"&pageSize=10`
          );
          if (res.ok) {
            const data = await res.json();
            url = data.data?.[0]?.images?.large || null;
          }
        }

        if (url) {
          imageMap[product.id] = url;
          imageMap[compositeKey] = url;
          fallbackCount++;
        }
      } catch {
        // Silently skip
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    console.log(`  Filled ${fallbackCount} via pokemontcg.io`);
  }

  // 5. Write image map
  const outputPath = path.join(rootDir, "src", "data", "image-map.json");
  fs.writeFileSync(outputPath, JSON.stringify(imageMap, null, 2), "utf-8");

  // 6. Stats
  const totalEntries = Object.keys(imageMap).length;
  const uniqueImages = new Set(Object.values(imageMap)).size;
  const productsWithImages = products.filter((p) => imageMap[p.id]).length;

  console.log(`\n=== Image Map Summary ===`);
  console.log(`Total map entries: ${totalEntries} (dual-keyed)`);
  console.log(`Unique images: ${uniqueImages}`);
  console.log(`Products with images: ${productsWithImages}/${products.length}`);
  console.log(`Coverage: ${((productsWithImages / products.length) * 100).toFixed(1)}%`);
  console.log(`Matched by number: ${byNumber}, by name: ${byName}`);
  console.log(`Unmatched: ${unmatched}`);

  if (unmatchedProducts.length > 0) {
    console.log(`\nUnmatched products:`);
    unmatchedProducts.forEach((p) => console.log(`  ${p}`));
  }

  console.log(`\nOutput: ${outputPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

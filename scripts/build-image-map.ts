#!/usr/bin/env npx tsx
// ============================================================
// BUILD IMAGE MAP
// Generates src/data/image-map.json from validation report
// + pokemontcg.io API for unmatched cards
// ============================================================

import * as fs from "fs";
import * as path from "path";

interface ValidationEntry {
  product: {
    id: string;
    code: string;
    name: string;
    series: string;
    type: string;
    group: string;
  };
  tcgMatch: {
    found: boolean;
    officialImageLarge: string | null;
    officialImageSmall: string | null;
  };
}

interface Product {
  id: string;
  code: string;
  name: string;
  series: string;
  type: string;
}

// pokemontcg.io set ID mapping (user series code → pokemontcg.io set ID)
const POKEMON_TCG_SET_MAP: Record<string, string> = {
  SVI: "sv1",
  PAL: "sv2",
  OBF: "sv3",
  MEW: "sv3pt5",
  PAR: "sv4",
  PAF: "sv4pt5",
  TEF: "sv5",
  TWM: "sv6",
  SFA: "sv7pt5",
  SCR: "sv7",
  SSP: "sv8",
  PRE: "sv8pt5",
  JTG: "sv9",
  DRI: "sv10",
  BLK: "zsv10pt5",
  WHT: "rsv10pt5",
  MEG: "me1",
  PFL: "me2",
  ASC: "me2pt5",
  POR: "me3",
  PEL: "sv4pt5gg",
  SVE: "sv1pt5",
  SVP: "svp",
};

// D/F/E are multi-set codes from Sword & Shield era.
// The total card count determines which specific set.
const SWSH_SET_BY_TOTAL: Record<string, string> = {
  "202": "swsh1",      // Sword & Shield
  "192": "swsh2",      // Rebel Clash
  "189": "swsh3",      // Darkness Ablaze / Astral Radiance
  "72": "swsh4.5",     // Shining Fates
  "73": "swsh4.5",     // Shining Fates variant
  "163": "swsh5",      // Battle Styles
  "172": "swsh9",      // Brilliant Stars
  "264": "swsh8",      // Fusion Strike
  "159": "swsh12.5",   // Crown Zenith
  "78": "swsh10.5",    // Lost Origin
};

const POKEMON_TCG_API = "https://api.pokemontcg.io/v2";

function parseSeries(series: string): { setCode: string; cardNumber: string; totalCards: string } | null {
  const s = series.trim();
  if (!s) return null;
  const match = s.match(/^(.+?)\s+(\d+)\/(\d+)$/i);
  if (match) {
    const code = match[1].trim().toUpperCase().replace(/\s+(EN|GG|TG)$/i, "");
    return { setCode: code, cardNumber: match[2], totalCards: match[3] };
  }
  return null;
}

function getSetId(parsed: { setCode: string; totalCards: string }): string | null {
  if (["D", "F", "E"].includes(parsed.setCode)) {
    const total = String(parseInt(parsed.totalCards, 10));
    return SWSH_SET_BY_TOTAL[total] || null;
  }
  return POKEMON_TCG_SET_MAP[parsed.setCode] || null;
}

function buildImageUrl(setId: string, cardNumber: string): string {
  return `https://images.pokemontcg.io/${setId}/${cardNumber}_hires.png`;
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
    .replace(/\s+(EX|V|VMAX|VSTAR|GX|LV\s*X|E4|BREAK|PRISMATIC|STELLAR|\d+)$/i, "")
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
    if (naNoHyphen.includes(nbNoHyphen) || nbNoHyphen.includes(naNoHyphen)) return true;
  }

  if (ba.length >= 4 && bb.length >= 4) {
    const dist = levenshtein(ba.replace(/-/g, ""), bb.replace(/-/g, ""));
    if (dist <= 2) return true;
  }

  return false;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface PokemonTcgCard {
  id: string;
  name: string;
  number: string;
  images: { small: string; large: string };
  set: { id: string; name: string };
}

// Cache of cards fetched per set from pokemontcg.io
const setCardCache = new Map<string, PokemonTcgCard[]>();

async function fetchSetCards(setId: string): Promise<PokemonTcgCard[]> {
  if (setCardCache.has(setId)) return setCardCache.get(setId)!;

  const allCards: PokemonTcgCard[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const res = await fetch(
        `${POKEMON_TCG_API}/cards?q=set.id:${setId}&pageSize=250&page=${page}`
      );
      if (!res.ok) break;
      const data = await res.json();
      allCards.push(...data.data);
      hasMore = data.page * data.pageSize < data.totalCount;
      page++;
      if (hasMore) await sleep(100);
    } catch {
      break;
    }
  }

  setCardCache.set(setId, allCards);
  return allCards;
}

async function searchCardsByName(name: string): Promise<PokemonTcgCard[]> {
  try {
    const res = await fetch(
      `${POKEMON_TCG_API}/cards?q=name:"${encodeURIComponent(name)}"&pageSize=10`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function main() {
  console.log("=== Build Image Map (pokemontcg.io) ===\n");

  const rootDir = path.resolve(__dirname, "..");

  // 1. Load validation report
  const reportPath = path.join(rootDir, "public", "data", "validation-report.json");
  if (!fs.existsSync(reportPath)) {
    console.error("validation-report.json not found. Run `npm run validate-cards` first.");
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  const results: ValidationEntry[] = report.results || [];
  console.log(`Loaded ${results.length} validation entries`);

  // 2. Load products for composite keys
  const productsPath = path.join(rootDir, "src", "data", "products.json");
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
  console.log(`Loaded ${products.length} products`);

  // 3. Build image map from validation report — use pokemontcg.io URLs, fallback if not available
  const imageMap: Record<string, string> = {};
  let fromReport = 0;
  let convertedToPokemontcg = 0;

  for (const entry of results) {
    if (!entry.tcgMatch.found) continue;
    // Prefer large image from pokemontcg.io
    const imageUrl =
      entry.tcgMatch.officialImageLarge ||
      entry.tcgMatch.officialImageSmall;
    if (!imageUrl) continue;

    const productId = entry.product.id;
    const compositeKey = `${entry.product.code}|${entry.product.type}|${entry.product.series}`;

    // If URL is from scrydex or tcgdex, try to convert to pokemontcg.io
    if (imageUrl.includes("scrydex.com") || imageUrl.includes("tcgdex.net")) {
      // Try to find the product's series to build a pokemontcg.io URL
      const parsed = parseSeries(entry.product.series);
      if (parsed) {
        const setId = getSetId(parsed);
        if (setId) {
          // First try to find the exact card in the set
          const cards = await fetchSetCards(setId);
          const cardMatch = cards.find(c =>
            c.number === parsed.cardNumber && namesMatch(c.name, entry.product.name)
          );

          if (cardMatch && cardMatch.images?.large) {
            imageMap[productId] = cardMatch.images.large;
            imageMap[compositeKey] = cardMatch.images.large;
            fromReport++;
            convertedToPokemontcg++;
            continue;
          }
        }
      }

      // If we can't convert, use the original URL
      imageMap[productId] = imageUrl;
      imageMap[compositeKey] = imageUrl;
      fromReport++;
    } else {
      // Use pokemontcg.io URL directly
      imageMap[productId] = imageUrl;
      imageMap[compositeKey] = imageUrl;
      fromReport++;
    }
  }

  console.log(`  ${fromReport} images from validation report (${convertedToPokemontcg} converted to pokemontcg.io)`);

  // 4. For products not in validation report or without images
  let fromSearch = 0;

  for (const product of products) {
    if (imageMap[product.id]) continue;

    const parsed = parseSeries(product.series);
    if (!parsed) continue;

    const setId = getSetId(parsed);
    if (setId) {
      // Try matching by card number within the set
      const cards = await fetchSetCards(setId);
      const match = cards.find((c) =>
        c.number === parsed.cardNumber && namesMatch(c.name, product.name)
      );

      if (match && match.images?.large) {
        const compositeKey = `${product.code}|${product.type}|${product.series}`;
        imageMap[product.id] = match.images.large;
        imageMap[compositeKey] = match.images.large;
        fromSearch++;
      }
    } else {
      // Fallback: search pokemontcg.io API by name
      const searchResults = await searchCardsByName(product.name);
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normName = norm(product.name);

      const match =
        searchResults.find((c) => norm(c.name) === normName) ||
        searchResults.find((c) => {
          const cn = norm(c.name);
          return cn.includes(normName) || normName.includes(cn);
        });

      if (match && match.images?.large) {
        const compositeKey = `${product.code}|${product.type}|${product.series}`;
        imageMap[product.id] = match.images.large;
        imageMap[compositeKey] = match.images.large;
        fromSearch++;
      }
    }

    await sleep(100);
  }

  if (fromSearch > 0) {
    console.log(`  ${fromSearch} images from pokemontcg.io name search`);
  }

  // 5. Write image map
  const outputPath = path.join(rootDir, "src", "data", "image-map.json");
  fs.writeFileSync(outputPath, JSON.stringify(imageMap, null, 2), "utf-8");

  // 6. Stats
  const totalEntries = Object.keys(imageMap).length;
  const uniqueImages = new Set(Object.values(imageMap)).size;
  const productsWithImages = products.filter((p) => imageMap[p.id]).length;
  const pokemontcgUrls = Array.from(new Set(Object.values(imageMap))).filter(v => v.includes("pokemontcg.io")).length;

  console.log(`\n=== Image Map Summary ===`);
  console.log(`Total map entries: ${totalEntries} (dual-keyed)`);
  console.log(`Unique images: ${uniqueImages}`);
  console.log(`Products with images: ${productsWithImages}/${products.length}`);
  console.log(`Coverage: ${((productsWithImages / products.length) * 100).toFixed(1)}%`);
  console.log(`pokemontcg.io URLs: ${pokemontcgUrls}/${uniqueImages} (${((pokemontcgUrls / uniqueImages) * 100).toFixed(1)}%)`);
  console.log(`\nOutput: ${outputPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

#!/usr/bin/env npx tsx
// ============================================================
// BUILD IMAGE MAP
// Generates src/data/image-map.json from validation report
// + TCGdex API for unmatched cards
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

// TCGdex set ID mapping (user series code → TCGdex set ID)
const TCGDEX_SET_MAP: Record<string, string> = {
  MEG: "me01",
  PFL: "me02",
  ASC: "me02.5",
  POR: "me03",
  SVI: "sv01",
  PAL: "sv02",
  OBF: "sv03",
  MEW: "sv03.5",
  PAR: "sv04",
  PAF: "sv04.5",
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
  SVE: "sve",
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

const TCGDEX_BASE = "https://api.tcgdex.net/v2/en";

// TCGdex image URLs need /high.png suffix to return actual image (bare URL returns text/html)
function fixTcgdexUrl(url: string): string {
  if (url.includes("assets.tcgdex.net") && !url.endsWith(".png") && !url.endsWith(".webp")) {
    return url + "/high.png";
  }
  return url;
}

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

function getTCGdexSetId(parsed: { setCode: string; totalCards: string }): string | null {
  // D/F/E codes need total card count to determine the set
  if (["D", "F", "E"].includes(parsed.setCode)) {
    const total = String(parseInt(parsed.totalCards, 10)); // "072" → "72"
    return SWSH_SET_BY_TOTAL[total] || null;
  }
  return TCGDEX_SET_MAP[parsed.setCode] || null;
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

// Base Pokémon name without variant suffixes (ex, V, VMAX, GX, etc.)
function baseName(name: string): string {
  return normalizeName(name)
    .replace(/\s+(EX|V|VMAX|VSTAR|GX|LV\s*X|E4|BREAK|PRISMATIC|STELLAR|\d+)$/i, "")
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;

  // Check base names (strips EX, V, VMAX, etc.)
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

  // Levenshtein for short differences (handles typos like ARBOLIVIA vs ARBOLIVA)
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

async function fetchTCGdexCards(setId: string): Promise<any[]> {
  try {
    const res = await fetch(`${TCGDEX_BASE}/sets/${setId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.cards || [];
  } catch {
    return [];
  }
}

async function main() {
  console.log("=== Build Image Map ===\n");

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

  // Build product lookup by ID
  const productById = new Map<string, Product>();
  for (const p of products) {
    productById.set(p.id, p);
  }

  // 3. Build image map from validation report
  const imageMap: Record<string, string> = {};
  let fromReport = 0;

  for (const entry of results) {
    if (!entry.tcgMatch.found) continue;
    const imageUrl =
      entry.tcgMatch.officialImageLarge ||
      entry.tcgMatch.officialImageSmall;
    if (!imageUrl) continue;

    // Key by product ID
    const productId = entry.product.id;
    imageMap[productId] = imageUrl;

    // Also key by composite: code|type|series
    const compositeKey = `${entry.product.code}|${entry.product.type}|${entry.product.series}`;
    imageMap[compositeKey] = imageUrl;

    fromReport++;
  }

  console.log(`  ${fromReport} images from validation report`);

  // 3b. Override products where card numbering doesn't match English API sets.
  // The validation report matched by card number, but Japanese sets have different numbering.
  // Use TCGdex name-based matching for these products.
  const tcgdexCache = new Map<string, any[]>();
  let overridden = 0;

  // Known API total cards per set (from pokemontcg.io / TCGdex English)
  const API_SET_TOTALS: Record<string, number> = {
    me01: 188, me02: 130, "me02.5": 295, me03: 124,
    sv01: 198, sv02: 193, sv03: 197, "sv03.5": 165,
    sv04: 266, "sv04.5": 245, sv05: 162, sv06: 167,
    "sv06.5": 99, sv07: 142, sv08: 252, "sv08.5": 180,
    sv09: 159, sv10: 244,
    "sv10.5b": 172, "sv10.5w": 173,
    sve: 17, svp: 200,
    swsh1: 216, swsh2: 209, swsh3: 201, "swsh4.5": 195,
    swsh5: 183, swsh9: 216, swsh8: 284, "swsh12.5": 230,
    "swsh10.5": 88,
  };

  const needsOverride = products.filter((p) => {
    const parsed = parseSeries(p.series);
    if (!parsed) return false;

    // D/F/E always need override (multi-set codes)
    if (["D", "F", "E"].includes(parsed.setCode)) return true;

    // Check if card count matches API total
    const setId = getTCGdexSetId(parsed);
    if (!setId) return false;
    const apiTotal = API_SET_TOTALS[setId];
    if (!apiTotal) return false;
    return parseInt(parsed.totalCards) !== apiTotal;
  });

  console.log(`  ${needsOverride.length} products need TCGdex name-based matching`);

  for (const product of needsOverride) {
    const parsed = parseSeries(product.series);
    if (!parsed) continue;
    const setId = getTCGdexSetId(parsed);

    let match: any = null;

    // First try the mapped set
    if (setId) {
      if (!tcgdexCache.has(setId)) {
        const cards = await fetchTCGdexCards(setId);
        tcgdexCache.set(setId, cards);
        console.log(`  Fetched TCGdex set ${setId}: ${cards.length} cards`);
      }

      const cards = tcgdexCache.get(setId)!;
      match =
        cards.find((c: any) => c.localId === parsed.cardNumber && namesMatch(c.name || "", product.name)) ||
        cards.find((c: any) => namesMatch(c.name || "", product.name));
    }

    // If not found in the mapped set, search TCGdex globally by name
    if (!match || !match.image) {
      try {
        const searchRes = await fetch(
          `${TCGDEX_BASE}/cards?name=${encodeURIComponent(product.name)}&pagination:page=1&pagination:itemsPerPage=5`
        );
        if (searchRes.ok) {
          const searchCards = await searchRes.json();
          const found = (Array.isArray(searchCards) ? searchCards : []).find(
            (c: any) => namesMatch(c.name || "", product.name) && c.image
          );
          if (found) match = found;
        }
      } catch {
        // global search failed
      }
    }

    if (match && match.image) {
      const compositeKey = `${product.code}|${product.type}|${product.series}`;
      imageMap[product.id] = fixTcgdexUrl(match.image);
      imageMap[compositeKey] = fixTcgdexUrl(match.image);
      overridden++;
    }
  }

  if (overridden > 0) {
    console.log(`  Overridden ${overridden} images with correct TCGdex name-based matching`);
  }

  // 4. Find unmatched products
  const unmatched = results.filter((r) => !r.tcgMatch.found);
  console.log(`  ${unmatched.length} unmatched products`);

  // 5. Try TCGdex for unmatched
  let fromTCGdex = 0;
  const tcgdexSetsFetched = new Set<string>();

  for (const entry of unmatched) {
    const parsed = parseSeries(entry.product.series);
    if (!parsed) continue;

    const setId = getTCGdexSetId(parsed);
    if (!setId) continue;

    // Fetch set cards (cached)
    if (!tcgdexCache.has(setId)) {
      const cards = await fetchTCGdexCards(setId);
      tcgdexCache.set(setId, cards);
      console.log(`  Fetched TCGdex set ${setId}: ${cards.length} cards`);
    }

    const cards = tcgdexCache.get(setId)!;

    // Try matching by card number (only if name also roughly matches)
    let match = cards.find(
      (c: any) => c.localId === parsed.cardNumber && namesMatch(c.name || "", entry.product.name)
    );

    // Try matching by name only
    if (!match) {
      match = cards.find((c: any) => namesMatch(c.name || "", entry.product.name));
    }

    if (match && match.image) {
      const productId = entry.product.id;
      const compositeKey = `${entry.product.code}|${entry.product.type}|${entry.product.series}`;
      imageMap[productId] = fixTcgdexUrl(match.image);
      imageMap[compositeKey] = fixTcgdexUrl(match.image);
      fromTCGdex++;
      console.log(`    TCGdex match: ${entry.product.name} → ${match.name} (${fixTcgdexUrl(match.image)})`);
    }
  }

  console.log(`  ${fromTCGdex} images from TCGdex`);

  // 6. Try TCGdex for products not in validation report at all
  let extraFound = 0;
  for (const product of products) {
    if (imageMap[product.id]) continue;

    const parsed = parseSeries(product.series);
    if (!parsed) continue;

    const setId = getTCGdexSetId(parsed);
    if (!setId) continue;

    if (!tcgdexCache.has(setId)) {
      const cards = await fetchTCGdexCards(setId);
      tcgdexCache.set(setId, cards);
    }

    const cards = tcgdexCache.get(setId)!;
    const match =
      cards.find((c: any) => c.localId === parsed.cardNumber && namesMatch(c.name || "", product.name)) ||
      cards.find((c: any) => namesMatch(c.name || "", product.name));

    if (match && match.image) {
      const compositeKey = `${product.code}|${product.type}|${product.series}`;
      imageMap[product.id] = fixTcgdexUrl(match.image);
      imageMap[compositeKey] = fixTcgdexUrl(match.image);
      extraFound++;
    }
  }

  if (extraFound > 0) {
    console.log(`  ${extraFound} extra images from TCGdex`);
  }

  // 7. Write image map
  const outputPath = path.join(rootDir, "src", "data", "image-map.json");
  fs.writeFileSync(outputPath, JSON.stringify(imageMap, null, 2), "utf-8");

  // 8. Stats
  const totalEntries = Object.keys(imageMap).length;
  const uniqueImages = new Set(Object.values(imageMap)).size;
  const productsWithImages = products.filter((p) => imageMap[p.id]).length;

  console.log(`\n=== Image Map Summary ===`);
  console.log(`Total map entries: ${totalEntries} (dual-keyed)`);
  console.log(`Unique images: ${uniqueImages}`);
  console.log(`Products with images: ${productsWithImages}/${products.length}`);
  console.log(`Coverage: ${((productsWithImages / products.length) * 100).toFixed(1)}%`);
  console.log(`\nOutput: ${outputPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

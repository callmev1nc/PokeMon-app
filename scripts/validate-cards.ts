#!/usr/bin/env npx tsx
// ============================================================
// POKÉMON CARD VALIDATION & DATA ENRICHMENT TOOL
// ============================================================
// Validates product data against the Pokémon TCG API (pokemontcg.io)
// and generates a structured validation report.
//
// Usage:
//   npx tsx scripts/validate-cards.ts
//   npx tsx scripts/validate-cards.ts --api-key=YOUR_KEY
//   npx tsx scripts/validate-cards.ts --sheet-url=URL        (fetch image URLs from Google Sheet)
//   npx tsx scripts/validate-cards.ts --output=report.json   (custom output path)
//
// Output: validation-report.json with matched TCG data, image
//         validation status, and enrichment suggestions.
// ============================================================

import * as fs from "fs";
import * as path from "path";

// ─── Types ──────────────────────────────────────────────────

interface Product {
  id: string;
  code: string;
  name: string;
  series: string;
  type: string;
  displayType: string;
  group: string;
  price: number | null;
  buyPrice: number | null;
  stock: number;
  image?: string; // from Google Sheet
}

interface TCGSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  ptcgoCode?: string;
  releaseDate: string;
}

interface TCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  hp?: string;
  types?: string[];
  set: { id: string; name: string; series: string };
  number: string;
  rarity?: string;
  flavorText?: string;
  images: { small: string; large: string };
  tcgplayer?: { url?: string };
}

interface ValidationEntry {
  product: {
    id: string;
    code: string;
    name: string;
    series: string;
    type: string;
    group: string;
    imageUrl: string | null;
  };
  tcgMatch: {
    found: boolean;
    cardId: string | null;
    cardName: string | null;
    cardNumber: string | null;
    setName: string | null;
    setId: string | null;
    setSeries: string | null;
    supertype: string | null;
    subtypes: string[] | null;
    pokemonTypes: string[] | null;
    hp: string | null;
    rarity: string | null;
    flavorText: string | null;
    officialImageSmall: string | null;
    officialImageLarge: string | null;
  };
  validation: {
    imageStatus: "Valid" | "Invalid" | "Needs Review" | "No Image";
    reason: string;
    dataMatch: boolean;
    nameMatch: boolean;
    seriesMatch: boolean;
  };
  suggestion: {
    correctImageUrl: string | null;
    correctName: string | null;
  };
}

interface ValidationReport {
  generatedAt: string;
  summary: {
    totalProducts: number;
    matched: number;
    unmatched: number;
    imageValid: number;
    imageInvalid: number;
    imageNeedsReview: number;
    imageNone: number;
  };
  setMapping: Record<string, { setId: string; setName: string; cards: number }>;
  results: ValidationEntry[];
}

// ─── Constants ──────────────────────────────────────────────

const TCG_API_BASE = "https://api.pokemontcg.io/v2";
const DEFAULT_DELAY_MS = 120;
const PAGE_SIZE = 250;

// Known user series code → TCG API set ID mapping
// Built by comparing series codes with TCG API set abbreviations
const KNOWN_SET_MAP: Record<string, string> = {
  SVI: "sv1",       // Scarlet & Violet
  PAL: "sv2",       // Paldea Evolved
  OBF: "sv3",       // Obsidian Flames
  MEW: "sv3pt5",    // Pokémon 151
  PAR: "sv4",       // Paradox Rift
  PAF: "sv4pt5",    // Paldean Fates
  TEF: "sv5",       // Temporal Forces
  TWM: "sv6",       // Twilight Masquerade
  SCR: "sv7",       // Stellar Crown
  SSP: "sv8",       // Surging Sparks
  PRE: "sv8pt5",    // Prismatic Evolutions
  JTG: "sv9",       // Journey Together
  DRI: "sv10",      // Destined Rivals
  MEG: "me1",       // Mega Evolution
  ASC: "me2pt5",    // Ascended Heroes
  POR: "me3",       // Perfect Order
  PFL: "me2",       // Phantasmal Flames
  SFA: "sv7pt5",    // Shrouded Fable
  BLK: "zsv10pt5",  // Black Bolt
  WHT: "rsv10pt5",  // White Flare
  PEL: "sv4pt5gg",  // Paldean Fates Galarian Gallery
  SVE: "sv1pt5",    // Scarlet & Violet Energies
  SVP: "svp",       // Scarlet & Violet Promos
  F: "sv1",         // subset
  D: "sv1",         // subset
  E: "sv1",         // subset
  LOST: "swsh11tg", // Lost Origin trainer gallery
  "SUN AND MOON": "sm1",   // Sun & Moon Base
  SHINNING: "sm35", // Shining Legends
  FPL: "swsh11",    // Lost Origin variant
};

// ─── API Client ─────────────────────────────────────────────

class TCGApiClient {
  private apiKey: string | null;
  private delayMs: number;

  constructor(apiKey?: string, delayMs = DEFAULT_DELAY_MS) {
    this.apiKey = apiKey || null;
    this.delayMs = delayMs;
  }

  private async fetch(endpoint: string): Promise<any> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["X-Api-Key"] = this.apiKey;
    }

    let retries = 0;
    while (retries < 3) {
      const res = await fetch(`${TCG_API_BASE}${endpoint}`, { headers });
      if (res.status === 429) {
        const wait = this.delayMs * (retries + 2);
        console.log(`  Rate limited, waiting ${wait}ms...`);
        await sleep(wait);
        retries++;
        continue;
      }
      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${res.statusText} for ${endpoint}`);
      }
      return res.json();
    }
    throw new Error(`API rate limit exceeded after 3 retries for ${endpoint}`);
  }

  async getAllSets(): Promise<TCGSet[]> {
    const data = await this.fetch(`/sets?pageSize=500&orderBy=-releaseDate`);
    return data.data;
  }

  async getCardsBySet(setId: string): Promise<TCGCard[]> {
    const allCards: TCGCard[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const data = await this.fetch(
        `/cards?q=set.id:${setId}&pageSize=${PAGE_SIZE}&page=${page}`
      );
      allCards.push(...data.data);
      hasMore = data.page * data.pageSize < data.totalCount;
      page++;
      if (hasMore) await sleep(this.delayMs);
    }
    return allCards;
  }

  async searchCards(query: string): Promise<TCGCard[]> {
    const data = await this.fetch(
      `/cards?q=${encodeURIComponent(query)}&pageSize=10`
    );
    return data.data;
  }
}

// ─── Helpers ────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parseSeries(series: string): { setCode: string; cardNumber: string } | null {
  const s = series.trim();
  if (!s) return null;

  // Match patterns like "TWM 80/167", "SFA EN 054/064", "PRE 001/..."
  const match = s.match(/^(.+?)\s+(\d+)\//i);
  if (match) {
    let code = match[1].trim().toUpperCase();
    // Strip common suffixes like "EN" (English), "GG"
    code = code.replace(/\s+(EN|GG|TG)$/i, "");
    return {
      setCode: code,
      cardNumber: match[2],
    };
  }

  // Match just a number pattern "91/111"
  const numOnly = s.match(/^(\d+)\/(\d+)$/);
  if (numOnly) {
    return { setCode: "", cardNumber: numOnly[1] };
  }

  // Just a set code with no number
  if (/^[A-Z]+$/i.test(s)) {
    return { setCode: s.toUpperCase(), cardNumber: "" };
  }

  return null;
}

function matchSupertype(group: string): string {
  const g = group.toLowerCase().trim();
  if (g === "pokemon") return "Pokémon";
  if (g === "suppoter" || g === "supporter") return "Trainer";
  if (g === "stadium") return "Trainer";
  if (g === "item") return "Trainer";
  if (g === "tool") return "Trainer";
  if (g === "stype") return "Trainer";
  if (g === "energy" || g === "special energy") return "Energy";
  return "";
}

function mapGroupToSubtype(group: string): string[] {
  const g = group.toLowerCase().trim();
  if (g === "suppoter" || g === "supporter") return ["Supporter"];
  if (g === "stadium") return ["Stadium"];
  if (g === "item") return ["Item"];
  if (g === "tool") return ["Pokémon Tool"];
  if (g === "special energy") return ["Special"];
  return [];
}

function normalizeName(name: string): string {
  return name
    .toUpperCase()
    // Normalize hyphenated names: "CHI - YU" → "CHI-YU"
    .replace(/\s*-\s*/g, "-")
    // Remove apostrophes: "LONO'S" → "LONOS"
    .replace(/['']/g, "")
    // Keep hyphens, letters, numbers
    .replace(/[^A-Z0-9\-\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;

  // Try without hyphens: "CHI-YU" → "CHIYU"
  const naNoHyphen = na.replace(/-/g, "");
  const nbNoHyphen = nb.replace(/-/g, "");
  if (naNoHyphen === nbNoHyphen) return true;

  // Try substring match (longer contains shorter)
  if (na.length > 2 && nb.length > 2) {
    if (na.includes(nb) || nb.includes(na)) return true;
    if (naNoHyphen.includes(nbNoHyphen) || nbNoHyphen.includes(naNoHyphen)) return true;
  }

  // Simple typo tolerance: if Levenshtein distance ≤ 2 for short names, ≤ 3 for longer
  if (na.length >= 4 && nb.length >= 4) {
    const dist = levenshtein(naNoHyphen, nbNoHyphen);
    const threshold = Math.max(2, Math.floor(Math.max(na.length, nb.length) * 0.2));
    if (dist <= threshold) return true;
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

// ─── Google Sheet Image Fetcher ─────────────────────────────

async function fetchSheetImages(sheetUrl: string): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();
  try {
    const res = await fetch(`${sheetUrl}?action=menu`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();

    for (const p of products) {
      if (p.image && p.image.trim()) {
        const key = `${(p.code || "").trim()}|${(p.series || "").trim().toUpperCase()}`;
        imageMap.set(key, p.image.trim());
      }
    }
    console.log(`  Loaded ${imageMap.size} image URLs from Google Sheet`);
  } catch (err: any) {
    console.warn(`  Could not fetch sheet images: ${err.message}`);
  }
  return imageMap;
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  // Parse CLI args
  const args = process.argv.slice(2);
  let apiKey: string | undefined;
  let sheetUrl: string | undefined;
  let outputPath = path.resolve(__dirname, "..", "validation-report.json");

  for (const arg of args) {
    if (arg.startsWith("--api-key=")) apiKey = arg.split("=")[1];
    else if (arg.startsWith("--sheet-url=")) sheetUrl = arg.split("=")[1];
    else if (arg.startsWith("--output=")) outputPath = arg.split("=")[1];
  }

  console.log("=== Pokémon Card Validation Tool ===\n");

  // 1. Load products
  const productsPath = path.resolve(__dirname, "..", "src", "data", "products.json");
  if (!fs.existsSync(productsPath)) {
    console.error("products.json not found. Run `npm run build-data` first.");
    process.exit(1);
  }
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
  console.log(`Loaded ${products.length} products\n`);

  // 2. Optionally fetch image URLs from Google Sheet
  let imageMap = new Map<string, string>();
  if (sheetUrl) {
    console.log("Fetching image URLs from Google Sheet...");
    imageMap = await fetchSheetImages(sheetUrl);
    console.log();
  }

  // 3. Initialize API client
  const client = new TCGApiClient(apiKey);

  // 4. Fetch all sets
  console.log("Fetching Pokémon TCG sets...");
  const sets: TCGSet[] = await client.getAllSets();
  console.log(`  Found ${sets.length} sets\n`);

  // Build ptcgoCode → set ID mapping
  const ptcgoToSetId = new Map<string, string>();
  const setNameToSetId = new Map<string, string>();
  const allSetsMap = new Map<string, TCGSet>();
  for (const set of sets) {
    allSetsMap.set(set.id, set);
    if (set.ptcgoCode) {
      ptcgoToSetId.set(set.ptcgoCode.toUpperCase(), set.id);
    }
    setNameToSetId.set(set.name.toLowerCase(), set.id);
  }

  // 5. Build set mapping from user series codes
  console.log("Mapping series codes to TCG sets...");
  const seriesToSetId = new Map<string, string>();
  const seriesToSetName = new Map<string, string>();
  const unmatchedSeries = new Set<string>();

  for (const product of products) {
    const parsed = parseSeries(product.series);
    if (!parsed || !parsed.setCode) continue;

    const code = parsed.setCode;
    if (seriesToSetId.has(code)) continue;

    // Try known mapping first
    if (KNOWN_SET_MAP[code]) {
      const setId = KNOWN_SET_MAP[code];
      const set = allSetsMap.get(setId);
      if (set) {
        seriesToSetId.set(code, setId);
        seriesToSetName.set(code, set.name);
        continue;
      }
    }

    // Try ptcgoCode matching
    if (ptcgoToSetId.has(code)) {
      const setId = ptcgoToSetId.get(code)!;
      const set = allSetsMap.get(setId);
      seriesToSetId.set(code, setId);
      seriesToSetName.set(code, set!.name);
      continue;
    }

    // Try partial name match
    let found = false;
    for (const set of sets) {
      const setNameNorm = set.name.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const codeNorm = code.replace(/[^A-Z0-9]/g, "");
      if (setNameNorm.includes(codeNorm) || codeNorm.includes(setNameNorm)) {
        seriesToSetId.set(code, set.id);
        seriesToSetName.set(code, set.name);
        found = true;
        break;
      }
    }
    if (!found) {
      unmatchedSeries.add(code);
    }
  }

  console.log(`  Mapped ${seriesToSetId.size} series codes`);
  if (unmatchedSeries.size > 0) {
    console.log(`  Unmapped codes: ${[...unmatchedSeries].join(", ")}`);
  }
  console.log();

  // 6. Fetch cards for each mapped set
  console.log("Fetching card data from TCG API...");
  const cardCache = new Map<string, TCGCard>(); // key: "setId|number" or "setId|name"
  const setsToFetch = new Set(seriesToSetId.values());

  let fetchedSets = 0;
  for (const setId of setsToFetch) {
    fetchedSets++;
    const set = allSetsMap.get(setId);
    const setName = set ? set.name : setId;
    process.stdout.write(`  [${fetchedSets}/${setsToFetch.size}] ${setName}...`);

    try {
      const cards = await client.getCardsBySet(setId);
      for (const card of cards) {
        // Index by number within set
        cardCache.set(`${setId}|${card.number}`, card);
        // Also index by name within set for fuzzy matching
        const nameKey = `${setId}|${normalizeName(card.name)}`;
        if (!cardCache.has(nameKey)) {
          cardCache.set(nameKey, card);
        }
      }
      console.log(` ${cards.length} cards`);
    } catch (err: any) {
      console.log(` ERROR: ${err.message}`);
    }
    await sleep(80);
  }
  console.log(`  Cached ${cardCache.size} card entries\n`);

  // 7. Validate each product
  console.log("Validating products...");
  const results: ValidationEntry[] = [];
  let matched = 0, unmatched = 0;
  let imgValid = 0, imgInvalid = 0, imgReview = 0, imgNone = 0;

  for (const product of products) {
    const parsed = parseSeries(product.series);
    const setImageUrl = getImageUrl(product, imageMap);

    // Try to find matching TCG card
    let match: TCGCard | null = null;
    let matchMethod = "";

    if (parsed) {
      const setId = seriesToSetId.get(parsed.setCode);

      if (setId) {
        // Try exact match by card number
        const numKey = `${setId}|${parsed.cardNumber}`;
        if (cardCache.has(numKey)) {
          match = cardCache.get(numKey)!;
          matchMethod = "number";
        }

        // Try name match within the set
        if (!match) {
          const nameKey = `${setId}|${normalizeName(product.name)}`;
          if (cardCache.has(nameKey)) {
            match = cardCache.get(nameKey)!;
            matchMethod = "name-in-set";
          }
        }
      }
    }

    // Fallback: search across all sets by name
    if (!match) {
      for (const [key, card] of cardCache) {
        if (namesMatch(card.name, product.name)) {
          // Check if set also makes sense
          if (parsed && seriesToSetId.has(parsed.setCode)) {
            const expectedSetId = seriesToSetId.get(parsed.setCode)!;
            if (card.set.id === expectedSetId) {
              match = card;
              matchMethod = "name-set-filter";
              break;
            }
          } else {
            match = card;
            matchMethod = "name-any-set";
            break;
          }
        }
      }
    }

    // Build validation entry
    const entry = buildValidationEntry(product, match, matchMethod, setImageUrl);
    results.push(entry);

    // Track stats
    if (match) matched++;
    else unmatched++;

    switch (entry.validation.imageStatus) {
      case "Valid": imgValid++; break;
      case "Invalid": imgInvalid++; break;
      case "Needs Review": imgReview++; break;
      case "No Image": imgNone++; break;
    }
  }

  // 8. Build report
  const setMapping: Record<string, { setId: string; setName: string; cards: number }> = {};
  for (const [code, setId] of seriesToSetId) {
    const set = allSetsMap.get(setId);
    setMapping[code] = {
      setId,
      setName: set?.name || setId,
      cards: set?.printedTotal || 0,
    };
  }

  const report: ValidationReport = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalProducts: products.length,
      matched,
      unmatched,
      imageValid: imgValid,
      imageInvalid: imgInvalid,
      imageNeedsReview: imgReview,
      imageNone: imgNone,
    },
    setMapping,
    results,
  };

  // Write report
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");

  // Print summary
  console.log("\n=== Validation Summary ===");
  console.log(`Total products:    ${products.length}`);
  console.log(`Matched to TCG:    ${matched} (${(matched / products.length * 100).toFixed(1)}%)`);
  console.log(`Unmatched:         ${unmatched}`);
  console.log();
  console.log("Image Status:");
  console.log(`  Valid:           ${imgValid}`);
  console.log(`  Invalid:         ${imgInvalid}`);
  console.log(`  Needs Review:    ${imgReview}`);
  console.log(`  No Image:        ${imgNone}`);
  console.log();
  console.log(`Report saved to: ${outputPath}`);
}

function getImageUrl(product: Product, imageMap: Map<string, string>): string | null {
  // Check map first (from Google Sheet)
  const key = `${product.code}|${product.series.toUpperCase()}`;
  if (imageMap.has(key)) return imageMap.get(key)!;
  // Check product object
  if (product.image && product.image.trim()) return product.image.trim();
  return null;
}

function buildValidationEntry(
  product: Product,
  match: TCGCard | null,
  matchMethod: string,
  imageUrl: string | null
): ValidationEntry {
  const entry: ValidationEntry = {
    product: {
      id: product.id,
      code: product.code,
      name: product.name,
      series: product.series,
      type: product.type,
      group: product.group,
      imageUrl,
    },
    tcgMatch: {
      found: !!match,
      cardId: match?.id || null,
      cardName: match?.name || null,
      cardNumber: match?.number || null,
      setName: match?.set.name || null,
      setId: match?.set.id || null,
      setSeries: match?.set.series || null,
      supertype: match?.supertype || null,
      subtypes: match?.subtypes || null,
      pokemonTypes: match?.types || null,
      hp: match?.hp || null,
      rarity: match?.rarity || null,
      flavorText: match?.flavorText || null,
      officialImageSmall: match?.images.small || null,
      officialImageLarge: match?.images.large || null,
    },
    validation: {
      imageStatus: "No Image",
      reason: "",
      dataMatch: false,
      nameMatch: false,
      seriesMatch: false,
    },
    suggestion: {
      correctImageUrl: null,
      correctName: null,
    },
  };

  // Validation logic
  if (!match) {
    entry.validation.reason = "No matching card found in Pokémon TCG database";
    entry.validation.imageStatus = imageUrl ? "Needs Review" : "No Image";
    if (imageUrl) {
      entry.validation.reason += ". Image exists but could not verify against TCG data.";
    }
    return entry;
  }

  // Check name match
  entry.validation.nameMatch = namesMatch(product.name, match.name);
  if (!entry.validation.nameMatch) {
    entry.suggestion.correctName = match.name;
  }

  // Check series match
  const parsed = parseSeries(product.series);
  if (parsed && parsed.cardNumber) {
    entry.validation.seriesMatch = parsed.cardNumber === match.number;
  } else {
    entry.validation.seriesMatch = true; // no series to compare
  }

  // Overall data match
  entry.validation.dataMatch = entry.validation.nameMatch && entry.validation.seriesMatch;

  // Image validation
  if (!imageUrl) {
    entry.validation.imageStatus = "No Image";
    entry.suggestion.correctImageUrl = match.images.large;
    entry.validation.reason = `No image URL in dataset. Official image available from ${match.set.name}.`;
  } else {
    // Check if the image URL matches the official one
    const officialSmall = match.images.small;
    const officialLarge = match.images.large;

    if (imageUrl === officialSmall || imageUrl === officialLarge) {
      entry.validation.imageStatus = "Valid";
      entry.validation.reason = "Image URL matches official Pokémon TCG image.";
    } else if (
      imageUrl.includes("pokemontcg.io") ||
      imageUrl.includes("pokemon.com")
    ) {
      entry.validation.imageStatus = "Valid";
      entry.validation.reason = "Image from official Pokémon source.";
    } else {
      // External image - can't verify without downloading
      entry.validation.imageStatus = "Needs Review";
      entry.suggestion.correctImageUrl = officialLarge;
      entry.validation.reason = `Image from external source. Cross-reference recommended. Official: ${match.set.name} #${match.number}.`;
    }

    // If data doesn't match, image might be wrong
    if (!entry.validation.dataMatch) {
      entry.validation.imageStatus = "Invalid";
      const reasons: string[] = [];
      if (!entry.validation.nameMatch) {
        reasons.push(`Name mismatch: "${product.name}" vs TCG "${match.name}"`);
      }
      if (!entry.validation.seriesMatch) {
        reasons.push(`Card number mismatch: "${parsed?.cardNumber}" vs TCG #${match.number}`);
      }
      entry.validation.reason = reasons.join(". ") + ".";
    }
  }

  return entry;
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

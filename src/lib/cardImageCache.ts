import imageMap from "@/data/image-map.json";
import TCGdex from "@tcgdex/sdk";
import { toRenderUrl } from "./imageUtils";

export { toRenderUrl };

type ImageMap = Record<string, string>;
const map = imageMap as ImageMap;

const tcgdex = new TCGdex("en");
tcgdex.setCacheTTL(3600);

const runtimeCache = new Map<string, string | null>();

const CARD_CACHE = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Internal set code → tcgdex set ID (same as build-image-map.ts)
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

interface CardResume {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

// Cache of cards per set from tcgdex
const setCardCache = new Map<string, CardResume[]>();

function parseSeries(series: string): {
  setCode: string;
  cardNumber: string;
} | null {
  let s = series.trim();
  if (!s) return null;
  // Fix malformed numbers: "TWM 15 1/167" → "TWM 151/167"
  s = s.replace(/(\d+)\s+(\d+)(\/\d+)/, "$1$2$3");
  // Fix: "JTG 152/1 59" → "JTG 152/159"
  s = s.replace(/(\d+)\/(\d+)\s+(\d+)/, (_, a, b, c) => `${a}/${b}${c}`);

  const match = s.match(/^(.+?)\s+(\d+)\/(\d+)$/i);
  if (match) {
    const code = match[1]
      .trim()
      .toUpperCase()
      .replace(/\s+(EN|GG|TG)$/i, "");
    return { setCode: code, cardNumber: match[2] };
  }

  // Format without total: "SVP 193"
  const noTotal = s.match(/^(.+?)\s+(\d+)$/i);
  if (noTotal) {
    const code = noTotal[1].trim().toUpperCase().replace(/\s+EN$/i, "");
    if (SET_MAP[code]) {
      return { setCode: code, cardNumber: noTotal[2] };
    }
  }

  return null;
}

/**
 * Look up image URL by product ID or composite key (code|type|series).
 */
export function getImageUrl(
  key: string,
  productName?: string
): string | undefined {
  const cached = map[key];
  if (cached) return cached;

  if (runtimeCache.has(key)) {
    return runtimeCache.get(key) || undefined;
  }

  return undefined;
}

/**
 * Async: look up image, falling back to tcgdex.dev SDK if not cached.
 * Uses set-based lookups (~150 cards) instead of tcgdex.card.list() (~23k cards).
 */
export async function resolveImageUrl(
  key: string,
  productName: string
): Promise<string | undefined> {
  // Check static map first
  const staticCached = map[key];
  if (staticCached) return staticCached;

  // Check enhanced cache with TTL
  const cachedEntry = CARD_CACHE.get(key);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
    return cachedEntry.url;
  }

  // Check runtime cache
  if (runtimeCache.has(key)) {
    return runtimeCache.get(key) || undefined;
  }

<<<<<<< HEAD
  // Search TCGdex by name — try original name, then with common replacements
  // TCGdex requires accented chars for matching (e.g. "Poké Pad" not "POKE PAD")
  const nameVariants = [
    productName,
    productName.replace(/POKE/gi, "Poké").replace(/POKEMON/gi, "Pokémon"),
    productName.replace(/POKE/gi, "Poke").replace(/POKEMON/gi, "Pokemon"),
    // Title case variant for better TCGdex matching
    productName.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase()),
    productName
      .replace(/POKE/gi, "Poké").replace(/POKEMON/gi, "Pokémon")
      .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase()),
  ];
  // Deduplicate
  const uniqueNames = [...new Set(nameVariants.filter((n) => n))];

  for (const searchName of uniqueNames) {
    try {
      const res = await fetch(
        `${TCGDEX_BASE}/cards?name=${encodeURIComponent(searchName)}&pagination:page=1&pagination:itemsPerPage=5`
      );
      if (!res.ok) continue;
      const cards = await res.json();
      if (!Array.isArray(cards)) continue;

      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normName = norm(productName);
      const match =
        cards.find((c: any) => c.image && norm(c.name || "") === normName) ||
        cards.find((c: any) => c.image && (norm(c.name || "").includes(normName) || normName.includes(norm(c.name || ""))));
      if (match) {
        const url = match.image.includes("/high.png")
          ? match.image
          : match.image + "/high.png";
        runtimeCache.set(key, url);
        return url;
=======
  // Try to extract composite key parts for direct URL construction
  const parts = key.split("|");
  if (parts.length >= 3) {
    const seriesPart = parts.slice(2).join("|");
    const parsed = parseSeries(seriesPart);
    if (parsed) {
      const setId = SET_MAP[parsed.setCode];
      if (setId) {
        try {
          const cards = await fetchSetCards(setId);
          const paddedNumber = parsed.cardNumber.padStart(
            Math.max(parsed.cardNumber.length, 3),
            "0"
          );
          const match = cards.find(
            (c) =>
              c.localId === parsed.cardNumber ||
              c.localId === paddedNumber ||
              namesMatch(c.name, productName)
          );
          if (match?.image) {
            const url = match.image;
            runtimeCache.set(key, url);
            CARD_CACHE.set(key, { url, timestamp: Date.now() });
            return url;
          }
        } catch {
          // Fallback below
        }
>>>>>>> 5e4ccf27b5855a23e39fb3ee2a9594d28b15d474
      }
    } catch {
      // TCGdex lookup failed
    }
  }

  // Final fallback: no match found
  runtimeCache.set(key, null);
  return undefined;
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

function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;

  const naNoHyphen = na.replace(/-/g, "");
  const nbNoHyphen = nb.replace(/-/g, "");
  if (naNoHyphen === nbNoHyphen) return true;
  if (na.length > 3 && nb.length > 3) {
    if (na.includes(nb) || nb.includes(na)) return true;
  }

  return false;
}

async function fetchSetCards(setId: string): Promise<CardResume[]> {
  if (setCardCache.has(setId)) return setCardCache.get(setId)!;

  try {
    const set = await tcgdex.set.get(setId);
    if (set?.cards) {
      setCardCache.set(setId, set.cards as CardResume[]);
      return set.cards as CardResume[];
    }
  } catch {
    // Silently fail
  }
  return [];
}

/**
 * Preload card image URLs for better performance
 */
export async function prefetchCardImage(
  key: string,
  productName: string
): Promise<void> {
  if (CARD_CACHE.has(key)) return;

  const url = await resolveImageUrl(key, productName);
  if (url) {
    const img = new Image();
    img.src = toRenderUrl(url);
  }
}

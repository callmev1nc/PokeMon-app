import fs from "fs";
import path from "path";

type ImageCache = Record<string, string | null>;

const CACHE_FILE = path.join(process.cwd(), "src", "data", "card-images.json");
const POKEMON_TCG_API = "https://api.pokemontcg.io/v2/cards";
const API_KEY = process.env.POKEMON_TCG_API_KEY || "";

let cache: ImageCache = {};
let loaded = false;
let resolving = false;

function loadCache(): void {
  if (loaded) return;
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    cache = JSON.parse(raw);
  } catch {
    cache = {};
  }
  loaded = true;
}

function saveCache(): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // read-only filesystem or permissions
  }
}

export function getCachedImageUrl(name: string): string | null | undefined {
  loadCache();
  return cache[name.toLowerCase().trim()];
}

export async function resolveImages(names: string[]): Promise<void> {
  if (resolving) return;
  loadCache();

  const uncached = names.filter((n) => {
    const key = n.toLowerCase().trim();
    return !(key in cache);
  });

  if (uncached.length === 0) return;
  resolving = true;

  // Fetch in batches of 20 names per API call
  for (let i = 0; i < uncached.length; i += 20) {
    const batch = uncached.slice(i, i + 20);
    const query = batch.map((n) => `name:"${n}"`).join(" OR ");

    try {
      const headers: Record<string, string> = {};
      if (API_KEY) headers["X-Api-Key"] = API_KEY;

      const res = await fetch(
        `${POKEMON_TCG_API}?q=${encodeURIComponent(query)}&pageSize=50`,
        { headers }
      );
      if (!res.ok) continue;

      const json = await res.json();
      for (const card of json.data || []) {
        const key = card.name.toLowerCase().trim();
        if (card.images?.small) {
          cache[key] = card.images.small;
        }
      }

      // Mark names with no result as null
      for (const name of batch) {
        const key = name.toLowerCase().trim();
        if (!(key in cache)) {
          cache[key] = null;
        }
      }

      saveCache();
    } catch {
      // Rate limited or network error — retry on next load
    }

    // Delay between batches to avoid rate limits
    if (i + 20 < uncached.length) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  resolving = false;
}

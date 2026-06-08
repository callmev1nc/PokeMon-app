import { NextRequest, NextResponse } from "next/server";
import { fetchProductsLive } from "@/lib/data";
import type { Product } from "@/lib/types";
import { getImageUrl, resolveImageUrl } from "@/lib/cardImageCache";
import { createRateLimiter } from "@/lib/rateLimit";
import * as fs from "fs";
import * as path from "path";

const rateLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });

// Load pokemon types from file - use code|type|series as key (like image map)
function getPokemonTypes(): Record<string, string> {
  try {
    const typesPath = path.join(process.cwd(), "src", "data", "pokemon-types.json");
    if (fs.existsSync(typesPath)) {
      const rawData = JSON.parse(fs.readFileSync(typesPath, "utf-8"));
      // Convert from id-based to composite-key-based
      const productsPath = path.join(process.cwd(), "src", "data", "products.json");
      if (fs.existsSync(productsPath)) {
        const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
        const typeMap: Record<string, string> = {};
        for (const p of products) {
          if (rawData[p.id]) {
            const compositeKey = `${p.code}|${p.type}|${p.series}`;
            typeMap[compositeKey] = rawData[p.id];
          }
        }
        return typeMap;
      }
      return rawData;
    }
  } catch (e) {
    console.warn("Failed to load pokemon-types.json:", e);
  }
  return {};
}

export const revalidate = 120;

let cachedResponse: { data: Product[]; timestamp: number } | null = null;
const CACHE_TTL = 120_000;

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed, remaining } = rateLimiter(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedResponse.data, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  }

  try {
    const products = await fetchProductsLive();
    if (!products || products.length === 0) {
      console.error("fetchProductsLive returned empty.");
    }

    // Load pokemon types
    const pokemonTypes = getPokemonTypes();

    // First pass: assign cached images and pokemon types
    const withId = products.map((p, i) => {
      const id = p.id || `${p.code}-${p.type}-${i}`;
      const compositeKey = `${p.code}|${p.type}|${p.series}`;
      return {
        ...p,
        id,
        type: pokemonTypes[compositeKey] || p.type, // Use pokemon type from file, fallback to existing type
        imageUrl: getImageUrl(id) || getImageUrl(compositeKey) || undefined,
      };
    });

    // Second pass: resolve missing images via tcgdex.dev SDK (set-based lookup)
    const missing = withId.filter((p) => !p.imageUrl);
    if (missing.length > 0) {
      // Resolve all at once without delays - pokemontcg.io is fast
      await Promise.all(
        missing.map(async (p) => {
          const compositeKey = `${p.code}|${p.type}|${p.series}`;
          p.imageUrl = await resolveImageUrl(compositeKey, p.name);
        })
      );
    }

    cachedResponse = { data: withId, timestamp: Date.now() };

    // Stock health diagnostic: warn if all products have 0 stock
    const inStockCount = withId.filter((p) => p.stock > 0).length;
    if (inStockCount === 0 && withId.length > 10) {
      console.error(
        `[STOCK HEALTH] All ${withId.length} products have 0 stock — possible data source issue. ` +
        `Check Google Sheets TỒN column formulas.`
      );
    }

    return NextResponse.json(withId, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

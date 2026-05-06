import { NextRequest, NextResponse } from "next/server";
import { fetchProductsLive } from "@/lib/data";
import type { Product } from "@/lib/types";
import { getImageUrl, resolveImageUrl } from "@/lib/cardImageCache";
import { createRateLimiter } from "@/lib/rateLimit";

const rateLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });

export const revalidate = 30;

let cachedResponse: { data: Product[]; timestamp: number } | null = null;
const CACHE_TTL = 30_000;

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
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  }

  try {
    const products = await fetchProductsLive();
    if (!products || products.length === 0) {
      console.error("fetchProductsLive returned empty.");
    }

    // First pass: assign cached images
    const withId = products.map((p, i) => {
      const id = p.id || `${p.code}-${p.type}-${i}`;
      const compositeKey = `${p.code}|${p.type}|${p.series}`;
      return {
        ...p,
        id,
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

    return NextResponse.json(withId, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { fetchProductsLive } from "@/lib/data";
import { getImageUrl, resolveImageUrl } from "@/lib/cardImageCache";

export const dynamic = "force-dynamic";
export const revalidate = 60;

let cachedResponse: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 30_000;

export async function GET() {
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedResponse.data);
  }

  try {
    const products = await fetchProductsLive();
    if (!products || products.length === 0) {
      console.error("fetchProductsLive returned empty. STOCK_URL:", process.env.GOOGLE_STOCK_URL ? "SET" : "MISSING");
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
    return NextResponse.json(withId);
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json({ error: "Failed to fetch products", stockUrl: process.env.GOOGLE_STOCK_URL ? "SET" : "MISSING" }, { status: 500 });
  }
}

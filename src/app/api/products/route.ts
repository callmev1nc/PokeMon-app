import { NextResponse } from "next/server";
import { fetchProductsLive } from "@/lib/data";
import { resolveImages, getCachedImageUrl } from "@/lib/cardImageCache";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 60 seconds

let cachedResponse: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 30_000; // 30 seconds in-memory cache

export async function GET() {
  // Return cached response if fresh
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedResponse.data);
  }

  try {
    const products = await fetchProductsLive();
    if (!products || products.length === 0) {
      console.error("fetchProductsLive returned empty. STOCK_URL:", process.env.GOOGLE_STOCK_URL ? "SET" : "MISSING");
    }

    // Resolve missing card images in background (non-blocking)
    const uniqueNames = [...new Set(products.map((p) => p.name))];
    resolveImages(uniqueNames).catch(() => {});

    const withId = products.map((p, i) => ({
      ...p,
      id: p.id || `${p.code}-${p.type}-${i}`,
      imageUrl: getCachedImageUrl(p.name) || undefined,
    }));

    cachedResponse = { data: withId, timestamp: Date.now() };
    return NextResponse.json(withId);
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json({ error: "Failed to fetch products", stockUrl: process.env.GOOGLE_STOCK_URL ? "SET" : "MISSING" }, { status: 500 });
  }
}

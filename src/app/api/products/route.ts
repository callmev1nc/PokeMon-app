import { NextResponse } from "next/server";
import { fetchProductsLive } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const products = await fetchProductsLive();
    if (!products || products.length === 0) {
      console.error("fetchProductsLive returned empty. STOCK_URL:", process.env.GOOGLE_STOCK_URL ? "SET" : "MISSING");
    }
    const withId = products.map((p, i) => ({
      ...p,
      id: p.id || `${p.code}-${p.type}-${i}`,
    }));
    return NextResponse.json(withId);
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json({ error: "Failed to fetch products", stockUrl: process.env.GOOGLE_STOCK_URL ? "SET" : "MISSING" }, { status: 500 });
  }
}

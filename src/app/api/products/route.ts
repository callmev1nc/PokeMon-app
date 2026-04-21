import { NextResponse } from "next/server";
import { fetchProductsLive } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await fetchProductsLive();
    const withId = products.map((p, i) => ({
      ...p,
      id: p.id || `${p.code}-${p.type}-${i}`,
    }));
    return NextResponse.json(withId);
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json([], { status: 500 });
  }
}

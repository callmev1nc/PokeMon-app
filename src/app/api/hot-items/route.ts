import { NextResponse } from "next/server";
import { fetchProductsLive, fetchOrdersLive } from "@/lib/data";
import { getImageUrl, resolveImageUrl } from "@/lib/cardImageCache";
import { getHotProducts } from "@/lib/salesAnalytics";

export const revalidate = 300; // 5-minute cache

export async function GET() {
  try {
    const [products, orders] = await Promise.all([
      fetchProductsLive(),
      fetchOrdersLive(),
    ]);

    const hotProducts = getHotProducts(products, orders, 8);

    // Attach images to hot products
    const withImages = hotProducts.map((p, i) => {
      const id = p.id || `${p.code}-${p.type}-${i}`;
      return {
        ...p,
        id,
        imageUrl: getImageUrl(id) || getImageUrl(`${p.code}|${p.type}|${p.series}`) || undefined,
      };
    });

    return NextResponse.json(withImages, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch hot items" },
      { status: 500 }
    );
  }
}

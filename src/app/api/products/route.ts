import { NextResponse } from "next/server";
import { fetchProductsLive } from "@/lib/data";

export async function GET() {
  const products = await fetchProductsLive();
  return NextResponse.json(products);
}

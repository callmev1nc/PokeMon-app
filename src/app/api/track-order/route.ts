import { NextRequest, NextResponse } from "next/server";
import { fetchOrdersLive } from "@/lib/data";

export const dynamic = "force-dynamic";

// Simple rate limiter for order tracking
const trackAttempts = new Map<string, { count: number; lastAttempt: number }>();
const TRACK_MAX = 15;
const TRACK_WINDOW = 60_000;

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const record = trackAttempts.get(ip);
  if (record) {
    if (now - record.lastAttempt > TRACK_WINDOW) record.count = 0;
    if (record.count >= TRACK_MAX) {
      return NextResponse.json({ error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." }, { status: 429 });
    }
    record.count++;
    record.lastAttempt = now;
  } else {
    trackAttempts.set(ip, { count: 1, lastAttempt: now });
  }
  if (trackAttempts.size > 500) {
    for (const [key, val] of trackAttempts) {
      if (now - val.lastAttempt > TRACK_WINDOW) trackAttempts.delete(key);
    }
  }
  const phone = req.nextUrl.searchParams.get("phone")?.trim();
  const orderCode = req.nextUrl.searchParams.get("orderCode")?.trim();

  if (!phone && !orderCode) {
    return NextResponse.json(
      { error: "Vui lòng nhập số điện thoại hoặc mã đơn hàng" },
      { status: 400 }
    );
  }

  try {
    const orders = await fetchOrdersLive();

    let matched = orders;
    if (orderCode) {
      matched = orders.filter(
        (o) => o.orderCode?.toLowerCase() === orderCode.toLowerCase()
      );
    } else if (phone) {
      matched = orders.filter((o) => o.phone === phone);
    }

    const safe = matched.map((o) => ({
      orderCode: o.orderCode,
      orderDate: o.orderDate,
      customerName: o.customerName,
      products: o.products,
      sellPrice: o.sellPrice,
      shippingCost: o.shippingCost,
      paymentStatus: o.paymentStatus,
      deliveryStatus: o.deliveryStatus || "Chưa giao",
    }));

    return NextResponse.json(safe);
  } catch {
    return NextResponse.json(
      { error: "Không thể tải đơn hàng" },
      { status: 500 }
    );
  }
}

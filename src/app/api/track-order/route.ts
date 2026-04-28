import { NextRequest, NextResponse } from "next/server";
import { fetchOrdersLive } from "@/lib/data";
import { trackOrderSchema } from "@/lib/schemas";
import { createRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const rateLimiter = createRateLimiter({ maxRequests: 15, windowMs: 60_000 });

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed, remaining } = rateLimiter(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
      { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" } }
    );
  }

  const phone = req.nextUrl.searchParams.get("phone")?.trim() || undefined;
  const orderCode = req.nextUrl.searchParams.get("orderCode")?.trim() || undefined;

  const parsed = trackOrderSchema.safeParse({ phone, orderCode });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Vui lòng nhập số điện thoại hoặc mã đơn hàng", details: parsed.error.issues.map((e) => e.message) },
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

    return NextResponse.json(safe, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch {
    return NextResponse.json(
      { error: "Không thể tải đơn hàng" },
      { status: 500 }
    );
  }
}

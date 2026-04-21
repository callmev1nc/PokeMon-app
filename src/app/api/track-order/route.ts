import { NextRequest, NextResponse } from "next/server";
import { fetchOrdersLive } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

import { NextRequest, NextResponse } from "next/server";
import {
  fetchProducts,
  fetchOrders,
  fetchCustomers,
  addOrder,
  updateOrder,
  updateProducts,
  addCustomer,
  updateCustomer,
} from "@/lib/data";

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  try {
    switch (action) {
      case "products":
        return NextResponse.json(fetchProducts());
      case "orders":
        return NextResponse.json(fetchOrders());
      case "customers":
        return NextResponse.json(fetchCustomers());
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const action = body.action;

  try {
    switch (action) {
      case "addOrder":
        return NextResponse.json(addOrder(body.order));
      case "updateOrder":
        return NextResponse.json(updateOrder(body.row, body.data));
      case "updateProducts":
        return NextResponse.json(updateProducts(body.products));
      case "addCustomer":
        return NextResponse.json(addCustomer(body.customer));
      case "updateCustomer":
        return NextResponse.json(updateCustomer(body.row, body.data));
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  fetchProducts,
  fetchProductsLive,
  fetchOrders,
  fetchOrdersLive,
  fetchCustomers,
  fetchCustomersLive,
  addOrder,
  updateOrder,
  updateProducts,
  addCustomer,
  updateCustomer,
  addProductLocal,
} from "@/lib/data";
import { verifySession, COOKIE_NAME } from "@/lib/auth-edge";

// Check admin session cookie
async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySession(token);
}

// Sanitize string input - strip HTML/scripts
function sanitize(str: string): string {
  return str
    .replace(/</g, "")
    .replace(/>/g, "")
    .replace(/"/g, "")
    .replace(/'/g, "")
    .trim()
    .slice(0, 1000);
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  // Public: products list
  if (action === "products") {
    try {
      const products = await fetchProductsLive();
      return NextResponse.json(products);
    } catch {
      return NextResponse.json(
        { error: "Failed to load products" },
        { status: 500 }
      );
    }
  }

  // Admin-only: orders and customers
  if (action === "orders" || action === "customers") {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      switch (action) {
        case "orders": {
          const orders = await fetchOrdersLive();
          return NextResponse.json(orders);
        }
        case "customers": {
          const customers = await fetchCustomersLive();
          return NextResponse.json(customers);
        }
        default:
          return NextResponse.json({ error: "Bad request" }, { status: 400 });
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to load data" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const action = body.action;

  // Public: submit order + customer info
  if (action === "addOrder") {
    const order = body.order as Record<string, unknown> | undefined;
    if (!order || typeof order !== "object") {
      return NextResponse.json(
        { error: "Invalid order data" },
        { status: 400 }
      );
    }
    try {
      const sanitized = {
        timestamp: String(order.timestamp || new Date().toISOString()),
        orderDate: String(order.orderDate || ""),
        orderCode: sanitize(String(order.orderCode || "")),
        products: sanitize(String(order.products || "")).slice(0, 5000),
        customerName: sanitize(String(order.customerName || "")),
        phone: sanitize(String(order.phone || "")),
        address: sanitize(String(order.address || "")),
        notes: sanitize(String(order.notes || "")),
        sellPrice: Number(order.sellPrice) || 0,
        buyPrice: Number(order.buyPrice) || 0,
        shippingCost: 0,
        profit: 0,
        paymentStatus: "Chưa thanh toán" as const,
      };
      return NextResponse.json(addOrder(sanitized));
    } catch {
      return NextResponse.json(
        { error: "Failed to submit order" },
        { status: 500 }
      );
    }
  }

  if (action === "addCustomer") {
    const customer = body.customer as Record<string, unknown> | undefined;
    if (!customer || typeof customer !== "object") {
      return NextResponse.json(
        { error: "Invalid customer data" },
        { status: 400 }
      );
    }
    try {
      const sanitized = {
        name: sanitize(String(customer.name || "")),
        phone: sanitize(String(customer.phone || "")),
        newAddress: sanitize(String(customer.newAddress || "")),
        oldAddress: sanitize(String(customer.oldAddress || "")),
      };
      return NextResponse.json(addCustomer(sanitized));
    } catch {
      return NextResponse.json(
        { error: "Failed to save customer" },
        { status: 500 }
      );
    }
  }

  // Admin-only: update operations
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    switch (action) {
      case "addProduct": {
        const product = body.product as Record<string, unknown> | undefined;
        if (!product || typeof product !== "object") {
          return NextResponse.json(
            { error: "Invalid product data" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          addProductLocal({
            code: sanitize(String(product.code || "")),
            group: sanitize(String(product.group || "")),
            name: sanitize(String(product.name || "")),
            series: sanitize(String(product.series || "")),
            type: sanitize(String(product.type || "")),
            price: product.price !== null && product.price !== undefined ? Number(product.price) : null,
            buyPrice: null,
            stock: Number(product.stock) || 0,
          })
        );
      }
      case "updateOrder": {
        const row = Number(body.row);
        const data = body.data as Record<string, unknown> | undefined;
        if (isNaN(row) || !data) {
          return NextResponse.json(
            { error: "Invalid data" },
            { status: 400 }
          );
        }
        return NextResponse.json(updateOrder(row, data));
      }
      case "updateProducts": {
        const products = body.products as unknown[];
        if (!Array.isArray(products)) {
          return NextResponse.json(
            { error: "Invalid data" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          updateProducts(products as Record<string, unknown>[])
        );
      }
      case "updateCustomer": {
        const row = Number(body.row);
        const data = body.data as Record<string, unknown> | undefined;
        if (isNaN(row) || !data) {
          return NextResponse.json(
            { error: "Invalid data" },
            { status: 400 }
          );
        }
        return NextResponse.json(updateCustomer(row, data));
      }
      default:
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to process" },
      { status: 500 }
    );
  }
}

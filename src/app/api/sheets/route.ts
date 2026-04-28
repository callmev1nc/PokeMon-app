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
  confirmOrder,
  deleteOrder,
  editOrderProducts,
  updateProducts,
  addCustomer,
  updateCustomer,
  addProductLocal,
} from "@/lib/data";
import { verifySession, COOKIE_NAME } from "@/lib/auth-edge";
import { logAction, getAuditLog } from "@/lib/auditLog";
import { getSessionRole } from "@/lib/auth";

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
    .replace(/`/g, "")
    .replace(/\0/g, "")
    .trim()
    .slice(0, 1000);
}

// Simple in-memory rate limiter for public endpoints
const publicRateLimits = new Map<string, { count: number; lastAttempt: number }>();
const PUBLIC_MAX_REQUESTS = 10;
const PUBLIC_WINDOW_MS = 60 * 1000;

function checkPublicRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = publicRateLimits.get(ip);
  if (record) {
    if (now - record.lastAttempt > PUBLIC_WINDOW_MS) record.count = 0;
    if (record.count >= PUBLIC_MAX_REQUESTS) return false;
    record.count++;
    record.lastAttempt = now;
  } else {
    publicRateLimits.set(ip, { count: 1, lastAttempt: now });
  }
  // Periodic cleanup
  if (publicRateLimits.size > 500) {
    for (const [key, val] of publicRateLimits) {
      if (now - val.lastAttempt > PUBLIC_WINDOW_MS) publicRateLimits.delete(key);
    }
  }
  return true;
}

// Validate origin for admin POST requests (CSRF protection)
function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Whitelist allowed fields for order/customer updates
const ORDER_UPDATABLE_FIELDS = ["paymentStatus", "deliveryStatus", "shippingCost", "buyPrice", "notes", "orderCode", "products", "sellPrice"];
const CUSTOMER_UPDATABLE_FIELDS = ["name", "phone", "newAddress", "oldAddress"];

function filterFields(data: Record<string, unknown>, allowed: string[]): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => allowed.includes(key))
  );
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

  // Admin-only: orders, customers, and audit log
  if (action === "orders" || action === "customers" || action === "audit-log") {
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
        case "audit-log": {
          const limit = Number(req.nextUrl.searchParams.get("limit")) || 100;
          return NextResponse.json(getAuditLog(limit));
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
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkPublicRateLimit(ip)) {
      return NextResponse.json({ error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." }, { status: 429 });
    }

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
        oldAddress: sanitize(String(order.oldAddress || "")),
        notes: sanitize(String(order.notes || "")),
        sellPrice: Number(order.sellPrice) || 0,
        buyPrice: Number(order.buyPrice) || 0,
        shippingCost: 0,
        profit: 0,
        paymentStatus: "Chưa thanh toán" as const,
      };
      logAction("addOrder", "customer", `Order ${sanitized.orderCode} from ${sanitized.customerName}`);
      return NextResponse.json(addOrder(sanitized));
    } catch {
      return NextResponse.json(
        { error: "Failed to submit order" },
        { status: 500 }
      );
    }
  }

  if (action === "addCustomer") {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkPublicRateLimit(ip)) {
      return NextResponse.json({ error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." }, { status: 429 });
    }

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

  // CSRF: validate origin on admin POST requests
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
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
        logAction("addProduct", "admin", `${product.name} (${product.code})`);
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
      case "confirmOrder": {
        const row = Number(body.row);
        const data = body.data as Record<string, unknown> | undefined;
        const orderRow = body.orderRow ? Number(body.orderRow) : undefined;
        const products = body.products as string | undefined;
        if (isNaN(row) || !data) {
          return NextResponse.json(
            { error: "Invalid data" },
            { status: 400 }
          );
        }
        logAction("confirmOrder", "admin", `Row ${row}: ${JSON.stringify(data)}`);
        return NextResponse.json(confirmOrder(row, data, products, orderRow));
      }
      case "deleteOrder": {
        const row = Number(body.row);
        logAction("deleteOrder", "admin", `Row ${row}`);
        const orderData = body.orderData as Record<string, unknown> | undefined;
        if (!isNaN(row) && orderData) {
          return NextResponse.json(deleteOrder({ _row: row, products: String(orderData.products || "") }));
        }
        if (!isNaN(row)) {
          return NextResponse.json(deleteOrder(row));
        }
        return NextResponse.json(
          { error: "Invalid data" },
          { status: 400 }
        );
      }
      case "deleteOrders": {
        const items = body.items as { row: number; products: string }[];
        if (!Array.isArray(items) || items.length === 0) {
          return NextResponse.json(
            { error: "Invalid data" },
            { status: 400 }
          );
        }
        let deleted = 0;
        for (const item of items) {
          const result = deleteOrder({ _row: item.row, products: item.products });
          if (result.success) deleted++;
        }
        return NextResponse.json({ success: true, deleted });
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
        return NextResponse.json(updateOrder(row, filterFields(data, ORDER_UPDATABLE_FIELDS)));
      }
      case "editOrderProducts": {
        const row = Number(body.row);
        const newProducts = sanitize(String(body.newProducts || "")).slice(0, 5000);
        const removedItems = sanitize(String(body.removedItems || "")).slice(0, 5000);
        const addedItems = sanitize(String(body.addedItems || "")).slice(0, 5000);
        const isPaid = Boolean(body.isPaid);
        if (isNaN(row)) {
          return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }
        logAction("editOrderProducts", "admin", `Row ${row}: products updated`);
        return NextResponse.json(editOrderProducts(row, newProducts, removedItems, addedItems, isPaid));
      }
      case "updateProducts": {
        const products = body.products as unknown[];
        if (!Array.isArray(products)) {
          return NextResponse.json(
            { error: "Invalid data" },
            { status: 400 }
          );
        }
        logAction("updateProducts", "admin", `${products.length} products updated`);
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
        return NextResponse.json(updateCustomer(row, filterFields(data, CUSTOMER_UPDATABLE_FIELDS)));
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

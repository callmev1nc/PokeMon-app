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
  postSheet,
  adjustInventory,
} from "@/lib/data";
import { verifySession, COOKIE_NAME } from "@/lib/auth-edge";
import { logAction, getAuditLog } from "@/lib/auditLog";
import { getSessionRole } from "@/lib/auth";
import { orderSchema, customerSchema } from "@/lib/schemas";
import { createRateLimiter } from "@/lib/rateLimit";

const BUSINESS_URL = process.env.GOOGLE_BUSINESS_URL || "";

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
const publicRateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

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
const CUSTOMER_UPDATABLE_FIELDS = ["name", "phone", "newAddress", "oldAddress", "notes"];

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
    if (!publicRateLimiter(ip).allowed) {
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
        orderCode: sanitize(String(order.orderCode || "")) || `DH${Date.now()}`,
        products: sanitize(String(order.products || "")).slice(0, 5000),
        customerName: sanitize(String(order.customerName || "")),
        phone: sanitize(String(order.phone || "")),
        address: sanitize(String(order.address || "")),
        oldAddress: sanitize(String(order.oldAddress || "")),
        notes: sanitize(String(order.notes || "")),
        sellPrice: Number(order.sellPrice) || 0,
        buyPrice: Number(order.buyPrice) || 0,
        shippingCost: Number(order.shippingCost) || 0,
        profit: 0,
        paymentStatus: "Chưa thanh toán" as const,
      };
      orderSchema.parse(sanitized);
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
    if (!publicRateLimiter(ip).allowed) {
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
        notes: sanitize(String(customer.notes || "")),
      };
      customerSchema.parse(sanitized);
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
        const orderCode = body.orderCode as string | undefined;
        return NextResponse.json(confirmOrder(row, data, products, orderRow, orderCode));
      }
      case "deleteOrder": {
        const row = Number(body.row);
        logAction("deleteOrder", "admin", `Row ${row}`);
        const orderData = body.orderData as Record<string, unknown> | undefined;

        // Adjust inventory from the order data
        if (orderData?.products) {
          adjustInventory(String(orderData.products), 1);
        }

        // Send delete to Google Sheets and await result
        if (BUSINESS_URL && !isNaN(row)) {
          const sheetResult = await postSheet(BUSINESS_URL, { action: "deleteOrder", row });
          if (sheetResult === null) {
            // Sheets deletion failed, still try local
            console.error("Failed to delete order from Google Sheets, row:", row);
          }
        }

        // Also remove from local data
        if (!isNaN(row) && orderData) {
          deleteOrder({ _row: row, products: String(orderData.products || "") });
        } else if (!isNaN(row)) {
          deleteOrder(row);
        }

        return NextResponse.json({ success: true });
      }
      case "deleteOrders": {
        const rawItems = body.items as { row: number; products: string }[];
        if (!Array.isArray(rawItems) || rawItems.length === 0) {
          return NextResponse.json(
            { error: "Invalid data" },
            { status: 400 }
          );
        }
        // Sort by row descending so higher rows are deleted first
        const items = [...rawItems].sort((a, b) => b.row - a.row);
        let deleted = 0;
        
        // Process deletions concurrently for better performance
        const results = await Promise.all(
          items.map(async (item) => {
            try {
              // Adjust inventory
              if (item.products) adjustInventory(item.products, 1);
              
              // Delete from Google Sheets
              if (BUSINESS_URL) {
                await postSheet(BUSINESS_URL, { action: "deleteOrder", row: item.row });
              }
              
              // Delete from local data
              const result = deleteOrder({ _row: item.row, products: item.products });
              return result.success;
            } catch {
              return false;
            }
          })
        );
        
        deleted = results.filter(Boolean).length;
        return NextResponse.json({ success: true, deleted });
      }
      case "updateOrder": {
        const row = Number(body.row);
        const sheetRow = body.sheetRow ? Number(body.sheetRow) : undefined;
        const data = body.data as Record<string, unknown> | undefined;
        if (isNaN(row) || !data) {
          return NextResponse.json(
            { error: "Invalid data" },
            { status: 400 }
          );
        }
        const orderCode = body.orderCode as string | undefined;
        const filtered = filterFields(data, ORDER_UPDATABLE_FIELDS);
        const result = updateOrder(row, filtered, orderCode);

        // If sheetRow is provided, also push directly with the correct row
        if (sheetRow && BUSINESS_URL) {
          postSheet(BUSINESS_URL, {
            action: "updateOrder",
            row: sheetRow,
            data: filtered,
          }).catch((e) => { console.error("Failed to sync order update to Sheets:", orderCode, e); });
        }

        return NextResponse.json(result);
      }
      case "editOrderProducts": {
        const row = Number(body.row);
        const sheetRow = body.sheetRow ? Number(body.sheetRow) : undefined;
        const newProducts = sanitize(String(body.newProducts || "")).slice(0, 5000);
        const removedItems = sanitize(String(body.removedItems || "")).slice(0, 5000);
        const addedItems = sanitize(String(body.addedItems || "")).slice(0, 5000);
        const isPaid = Boolean(body.isPaid);
        if (isNaN(row)) {
          return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }
        logAction("editOrderProducts", "admin", `Row ${row}: products updated`);
        const orderCode = body.orderCode as string | undefined;
        const localResult = editOrderProducts(row, newProducts, removedItems, addedItems, isPaid, orderCode);

        // Push to Google Sheets with correct row
        if (sheetRow && BUSINESS_URL) {
          const allProducts = await fetchProductsLive();
          const pMap = new Map(allProducts.map((p) => [p.code, p]));
          const newTotal = (newProducts || "").split(", ").reduce((sum, item) => {
            const match = item.match(/^(\d+)x\s+(.+?)\s+-\s+([^\s|]+)(?:\|([\d.]+))?$/);
            if (!match) return sum;
            const qty = parseInt(match[1]);
            const code = match[3];
            const storedPrice = match[4] !== undefined ? parseFloat(match[4]) : null;
            if (storedPrice !== null) return sum + storedPrice * qty * 1000;
            const prod = pMap.get(code);
            if (!prod || prod.price === null) return sum;
            return sum + prod.price * qty * 1000;
          }, 0);
          const sheetResult = await postSheet(BUSINESS_URL, {
            action: "updateOrder",
            row: sheetRow,
            data: { products: newProducts, sellPrice: newTotal },
          });
          if (sheetResult !== null) {
            return NextResponse.json({ success: true });
          }
        }

        return NextResponse.json(localResult);
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
      case "nhapKho": {
        const code = String(body.code || "").trim();
        const quantity = Number(body.quantity);
        const series = body.series ? String(body.series).trim() : undefined;
        const type = body.type ? String(body.type).trim() : undefined;
        if (!code || !quantity || quantity <= 0) {
          return NextResponse.json({ error: "Invalid code or quantity" }, { status: 400 });
        }
        const STOCK_URL = process.env.GOOGLE_STOCK_URL || "";
        if (!STOCK_URL) {
          return NextResponse.json({ error: "Stock sheet not configured" }, { status: 500 });
        }
        logAction("nhapKho", "admin", `${code}${series ? ` (${series}/${type})` : ""}: +${quantity}`);
        const result = await postSheet(STOCK_URL, { action: "nhapKho", code, quantity, series, type });
        return NextResponse.json(result || { error: "Failed to update" });
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

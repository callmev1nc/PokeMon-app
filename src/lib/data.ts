import fs from "fs";
import path from "path";
import type { Product, Order, Customer } from "./types";

const dataDir = path.join(process.cwd(), "src", "data");

// Google Sheets URLs (set via env vars)
const STOCK_URL = process.env.GOOGLE_STOCK_URL || "";
const BUSINESS_URL = process.env.GOOGLE_BUSINESS_URL || "";

// In-memory stores (fallback for local dev)
let productsCache: Product[] | null = null;
const ordersStore: Order[] = [];
const customersStore: Customer[] = [];

const isDev = process.env.NODE_ENV !== "production";

function readJson<T>(filename: string): T[] {
  try {
    const filePath = path.join(dataDir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeJson<T>(filename: string, data: T[]): void {
  if (!isDev) return;
  try {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Silently fail on read-only filesystem
  }
}

// Google Apps Script "Anyone" deployments use a redirect chain.
// GET works with redirect: "follow", but POST body is lost on redirect.
// Solution: send write data as a GET request with the payload URL-encoded.
async function fetchSheet<T>(url: string): Promise<T | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function postSheet<T>(baseUrl: string, payload: Record<string, unknown>): Promise<T | null> {
  if (!baseUrl) return null;
  try {
    // Google Apps Script: POST body is lost on 302 redirect.
    // Encode the entire payload as a GET query parameter instead.
    const json = JSON.stringify(payload);
    const url = `${baseUrl}?payload=${encodeURIComponent(json)}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// === Products ===
export function fetchProducts(): Product[] {
  if (!productsCache) {
    productsCache = readJson<Product>("products.json");
  }
  return productsCache;
}

/**
 * Adjust inventory based on order products string.
 * delta: -1 to reduce stock (confirm), +1 to restore stock (cancel/delete)
 */
export function adjustInventory(orderProducts: string, delta: number): void {
  if (!orderProducts) return;
  const products = fetchProducts();

  const items = orderProducts.split(", ");
  for (const item of items) {
    const match = item.match(/^(\d+)x\s+(.+?)\s+-\s+([^\s|]+)(?:\|([\d.]+))?$/);
    if (!match) continue;
    const quantity = parseInt(match[1]) * delta;
    const code = match[3];

    const product = products.find((p) => p.code === code);
    if (product) {
      product.stock = Math.max(0, product.stock + quantity);
    }
  }

  productsCache = products;
  writeJson("products.json", products);

  // Push stock changes to Google Sheets using updateStock for each product.
  // updateStock handles both XUẤT (col I) and TỒN (col K) correctly.
  if (STOCK_URL) {
    for (const item of items) {
      const match = item.match(/^(\d+)x\s+(.+?)\s+-\s+([^\s|]+)(?:\|([\d.]+))?$/);
      if (!match) continue;
      const qty = parseInt(match[1]);
      const code = match[3];
      const product = products.find((p) => p.code === code);
      if (product) {
        // updateStock: quantity is subtracted from TỒN, added to XUẤT
        // For confirm (delta=-1): send +qty to reduce stock, increase xuất
        // For cancel (delta=+1): send -qty to restore stock, decrease xuất
        postSheet(STOCK_URL, {
          action: "updateStock",
          code: product.code,
          type: product.type,
          quantity: -delta * qty,
        }).catch(() => {});
      }
    }
  }
}

export async function fetchProductsLive(): Promise<Product[]> {
  if (STOCK_URL) {
    const data = await fetchSheet<Product[]>(`${STOCK_URL}?action=products`);
    if (data && Array.isArray(data) && data.length > 0) return data;
  }
  return fetchProducts();
}

export function updateProducts(
  updates: Partial<Product>[]
): { success: boolean; updated: number } {
  const products = fetchProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  let updated = 0;
  for (const u of updates) {
    const id = u.id;
    if (!id || !productMap.has(id)) continue;
    const existing = productMap.get(id)!;
    if (u.price !== undefined) existing.price = u.price;
    if (u.stock !== undefined) existing.stock = u.stock;
    if (u.buyPrice !== undefined) existing.buyPrice = u.buyPrice;
    updated++;
  }

  productsCache = products;
  writeJson("products.json", products);

  // Push product updates to Google Sheets
  if (STOCK_URL) {
    const sheetUpdates = updates
      .filter((u) => u.id && productMap.has(u.id))
      .map((u) => {
        const p = productMap.get(u.id!)!;
        return { _row: p._row, code: p.code, series: p.series, type: p.type, price: p.price, stock: p.stock };
      });
    if (sheetUpdates.length > 0) {
      postSheet(STOCK_URL, { action: "updateProducts", products: sheetUpdates }).catch(() => {});
    }
  }

  return { success: true, updated };
}

export function addProductLocal(
  product: Omit<Product, "id" | "displayType">
): { success: boolean } {
  const products = fetchProducts();
  const id = `${product.code}-${product.type}-${Date.now()}`;
  const displayType = mapDisplayType(product.type || "");
  products.push({
    id,
    displayType,
    ...product,
  } as Product);
  productsCache = products;
  writeJson("products.json", products);

  // Push new product to Google Sheets
  if (STOCK_URL) {
    postSheet(STOCK_URL, { action: "addProduct", product }).catch(() => {});
  }
  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, { action: "addProduct", product }).catch(() => {});
  }

  return { success: true };
}

function mapDisplayType(
  rawType: string
): "Normal" | "Holo" | "Prize Card" | "EX" | "Holo Prize Card" | "EX Prize Card" {
  const t = rawType.toLowerCase().trim();
  if (t === "holo prize card") return "Holo Prize Card";
  if (t === "ex prize card") return "EX Prize Card";
  if (t === "holo") return "Holo";
  if (t.includes("ex")) return "EX";
  if (t.includes("prize")) return "Prize Card";
  return "Normal";
}

// === Orders ===
export function fetchOrders(): Order[] {
  if (ordersStore.length === 0) {
    const fileOrders = readJson<Order>("orders.json");
    ordersStore.push(...fileOrders);
  }
  return ordersStore;
}

export async function fetchOrdersLive(): Promise<Order[]> {
  if (BUSINESS_URL) {
    const data = await fetchSheet<{ error?: string; data?: Order[]; [key: number]: Order }>(
      `${BUSINESS_URL}?action=orders`
    );
    if (data && Array.isArray(data)) return data;
  }
  return fetchOrders();
}

export function addOrder(order: Omit<Order, "_row">): { success: boolean } {
  const orders = fetchOrders();
  orders.push({ ...order, _row: orders.length + 1 } as Order);
  writeJson("orders.json", orders);

  // Also push to Google Sheets in background
  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, { action: "addOrder", order }).catch(() => {});
  }

  return { success: true };
}

export function updateOrder(
  index: number,
  data: Partial<Order>,
  sheetRow?: number,
): { success: boolean } {
  const orders = fetchOrders();
  let idx = index;
  if (sheetRow) {
    const found = orders.findIndex(o => o._row === sheetRow);
    if (found !== -1) idx = found;
  }
  if (idx < 0 || idx >= orders.length) return { success: false };
  orders[idx] = { ...orders[idx], ...data };
  writeJson("orders.json", orders);

  // Also push to Google Sheets in background
  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, {
      action: "updateOrder",
      row: orders[idx]._row || idx + 2,
      data,
    }).catch(() => {});
  }

  return { success: true };
}

/**
 * Confirm order: adjust inventory when payment status changes.
 * Reduces stock when confirming to paid, restores when canceling to unpaid.
 */
export function confirmOrder(
  index: number,
  data: Partial<Order>,
  orderProducts?: string,
  orderRow?: number,
): { success: boolean } {
  const orders = fetchOrders();
  let idx = index;
  if (orderRow) {
    const found = orders.findIndex(o => o._row === orderRow);
    if (found !== -1) idx = found;
  }
  const order = (idx >= 0 && idx < orders.length) ? orders[idx] : null;

  // Use provided products string or fall back to local order's products
  const productsStr = orderProducts || (order?.products ?? "");

  if (data.paymentStatus === "Đã thanh toán") {
    adjustInventory(productsStr, -1);
  } else if (data.paymentStatus === "Chưa thanh toán") {
    adjustInventory(productsStr, 1);
  }

  // Update local store if possible
  if (order) {
    orders[idx] = { ...order, ...data };
    writeJson("orders.json", orders);
  }

  // Push to Google Sheets
  if (BUSINESS_URL) {
    const row = orderRow || order?._row || index + 2;
    postSheet(BUSINESS_URL, {
      action: "confirmOrder",
      row,
      data,
    }).catch(() => {});
  }

  return { success: true };
}

/**
 * Delete order by _row (Google Sheets row number) or local index.
 * Works with both live (Google Sheets) and local data.
 */
export function deleteOrder(
  identifier: number | { _row?: number; products?: string }
): { success: boolean } {
  const orders = fetchOrders();
  let index = -1;
  let order: Order | undefined;

  if (typeof identifier === "object") {
    // Find by _row from live data
    const row = identifier._row;
    if (row) {
      index = orders.findIndex((o) => o._row === row);
    }
    if (index === -1) {
      // Fallback: still try to adjust inventory from the passed order data
      if (identifier.products) adjustInventory(identifier.products, 1);
      if (BUSINESS_URL && row) {
        postSheet(BUSINESS_URL, { action: "deleteOrder", row }).catch(() => {});
      }
      return { success: true };
    }
    order = orders[index];
  } else {
    if (identifier < 0 || identifier >= orders.length) return { success: false };
    index = identifier;
    order = orders[index];
  }

  if (!order) return { success: false };
  adjustInventory(order.products, 1);

  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, {
      action: "deleteOrder",
      row: order._row || index + 2,
    }).catch(() => {});
  }

  orders.splice(index, 1);
  for (let i = index; i < orders.length; i++) {
    orders[i]._row = i + 1;
  }
  writeJson("orders.json", orders);
  return { success: true };
}

/**
 * Edit order products: add/remove cards with stock adjustment.
 * Adjusts stock only if the order is already paid.
 */
export function editOrderProducts(
  index: number,
  newProducts: string,
  removedItems: string,
  addedItems: string,
  isPaid: boolean,
  sheetRow?: number,
): { success: boolean } {
  const orders = fetchOrders();
  let idx = index;
  if (sheetRow) {
    const found = orders.findIndex(o => o._row === sheetRow);
    if (found !== -1) idx = found;
  }
  const order = (idx >= 0 && idx < orders.length) ? orders[idx] : null;
  if (!order) return { success: false };

  order.products = newProducts;

  // Recalculate sellPrice from stored prices or current prices
  const allProducts = fetchProducts();
  const pMap = new Map(allProducts.map((p) => [p.code, p]));
  const newTotal = (newProducts || "").split(", ").reduce((sum, item) => {
    const match = item.match(/^(\d+)x\s+(.+?)\s+-\s+([^\s|]+)(?:\|([\d.]+))?$/);
    if (!match) return sum;
    const qty = parseInt(match[1]);
    const code = match[3];
    const storedPrice = match[4] !== undefined ? parseFloat(match[4]) : null;
    if (storedPrice !== null) {
      return sum + storedPrice * qty * 1000;
    }
    const prod = pMap.get(code);
    if (!prod || prod.price === null) return sum;
    return sum + prod.price * qty * 1000;
  }, 0);
  order.sellPrice = newTotal;

  // Adjust stock for paid orders
  if (isPaid) {
    if (removedItems) adjustInventory(removedItems, 1);
    if (addedItems) adjustInventory(addedItems, -1);
  }

  writeJson("orders.json", orders);

  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, {
      action: "updateOrder",
      row: order._row || idx + 2,
      data: { products: newProducts, sellPrice: newTotal },
    }).catch(() => {});
  }

  return { success: true };
}

// === Customers ===
export function fetchCustomers(): Customer[] {
  if (customersStore.length === 0) {
    const fileCustomers = readJson<Customer>("customers.json");
    customersStore.push(...fileCustomers);
  }
  return customersStore;
}

export async function fetchCustomersLive(): Promise<Customer[]> {
  if (BUSINESS_URL) {
    const data = await fetchSheet<Customer[]>(
      `${BUSINESS_URL}?action=customers`
    );
    if (data && Array.isArray(data)) return data;
  }
  return fetchCustomers();
}

export function addCustomer(
  customer: Omit<Customer, "_row">
): { success: boolean } {
  const customers = fetchCustomers();
  customers.push({ ...customer, _row: customers.length + 1 } as Customer);
  writeJson("customers.json", customers);

  // Also push to Google Sheets in background
  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, { action: "addCustomer", customer }).catch(
      () => {}
    );
  }

  return { success: true };
}

export function updateCustomer(
  index: number,
  data: Partial<Customer>
): { success: boolean } {
  const customers = fetchCustomers();
  if (index < 0 || index >= customers.length) return { success: false };
  customers[index] = { ...customers[index], ...data };
  writeJson("customers.json", customers);

  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, {
      action: "updateCustomer",
      row: customers[index]._row || index + 2,
      data,
    }).catch(() => {});
  }

  return { success: true };
}

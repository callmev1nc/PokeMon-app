import fs from "fs";
import path from "path";
import type { Product, Order, Customer } from "./types";

const dataDir = path.join(process.cwd(), "src", "data");

// Google Sheets URLs (set via env vars)
const STOCK_URL = process.env.GOOGLE_STOCK_URL || "";
const BUSINESS_URL = process.env.GOOGLE_BUSINESS_URL || "";

// Shared secret for the Apps Script webhook (B1). When set, every request to the
// Apps Script carries ?token=<APPS_SCRIPT_TOKEN> and the script should reject any
// request whose token doesn't match. Backward-compatible: unset = no token sent.
const APPS_SCRIPT_TOKEN = process.env.APPS_SCRIPT_TOKEN || "";
function withToken(url: string): string {
  if (!APPS_SCRIPT_TOKEN) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(APPS_SCRIPT_TOKEN)}`;
}

// In-memory stores (fallback for local dev)
let productsCache: Product[] | null = null;
const ordersStore: Order[] = [];
const customersStore: Customer[] = [];

// Simple promise-chain mutex for stock operations (TOCTOU prevention)
let stockMutex: Promise<void> = Promise.resolve();

function withStockLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const prev = stockMutex;
  let release: () => void;
  stockMutex = new Promise<void>((resolve) => { release = resolve; });
  return prev.then(async () => {
    try {
      return await fn();
    } finally {
      release!();
    }
  });
}

// Cache TTL for admin live reads (orders, customers)
const ADMIN_CACHE_TTL = 30_000; // 30 seconds
let ordersCache: { data: Order[]; ts: number } | null = null;
let customersCache: { data: Customer[]; ts: number } | null = null;

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
    const res = await fetch(withToken(url), { redirect: "follow" });
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
    const sep = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${sep}payload=${encodeURIComponent(json)}`;
    const res = await fetch(withToken(url), { redirect: "follow" });
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
    const name = match[2];

    // Match by code + name to avoid wrong-variant adjustments
    // (e.g., same card code exists as both holo and normal)
    const product = products.find((p) => p.code === code && p.name === name)
      || products.find((p) => p.code === code);
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
      const name = match[2];
      const product = products.find((p) => p.code === code && p.name === name)
        || products.find((p) => p.code === code);
      if (product) {
        // updateStock: quantity is subtracted from TỒN, added to XUẤT
        // For confirm (delta=-1): send +qty to reduce stock, increase xuất
        // For cancel (delta=+1): send -qty to restore stock, decrease xuất
        postSheet(STOCK_URL, {
          action: "updateStock",
          code: product.code,
          type: product.type,
          quantity: -delta * qty,
        }).catch(() => { console.error("Failed to sync stock to Sheets:", product.code); });
      }
    }
  }
}

/**
 * Validate remote stock data against local data to detect anomalies.
 * Returns { valid: false, reason } if remote data looks wrong.
 */
function validateStockData(
  remote: Product[],
  local: Product[]
): { valid: boolean; reason?: string } {
  const remoteInStock = remote.filter((p) => p.stock > 0).length;
  const localInStock = local.filter((p) => p.stock > 0).length;

  // All products have 0 stock from remote, but local has stock → definitely wrong
  if (remoteInStock === 0 && localInStock > 0) {
    return { valid: false, reason: "all-zero" };
  }

  // Remote has fewer than 10% of local in-stock count → suspicious data drop
  if (remoteInStock < localInStock * 0.1 && localInStock > 10) {
    return {
      valid: false,
      reason: `anomalous-drop (remote: ${remoteInStock}/${remote.length}, local: ${localInStock}/${local.length})`,
    };
  }

  return { valid: true };
}

export async function fetchProductsLive(): Promise<Product[]> {
  if (STOCK_URL) {
    const data = await fetchSheet<Product[]>(`${STOCK_URL}?action=products`);
    if (data && Array.isArray(data) && data.length > 0) {
      // Validate remote stock data before accepting it
      const localProducts = fetchProducts();
      const validation = validateStockData(data, localProducts);

      if (!validation.valid) {
        console.error(
          `[STOCK WARNING] Google Sheets stock data appears invalid (${validation.reason}). ` +
          `Remote in-stock: ${data.filter((p) => p.stock > 0).length}/${data.length}. ` +
          `Local in-stock: ${localProducts.filter((p) => p.stock > 0).length}/${localProducts.length}. ` +
          `Falling back to local data.`
        );
        // Do NOT overwrite the cache with bad data
        return localProducts;
      }

      // Data looks good — keep local cache in sync
      productsCache = data;
      writeJson("products.json", data);
      return data;
    }
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
      postSheet(STOCK_URL, { action: "updateProducts", products: sheetUpdates }).catch(() => { console.error("Failed to sync product updates to Sheets"); });
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
    postSheet(STOCK_URL, { action: "addProduct", product }).catch(() => { console.error("Failed to sync new product to Stock Sheets:", product.code); });
  }
  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, { action: "addProduct", product }).catch(() => { console.error("Failed to sync new product to Business Sheets:", product.code); });
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
  if (ordersCache && Date.now() - ordersCache.ts < ADMIN_CACHE_TTL) {
    return ordersCache.data;
  }
  const localOrders = fetchOrders();
  if (BUSINESS_URL) {
    const data = await fetchSheet<{ error?: string; data?: Order[]; [key: number]: Order }>(
      `${BUSINESS_URL}?action=orders`
    );
    if (data && Array.isArray(data)) {
      const remoteOrders = data;
      const merged = mergeOrders(localOrders, remoteOrders);
      ordersStore.length = 0;
      ordersStore.push(...merged);
      writeJson("orders.json", merged);
      ordersCache = { data: merged, ts: Date.now() };
      return merged;
    }
  }
  ordersCache = { data: localOrders, ts: Date.now() };
  return localOrders;
}

function mergeOrders(local: Order[], remote: Order[]): Order[] {
  const orderCodeSet = new Set(remote.map(o => o.orderCode));
  const localOnly = local.filter(o => o.orderCode && !orderCodeSet.has(o.orderCode));
  return [...remote, ...localOnly];
}

export function addOrder(order: Omit<Order, "_row">): { success: boolean; orderCode?: string } {
  const orders = fetchOrders();
  const orderCode = order.orderCode || `DH${Date.now()}`;
  orders.push({ ...order, orderCode, _row: orders.length + 1 } as Order);
  writeJson("orders.json", orders);

  // Bust admin read cache so writes are immediately visible (not delayed up to TTL)
  ordersCache = null;
  customersCache = null;

  // Also push to Google Sheets in background
  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, { action: "addOrder", order: { ...order, orderCode } }).catch(() => { console.error("Failed to push order to Google Sheets:", orderCode); });
  }

  return { success: true, orderCode };
}

export function updateOrder(
  index: number,
  data: Partial<Order>,
  orderCode?: string,
): { success: boolean } {
  const orders = fetchOrders();
  let idx = -1;

  if (orderCode) {
    idx = orders.findIndex(o => o.orderCode === orderCode);
  }
  if (idx === -1) {
    idx = orders.findIndex(o => o._row === index);
  }
  if (idx === -1) {
    return { success: false };
  }

  orders[idx] = { ...orders[idx], ...data };
  writeJson("orders.json", orders);

  // Bust admin read cache so writes are immediately visible (not delayed up to TTL)
  ordersCache = null;
  customersCache = null;

  // Also push to Google Sheets in background
  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, {
      action: "updateOrder",
      row: orders[idx]._row || idx + 2,
      data,
    }).catch(() => { console.error("Failed to sync order update to Sheets:", orders[idx]?.orderCode); });
  }

  return { success: true };
}

/**
 * Confirm order: adjust inventory when payment status changes.
 * Reduces stock when confirming to paid, restores when canceling to unpaid.
 */
export async function confirmOrder(
  index: number,
  data: Partial<Order>,
  orderProducts?: string,
  orderRow?: number,
  orderCode?: string,
): Promise<{ success: boolean }> {
  const orders = fetchOrders();
  let idx = -1;

  if (orderCode) {
    idx = orders.findIndex(o => o.orderCode === orderCode);
  }
  if (idx === -1 && orderRow) {
    idx = orders.findIndex(o => o._row === orderRow);
  }
  if (idx === -1) {
    return { success: false };
  }
  const order = (idx >= 0 && idx < orders.length) ? orders[idx] : null;
  if (!order) return { success: false };

  // Use provided products string or fall back to local order's products
  const productsStr = orderProducts || (order?.products ?? "");

  if (data.paymentStatus === "Đã thanh toán") {
    await withStockLock(async () => {
      const freshProducts = STOCK_URL ? await fetchProductsLive() : fetchProducts();
      productsCache = freshProducts;
      adjustInventory(productsStr, -1);
    });
  } else if (data.paymentStatus === "Chưa thanh toán") {
    await withStockLock(async () => {
      const freshProducts = STOCK_URL ? await fetchProductsLive() : fetchProducts();
      productsCache = freshProducts;
      adjustInventory(productsStr, 1);
    });
  }

  // Update local store if possible
  if (order) {
    orders[idx] = { ...order, ...data };
    writeJson("orders.json", orders);
  }

  // Bust admin read cache so writes are immediately visible (not delayed up to TTL)
  ordersCache = null;
  customersCache = null;

  // Push to Google Sheets
  if (BUSINESS_URL) {
    const row = orderRow || order?._row || index + 2;
    postSheet(BUSINESS_URL, {
      action: "confirmOrder",
      row,
      data,
    }).catch(() => { console.error("Failed to sync confirmOrder to Sheets, row:", row); });
  }

  return { success: true };
}

/**
 * Delete order by _row (Google Sheets row number) or local index.
 * Only handles local data removal — inventory and Sheets deletion
 * are managed by the API route to avoid double calls.
 */
export function deleteOrder(
  identifier: number | { _row?: number; products?: string }
): { success: boolean } {
  const orders = fetchOrders();
  let index = -1;

  if (typeof identifier === "object") {
    const row = identifier._row;
    if (row) {
      index = orders.findIndex((o) => o._row === row);
    }
    if (index === -1) return { success: true };
  } else {
    if (identifier < 0 || identifier >= orders.length) return { success: false };
    index = identifier;
  }

  orders.splice(index, 1);
  writeJson("orders.json", orders);

  // Bust admin read cache so writes are immediately visible (not delayed up to TTL)
  ordersCache = null;
  customersCache = null;

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
  orderCode?: string,
): { success: boolean } {
  const orders = fetchOrders();
  let idx = -1;

  if (orderCode) {
    idx = orders.findIndex(o => o.orderCode === orderCode);
  }
  if (idx === -1) {
    idx = orders.findIndex(o => o._row === index);
  }
  if (idx === -1) {
    return { success: false };
  }
  const order = (idx >= 0 && idx < orders.length) ? orders[idx] : null;
  if (!order) return { success: false };

  order.products = newProducts;

  // Recalculate sellPrice from stored prices or current prices
  const allProducts = fetchProducts();
  const newTotal = (newProducts || "").split(", ").reduce((sum, item) => {
    const match = item.match(/^(\d+)x\s+(.+?)\s+-\s+([^\s|]+)(?:\|([\d.]+))?$/);
    if (!match) return sum;
    const qty = parseInt(match[1]);
    const code = match[3];
    const name = match[2];
    const storedPrice = match[4] !== undefined ? parseFloat(match[4]) : null;
    if (storedPrice !== null) {
      return sum + storedPrice * qty * 1000;
    }
    const prod = allProducts.find((p) => p.code === code && p.name === name)
      || allProducts.find((p) => p.code === code);
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

  // Bust admin read cache so writes are immediately visible (not delayed up to TTL)
  ordersCache = null;
  customersCache = null;

  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, {
      action: "updateOrder",
      row: order._row || idx + 2,
      data: { products: newProducts, sellPrice: newTotal },
    }).catch(() => { console.error("Failed to sync editOrderProducts to Sheets, row:", order._row || idx + 2); });
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
  if (customersCache && Date.now() - customersCache.ts < ADMIN_CACHE_TTL) {
    return customersCache.data;
  }
  if (BUSINESS_URL) {
    const data = await fetchSheet<Customer[]>(
      `${BUSINESS_URL}?action=customers`
    );
    if (data && Array.isArray(data)) {
      customersStore.length = 0;
      customersStore.push(...data);
      writeJson("customers.json", data);
      customersCache = { data, ts: Date.now() };
      return data;
    }
  }
  const customers = fetchCustomers();
  customersCache = { data: customers, ts: Date.now() };
  return customers;
}

export function addCustomer(
  customer: Omit<Customer, "_row">
): { success: boolean } {
  const customers = fetchCustomers();
  customers.push({ ...customer, _row: customers.length + 1 } as Customer);
  writeJson("customers.json", customers);

  // Bust admin read cache so writes are immediately visible (not delayed up to TTL)
  ordersCache = null;
  customersCache = null;

  // Also push to Google Sheets in background (notes goes to column H)
  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, { action: "addCustomer", customer }).catch(
      () => { console.error("Failed to sync new customer to Sheets:", customer.name); }
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

  // Bust admin read cache so writes are immediately visible (not delayed up to TTL)
  ordersCache = null;
  customersCache = null;

  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, {
      action: "updateCustomer",
      row: customers[index]._row || index + 2,
      data,
    }).catch(() => { console.error("Failed to sync customer update to Sheets, row:", index); });
  }

  return { success: true };
}

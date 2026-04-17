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

async function postSheet<T>(baseUrl: string, payload: Record<string, unknown>): Promise<T | null> {
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
  data: Partial<Order>
): { success: boolean } {
  const orders = fetchOrders();
  if (index < 0 || index >= orders.length) return { success: false };
  orders[index] = { ...orders[index], ...data };
  writeJson("orders.json", orders);

  // Also push to Google Sheets in background
  if (BUSINESS_URL) {
    postSheet(BUSINESS_URL, {
      action: "updateOrder",
      row: orders[index]._row || index + 2,
      data,
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

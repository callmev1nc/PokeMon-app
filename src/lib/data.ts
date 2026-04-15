import fs from "fs";
import path from "path";
import type { Product, Order, Customer } from "./types";

const dataDir = path.join(process.cwd(), "src", "data");

// In-memory stores (used on Vercel where filesystem is read-only)
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
  if (!isDev) return; // Skip writing on production (read-only filesystem)
  try {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Silently fail on read-only filesystem
  }
}

// === Products ===
export function fetchProducts(): Product[] {
  if (!productsCache) {
    productsCache = readJson<Product>("products.json");
  }
  return productsCache;
}

export function updateProducts(updates: Partial<Product>[]): { success: boolean; updated: number } {
  const products = fetchProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  let updated = 0;
  for (const u of updates) {
    const id = u.id;
    if (!id || !productMap.has(id)) continue;
    const existing = productMap.get(id)!;
    if (u.price !== undefined) existing.price = u.price;
    if (u.stock !== undefined) existing.stock = u.stock;
    updated++;
  }

  productsCache = products;
  writeJson("products.json", products);
  return { success: true, updated };
}

// === Orders ===
export function fetchOrders(): Order[] {
  if (ordersStore.length === 0) {
    const fileOrders = readJson<Order>("orders.json");
    ordersStore.push(...fileOrders);
  }
  return ordersStore;
}

export function addOrder(order: Omit<Order, "_row">): { success: boolean } {
  const orders = fetchOrders();
  orders.push({ ...order, _row: orders.length + 1 } as Order);
  writeJson("orders.json", orders);
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

export function addCustomer(
  customer: Omit<Customer, "_row">
): { success: boolean } {
  const customers = fetchCustomers();
  customers.push({ ...customer, _row: customers.length + 1 } as Customer);
  writeJson("customers.json", customers);
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
  return { success: true };
}

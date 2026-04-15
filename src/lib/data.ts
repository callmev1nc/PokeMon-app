import fs from "fs";
import path from "path";
import type { Product, Order, Customer } from "./types";

const dataDir = path.join(process.cwd(), "src", "data");

function readJson<T>(filename: string): T[] {
  const filePath = path.join(dataDir, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T[];
}

function writeJson<T>(filename: string, data: T[]): void {
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// === Products ===
export function fetchProducts(): Product[] {
  return readJson<Product>("products.json");
}

export function updateProducts(updates: Partial<Product>[]): { success: boolean; updated: number } {
  const products = readJson<Product>("products.json");
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

  writeJson("products.json", products);
  return { success: true, updated };
}

// === Orders ===
export function fetchOrders(): Order[] {
  return readJson<Order>("orders.json");
}

export function addOrder(order: Omit<Order, "_row">): { success: boolean } {
  const orders = readJson<Order>("orders.json");
  orders.push({ ...order, _row: orders.length + 2 } as Order);
  writeJson("orders.json", orders);
  return { success: true };
}

export function updateOrder(
  index: number,
  data: Partial<Order>
): { success: boolean } {
  const orders = readJson<Order>("orders.json");
  if (index < 0 || index >= orders.length) return { success: false };
  orders[index] = { ...orders[index], ...data };
  writeJson("orders.json", orders);
  return { success: true };
}

// === Customers ===
export function fetchCustomers(): Customer[] {
  return readJson<Customer>("customers.json");
}

export function addCustomer(
  customer: Omit<Customer, "_row">
): { success: boolean } {
  const customers = readJson<Customer>("customers.json");
  customers.push({ ...customer, _row: customers.length + 2 } as Customer);
  writeJson("customers.json", customers);
  return { success: true };
}

export function updateCustomer(
  index: number,
  data: Partial<Customer>
): { success: boolean } {
  const customers = readJson<Customer>("customers.json");
  if (index < 0 || index >= customers.length) return { success: false };
  customers[index] = { ...customers[index], ...data };
  writeJson("customers.json", customers);
  return { success: true };
}

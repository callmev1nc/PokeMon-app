// ============================================================
// Bulk recalculate GIÁ MUA (buy price) for all orders
// Based on card type: Normal/Holo=500đ, EX=20000đ, Prize=0đ
// ============================================================
//
// Usage:
//   npx tsx scripts/recalc-order-pricing.ts --dry-run        # preview only
//   npx tsx scripts/recalc-order-pricing.ts --limit 5 --force # test on 5 orders
//   npx tsx scripts/recalc-order-pricing.ts --force           # update all

import * as fs from "fs";
import * as path from "path";

// --- Types ---

interface Product {
  code: string;
  name: string;
  displayType: "Normal" | "Holo" | "Prize Card" | "EX" | "Holo Prize Card" | "EX Prize Card";
}

interface Order {
  _row?: number;
  orderCode: string;
  products: string;
  sellPrice: number;
  buyPrice: number;
  shippingCost: number;
}

// --- Pricing constants (full VND) ---

const BUY_PRICES: Record<string, number> = {
  Normal: 500,
  Holo: 500,
  EX: 20000,
  "Prize Card": 0,
  "Holo Prize Card": 0,
  "EX Prize Card": 0,
};

const PRODUCT_REGEX = /^(\d+)x\s+(.+?)\s+-\s+([^\s|]+)(?:\|([\d.]+))?$/;

// --- Env loader ---

function loadEnv(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("ERROR: .env.local not found");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

// --- Google Sheets helpers ---

async function fetchFromSheet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function postToSheet<T>(baseUrl: string, payload: Record<string, unknown>): Promise<T | null> {
  try {
    const json = JSON.stringify(payload);
    const sep = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${sep}payload=${encodeURIComponent(json)}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// --- Core logic ---

function calculateBuyPrice(
  productsStr: string,
  productMap: Map<string, Product>
): { buyPrice: number; details: string[]; unmatched: string[] } {
  if (!productsStr) return { buyPrice: 0, details: [], unmatched: [] };

  const items = productsStr.split(", ");
  let totalBuyPrice = 0;
  const details: string[] = [];
  const unmatched: string[] = [];

  for (const item of items) {
    const match = item.trim().match(PRODUCT_REGEX);
    if (!match) {
      details.push(`  SKIP (no match): "${item}"`);
      continue;
    }

    const qty = parseInt(match[1], 10);
    const name = match[2];
    const code = match[3];

    const product = productMap.get(code);
    if (!product) {
      unmatched.push(code);
      details.push(`  ${qty}x ${name} (${code}) - NOT FOUND, cost=0`);
      continue;
    }

    const unitPrice = BUY_PRICES[product.displayType] ?? 500;
    const lineTotal = qty * unitPrice;
    totalBuyPrice += lineTotal;
    details.push(`  ${qty}x ${name} (${code}) [${product.displayType}] = ${qty} x ${unitPrice.toLocaleString()}đ = ${lineTotal.toLocaleString()}đ`);
  }

  return { buyPrice: totalBuyPrice, details, unmatched };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;

  loadEnv();

  const STOCK_URL = process.env.GOOGLE_STOCK_URL;
  const BUSINESS_URL = process.env.GOOGLE_BUSINESS_URL;

  if (!STOCK_URL || !BUSINESS_URL) {
    console.error("ERROR: GOOGLE_STOCK_URL and GOOGLE_BUSINESS_URL must be set in .env.local");
    process.exit(1);
  }

  // 1. Fetch products
  console.log("Fetching products...");
  const products = await fetchFromSheet<Product[]>(`${STOCK_URL}?action=products`);
  if (!products || !Array.isArray(products)) {
    console.error("ERROR: Could not fetch products");
    process.exit(1);
  }

  // Build code -> product map (last product with that code wins, same as app)
  const productMap = new Map<string, Product>();
  for (const p of products) {
    productMap.set(p.code, p);
  }
  console.log(`Loaded ${productMap.size} unique product codes`);

  // 2. Fetch orders
  console.log("Fetching orders...");
  const rawOrders = await fetchFromSheet<Order[]>(`${BUSINESS_URL}?action=orders`);
  if (!rawOrders || !Array.isArray(rawOrders)) {
    console.error("ERROR: Could not fetch orders");
    process.exit(1);
  }
  console.log(`Loaded ${rawOrders.length} orders`);

  // Filter orders
  let orders = rawOrders;
  if (limit > 0) {
    orders = orders.slice(0, limit);
    console.log(`Limited to first ${limit} orders`);
  }

  if (!force) {
    const withBuyPrice = orders.filter((o) => o.buyPrice && o.buyPrice > 0).length;
    const skipped = orders.filter((o) => o.buyPrice && o.buyPrice > 0);
    orders = orders.filter((o) => !o.buyPrice || o.buyPrice === 0);
    if (skipped.length > 0) {
      console.log(`Skipping ${skipped.length} orders that already have buyPrice (use --force to overwrite)`);
    }
  }

  if (orders.length === 0) {
    console.log("No orders to update");
    return;
  }

  // 3. Calculate buyPrice for each order
  console.log(`\n${"=".repeat(60)}`);
  console.log(dryRun ? "DRY RUN - Preview only" : "UPDATING ORDERS");
  console.log(`${"=".repeat(60)}\n`);

  const updates: { row: number; orderCode: string; buyPrice: number; shippingCost: number; details: string[] }[] = [];
  const allUnmatched = new Set<string>();

  for (const order of orders) {
    if (!order._row) {
      console.log(`SKIP: ${order.orderCode} (no _row)`);
      continue;
    }

    const { buyPrice, details, unmatched } = calculateBuyPrice(order.products, productMap);
    for (const code of unmatched) allUnmatched.add(code);

    const profit = order.sellPrice - buyPrice - (order.shippingCost || 0);

    console.log(`[${order._row}] ${order.orderCode}`);
    console.log(`  GIÁ BÁN: ${order.sellPrice.toLocaleString()}đ`);
    console.log(`  GIÁ SHIP: ${(order.shippingCost || 0).toLocaleString()}đ`);
    console.log(`  GIÁ SHIP (new): 15,000đ`);
    console.log(`  GIÁ MUA (new): ${buyPrice.toLocaleString()}đ`);
    console.log(`  LỢI NHUẬN (will be): ${profit.toLocaleString()}đ`);
    for (const d of details) console.log(d);
    console.log();

    const shippingCost = 15000;
    updates.push({ row: order._row, orderCode: order.orderCode, buyPrice, shippingCost, details });
  }

  if (allUnmatched.size > 0) {
    console.log(`\nWARNING: ${allUnmatched.size} unmatched product codes: ${[...allUnmatched].join(", ")}`);
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] Would update ${updates.length} orders. No changes made.`);
    return;
  }

  // 4. Apply updates in batches
  let updated = 0;
  let failed = 0;
  const BATCH_SIZE = 10;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    console.log(`Updating batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} orders)...`);

    for (const u of batch) {
      const result = await postToSheet<{ success: boolean }>(BUSINESS_URL, {
        action: "updateOrder",
        row: u.row,
        data: { buyPrice: u.buyPrice, shippingCost: u.shippingCost },
      });

      if (result?.success) {
        updated++;
      } else {
        failed++;
        console.log(`  FAILED: [${u.row}] ${u.orderCode}`);
      }
    }

    // Small delay between batches to avoid GAS quotas
    if (i + BATCH_SIZE < updates.length) {
      await sleep(500);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`DONE: ${updated} updated, ${failed} failed`);
  console.log(`${"=".repeat(60)}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

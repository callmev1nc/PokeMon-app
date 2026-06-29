import type { Order, Product } from "./types";

interface SalesEntry {
  productCode: string;
  productName: string;
  totalSold: number;
  weightedScore: number;
}

/**
 * Parse products string from an order into individual items.
 * Format: "2x CardName - CODE|price, 1x Another - CODE2|price"
 */
function parseOrderProducts(productsStr: string): Array<{
  quantity: number;
  name: string;
  code: string;
}> {
  if (!productsStr) return [];
  return productsStr
    .split(", ")
    .map((item) => {
      const match = item.match(
        /^(\d+)x\s+(.+?)\s+-\s+([^\s|]+)(?:\|([\d.]+))?$/
      );
      if (!match) return null;
      return {
        quantity: parseInt(match[1]),
        name: match[2],
        code: match[3],
      };
    })
    .filter(Boolean) as Array<{ quantity: number; name: string; code: string }>;
}

/**
 * Compute a time-decay weight for an order.
 * Orders within 30 days: weight 1.0
 * Orders 30-60 days: weight 0.7
 * Orders 60-90 days: weight 0.4
 * Orders older than 90 days: weight 0.1
 */
function timeDecayWeight(orderTimestamp: string): number {
  const orderDate = new Date(orderTimestamp).getTime();
  if (isNaN(orderDate)) return 0.1; // invalid date gets low weight
  const now = Date.now();
  const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);
  if (daysDiff <= 30) return 1.0;
  if (daysDiff <= 60) return 0.7;
  if (daysDiff <= 90) return 0.4;
  return 0.1;
}

/**
 * Build a sales ranking from order history.
 * Returns a Map keyed by "code|name" with aggregated sales data.
 */
function computeSalesRanking(
  orders: Order[]
): Map<string, SalesEntry> {
  const salesMap = new Map<string, SalesEntry>();

  for (const order of orders) {
    const weight = timeDecayWeight(order.timestamp);
    const items = parseOrderProducts(order.products);

    for (const item of items) {
      const key = `${item.code}|${item.name}`;
      const existing = salesMap.get(key);
      if (existing) {
        existing.totalSold += item.quantity;
        existing.weightedScore += item.quantity * weight;
      } else {
        salesMap.set(key, {
          productCode: item.code,
          productName: item.name,
          totalSold: item.quantity,
          weightedScore: item.quantity * weight,
        });
      }
    }
  }

  return salesMap;
}

/** Pick the representative variant for one product code.
 *  Preference: in-stock, then lowest price, then highest stock. */
function pickRepresentativeVariant(variants: Product[]): Product | null {
  const sellable = variants.filter((p) => p.stock > 0 && p.price !== null);
  if (sellable.length === 0) return null;
  sellable.sort((a, b) => {
    if ((a.price ?? 0) !== (b.price ?? 0)) return (a.price ?? 0) - (b.price ?? 0);
    return b.stock - a.stock;
  });
  return sellable[0];
}

/** Collapse catalog rows to one representative Product per code. */
function dedupeByCode(products: Product[]): Product[] {
  const groups = new Map<string, Product[]>();
  for (const p of products) {
    const arr = groups.get(p.code);
    if (arr) arr.push(p); else groups.set(p.code, [p]);
  }
  const reps: Product[] = [];
  for (const variants of groups.values()) {
    const rep = pickRepresentativeVariant(variants);
    if (rep) reps.push(rep);
  }
  return reps;
}

/**
 * Fallback: current stock-based logic (low stock = hot)
 */
function getStockBasedHot(products: Product[], count: number): Product[] {
  const candidates = dedupeByCode(products);
  return candidates
    .filter((p) => p.stock > 0 && p.stock <= 5 && p.price !== null)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, count);
}

/**
 * Get the top N hottest products based on sales data.
 * Falls back to stock-based ranking if insufficient order data.
 */
export function getHotProducts(
  products: Product[],
  orders: Order[],
  count: number = 4
): Product[] {
  const salesRanking = computeSalesRanking(orders);

  // Build per-code sales score map for dedup ranking
  const scoreByCode = new Map<string, number>();
  for (const entry of salesRanking.values()) {
    scoreByCode.set(entry.productCode, (scoreByCode.get(entry.productCode) ?? 0) + entry.weightedScore);
  }

  // Need at least 3 orders with data to use sales-based ranking
  const ordersWithProducts = orders.filter(
    (o) => o.products && o.products.trim().length > 0
  );
  if (ordersWithProducts.length < 3 || salesRanking.size < 2) {
    return getStockBasedHot(products, count);
  }

  // Sort unique products by weighted sales score (descending)
  const candidates = dedupeByCode(products);
  const ranked = candidates
    .map((p) => ({ product: p, score: scoreByCode.get(p.code) ?? 0 }))
    .sort((a, b) => b.score - a.score);

  // If top products have no sales data at all, fall back
  if (ranked[0]?.score === 0) {
    return getStockBasedHot(products, count);
  }

  return ranked.slice(0, count).map((r) => r.product);
}

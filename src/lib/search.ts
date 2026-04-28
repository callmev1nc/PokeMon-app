import Fuse, { type IFuseOptions } from "fuse.js";
import type { Product } from "@/lib/types";

const fuseOptions: IFuseOptions<Product> = {
  keys: [
    { name: "name", weight: 2 },
    { name: "code", weight: 1.5 },
    { name: "series", weight: 1 },
  ],
  threshold: 0.3,
  includeScore: true,
};

let fuse: Fuse<Product> | null = null;

export function initSearchIndex(products: Product[]): void {
  fuse = new Fuse(products, fuseOptions);
}

export function fuzzySearch(query: string, limit = 6): Product[] {
  if (!fuse || !query.trim()) return [];
  return fuse.search(query, { limit }).map((r) => r.item);
}

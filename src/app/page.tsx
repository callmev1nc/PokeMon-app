import { fetchProductsLive } from "@/lib/data";
import { getImageUrl, resolveImageUrl } from "@/lib/cardImageCache";
import type { Product } from "@/lib/types";
import HomeClient from "@/components/HomeClient";
import * as fs from "fs";
import * as path from "path";

export const revalidate = 120;

function getPokemonTypes(): Record<string, string> {
  try {
    const typesPath = path.join(process.cwd(), "src", "data", "pokemon-types.json");
    if (fs.existsSync(typesPath)) {
      const rawData = JSON.parse(fs.readFileSync(typesPath, "utf-8"));
      const productsPath = path.join(process.cwd(), "src", "data", "products.json");
      if (fs.existsSync(productsPath)) {
        const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
        const typeMap: Record<string, string> = {};
        for (const p of products) {
          if (rawData[p.id]) {
            const compositeKey = `${p.code}|${p.type}|${p.series}`;
            typeMap[compositeKey] = rawData[p.id];
          }
        }
        return typeMap;
      }
      return rawData;
    }
  } catch {
    // fallback below
  }
  return {};
}

export default async function HomePage() {
  const rawProducts = await fetchProductsLive();
  const pokemonTypes = getPokemonTypes();

  const products: Product[] = rawProducts.map((p, i) => {
    const id = p.id || `${p.code}-${p.type}-${i}`;
    const compositeKey = `${p.code}|${p.type}|${p.series}`;
    return {
      ...p,
      id,
      type: pokemonTypes[compositeKey] || p.type,
      imageUrl: getImageUrl(id) || getImageUrl(compositeKey) || undefined,
    };
  });

  // Resolve missing images in background (non-blocking for SSR)
  const missing = products.filter((p) => !p.imageUrl);
  if (missing.length > 0) {
    // Fire and forget — images will be resolved for subsequent requests
    Promise.all(
      missing.map(async (p) => {
        const compositeKey = `${p.code}|${p.type}|${p.series}`;
        p.imageUrl = await resolveImageUrl(compositeKey, p.name);
      })
    ).catch(() => {});
  }

  return <HomeClient products={products} />;
}

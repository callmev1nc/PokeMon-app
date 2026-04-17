import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

interface Product {
  id: string;
  code: string;
  name: string;
  series: string;
  type: string;
  displayType: "Normal" | "Holo" | "Prize Card" | "EX" | "Holo Prize Card" | "EX Prize Card";
  group: string;
  price: number | null;
  buyPrice: number | null;
  stock: number;
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

function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function main() {
  const rootDir = path.resolve(__dirname, "..");
  const stockPath = path.join(rootDir, "2026 Stock Pokemon extra.xlsx");
  const menuPath = path.join(rootDir, "2026 Stock Pokemon.xlsx");
  const outputPath = path.join(rootDir, "src", "data", "products.json");

  if (!fs.existsSync(stockPath)) {
    console.error("Stock file not found:", stockPath);
    process.exit(1);
  }

  // === Read MENU (Business sheet) for buy prices ===
  const menuBuyPrices = new Map<string, number>();
  if (fs.existsSync(menuPath)) {
    const menuWb = XLSX.readFile(menuPath);
    const menuSheet = menuWb.Sheets["MENU"];
    if (menuSheet) {
      const menuData: unknown[][] = XLSX.utils.sheet_to_json(menuSheet, {
        header: 1,
        defval: "",
      });
      for (let i = 1; i < menuData.length; i++) {
        const code = String(menuData[i][0] || "").trim();
        const series = String(menuData[i][2] || "").trim().toUpperCase();
        const buyPrice = parseNumber(menuData[i][6]);
        if (code && series && buyPrice !== null) {
          menuBuyPrices.set(`${code}|${series}`, buyPrice);
        }
      }
      console.log(
        `Loaded ${menuBuyPrices.size} buy prices from MENU sheet`
      );
    }
  }

  // === Read Stock (extra.xlsx) for full product data ===
  const workbook = XLSX.readFile(stockPath);
  const sheetName = workbook.SheetNames[0];
  console.log(`Reading stock sheet: ${sheetName}`);

  const sheet = workbook.Sheets[sheetName];
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });

  if (rawData.length < 3) {
    console.error("Not enough rows in Excel file");
    process.exit(1);
  }

  const products: Product[] = [];
  let skipped = 0;

  for (let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    const code = String(row[0] || "").trim();
    const group = String(row[1] || "").trim().toLowerCase();
    const name = String(row[2] || "").trim();
    const series = String(row[3] || "").trim();
    const rawType = String(row[4] || "").trim().toLowerCase();
    const kho = String(row[5] || "").trim();
    const price = parseNumber(row[6]);
    const stock = parseNumber(row[10]) ?? parseNumber(row[11]) ?? 0;

    if (!code || !name) {
      skipped++;
      continue;
    }

    const displayType = mapDisplayType(rawType);
    const typeSlug = rawType.replace(/\s+/g, "-");
    const baseId = `${code}-${typeSlug}`;
    const uniqueKey = `${series}-${i}`;
    const seriesHash = crypto
      .createHash("md5")
      .update(uniqueKey)
      .digest("hex")
      .slice(0, 6);
    const id = `${baseId}-${seriesHash}`;

    // Look up buy price from MENU sheet
    const menuKey = `${code}|${series.toUpperCase()}`;
    const buyPrice = menuBuyPrices.get(menuKey) ?? null;

    products.push({
      id,
      code,
      name,
      series,
      type: rawType,
      displayType,
      group,
      price,
      buyPrice,
      stock: Math.round(stock),
    });
  }

  products.sort((a, b) => a.name.localeCompare(b.name));

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), "utf-8");

  console.log(
    `\n✅ Parsed ${products.length} products (skipped ${skipped} rows)`
  );
  console.log(`📄 Output: ${outputPath}`);

  const stats: Record<string, number> = {};
  for (const p of products) {
    stats[p.displayType] = (stats[p.displayType] || 0) + 1;
  }
  console.log("\nDisplay type breakdown:");
  for (const [type, count] of Object.entries(stats)) {
    console.log(`  ${type}: ${count}`);
  }

  const withPrice = products.filter((p) => p.price !== null).length;
  console.log(`\nWith sell price: ${withPrice}/${products.length}`);

  const withBuyPrice = products.filter((p) => p.buyPrice !== null).length;
  console.log(`With buy price: ${withBuyPrice}/${products.length}`);
}

main();

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
  displayType: "Normal" | "Holo" | "Prize Card" | "EX" | "Holo Prize Card";
  group: string;
  price: number | null;
  stock: number;
}

function mapDisplayType(rawType: string): "Normal" | "Holo" | "Prize Card" | "EX" | "Holo Prize Card" {
  const t = rawType.toLowerCase().trim();
  if (t === "holo prize card") return "Holo Prize Card";
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
  const excelPath = path.join(rootDir, "2026 Stock Pokemon extra.xlsx");
  const outputPath = path.join(rootDir, "src", "data", "products.json");

  if (!fs.existsSync(excelPath)) {
    console.error("Excel file not found:", excelPath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  console.log(`Reading sheet: ${sheetName}`);

  const sheet = workbook.Sheets[sheetName];
  // Use header: 1 to get raw arrays, skip row 0 (title), row 1 is headers
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (rawData.length < 3) {
    console.error("Not enough rows in Excel file");
    process.exit(1);
  }

  // Row 1 (index 1) has headers: No, Stype, Good description, Series, Type, KHO, Unit Price, ĐẦU KỲ, XUẤT, NHẬP, TỒN, SUM
  const products: Product[] = [];
  let skipped = 0;

  // Data starts from row 2 (index 2)
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
    // Make ID unique by hashing series + row index
    const uniqueKey = `${series}-${i}`;
    const seriesHash = crypto.createHash("md5").update(uniqueKey).digest("hex").slice(0, 6);
    const id = `${baseId}-${seriesHash}`;

    products.push({
      id,
      code,
      name,
      series,
      type: rawType,
      displayType,
      group,
      price,
      stock: Math.round(stock),
    });
  }

  // Sort by name for consistent ordering
  products.sort((a, b) => a.name.localeCompare(b.name));

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), "utf-8");

  console.log(`\n✅ Parsed ${products.length} products (skipped ${skipped} rows)`);
  console.log(`📄 Output: ${outputPath}`);

  // Stats
  const stats: Record<string, number> = {};
  for (const p of products) {
    stats[p.displayType] = (stats[p.displayType] || 0) + 1;
  }
  console.log("\nDisplay type breakdown:");
  for (const [type, count] of Object.entries(stats)) {
    console.log(`  ${type}: ${count}`);
  }

  const withPrice = products.filter((p) => p.price !== null).length;
  console.log(`\nWith price: ${withPrice}/${products.length}`);
}

main();

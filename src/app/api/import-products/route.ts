import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/auth-edge";
import { addProductLocal, fetchProducts } from "@/lib/data";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rows: string[][] = body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data" }, { status: 400 });
    }

    const existing = fetchProducts();
    const existingCodes = new Set(existing.map((p) => `${p.code}-${p.type}`));
    let added = 0;
    let skipped = 0;

    for (const row of rows) {
      const [code, name, series, type, group, price, stock] = row;
      if (!code || !name) { skipped++; continue; }

      const key = `${code}-${(type || "normal").toLowerCase()}`;
      if (existingCodes.has(key)) { skipped++; continue; }

      addProductLocal({
        code: String(code).trim(),
        name: String(name).trim(),
        series: String(series || "").trim(),
        type: String(type || "normal").trim().toLowerCase(),
        group: String(group || "pokemon").trim().toLowerCase(),
        price: price !== "" && price !== null && price !== undefined ? Number(price) : null,
        buyPrice: null,
        stock: Number(stock) || 0,
      });
      existingCodes.add(key);
      added++;
    }

    return NextResponse.json({ success: true, added, skipped });
  } catch {
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

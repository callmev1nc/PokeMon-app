import { NextRequest, NextResponse } from "next/server";
import { fetchProductsLive } from "@/lib/data";
import { verifySession, COOKIE_NAME } from "@/lib/auth-edge";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await fetchProductsLive();
    const csv = [
      "code,name,series,type,group,price,stock",
      ...products.map((p) =>
        [
          p.code,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.series.replace(/"/g, '""')}"`,
          p.type,
          p.group,
          p.price ?? "",
          p.stock,
        ].join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="products-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/auth-edge";
import { adjustInventory } from "@/lib/data";
import { logAction } from "@/lib/auditLog";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { products, reason } = body;
    if (!products) return NextResponse.json({ error: "Missing products" }, { status: 400 });

    // Restore inventory
    adjustInventory(products, 1);
    logAction("refund", "admin", `Refund: ${reason || "No reason"} - ${products}`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}

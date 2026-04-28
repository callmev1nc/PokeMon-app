import { z } from "zod";
import { NextResponse } from "next/server";

export const orderSchema = z.object({
  timestamp: z.string(),
  orderDate: z.string(),
  orderCode: z.string().min(1).max(100),
  products: z.string().min(1).max(10000),
  customerName: z.string().min(1).max(200),
  phone: z.string().min(9).max(11),
  address: z.string().max(500),
  oldAddress: z.string().max(500),
  notes: z.string().max(1000),
  sellPrice: z.number().min(0),
  buyPrice: z.number().min(0),
  shippingCost: z.number().min(0),
  profit: z.number(),
  paymentStatus: z.enum(["Chưa thanh toán", "Đã chuyển khoản", "Đã thanh toán"]),
});

export const customerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(9).max(11),
  newAddress: z.string().max(500),
  oldAddress: z.string().max(500),
});

export const productSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  series: z.string().max(100),
  type: z.string().max(50),
  group: z.enum(["pokemon", "item", "tool", "stadium", "suppoter", "supporter", "energy", "special energy"]),
  price: z.number().nullable(),
  stock: z.number().int().min(0),
});

export const trackOrderSchema = z.object({
  phone: z.string().min(9).max(11).optional(),
  orderCode: z.string().min(1).max(100).optional(),
}).refine((data) => data.phone || data.orderCode, {
  message: "Phone or orderCode required",
});

export const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const productUpdateSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  price: z.number().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  series: z.string().max(100).optional(),
  type: z.string().max(50).optional(),
  group: z.string().max(50).optional(),
  displayType: z.string().max(50).optional(),
  buyPrice: z.number().nullable().optional(),
});

export async function validateBody<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        error: NextResponse.json(
          { error: "Validation failed", details: e.issues.map((err) => err.message) },
          { status: 400 }
        ),
      };
    }
    return {
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}

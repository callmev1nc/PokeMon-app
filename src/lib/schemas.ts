import { z } from "zod";

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

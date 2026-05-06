export interface Product {
  id: string;
  code: string;
  name: string;
  series: string;
  type: string;
  displayType:
    | "Normal"
    | "Holo"
    | "Prize Card"
    | "EX"
    | "Holo Prize Card"
    | "EX Prize Card";
  group: string;
  price: number | null;
  buyPrice: number | null;
  stock: number;
  _row?: number;
  imageUrl?: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type DisplayType =
  | "Normal"
  | "Holo"
  | "Prize Card"
  | "EX"
  | "Holo Prize Card"
  | "EX Prize Card";

export type SortOption = "price-asc" | "price-desc" | "stock-asc" | "name-asc";

export interface Customer {
  _row?: number;
  name: string;
  phone: string;
  newAddress: string;
  oldAddress: string;
  notes?: string;
}

export interface Order {
  _row?: number;
  timestamp: string;
  orderDate: string;
  orderCode: string;
  products: string;
  customerName: string;
  phone: string;
  address: string;
  oldAddress?: string;
  notes: string;
  sellPrice: number;
  buyPrice: number;
  shippingCost: number;
  profit: number;
  paymentStatus: "Chưa thanh toán" | "Đã chuyển khoản" | "Đã thanh toán";
  deliveryStatus?: "Chưa giao" | "Đang giao" | "Đã giao";
}

export type GroupCategory =
  | "stadium"
  | "item"
  | "suppoter"
  | "special energy"
  | "pokemon"
  | "tool"
  | "energy";

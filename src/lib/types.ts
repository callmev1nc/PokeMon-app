export interface Product {
  id: string;
  code: string;
  name: string;
  series: string;
  type: string;
  displayType: "Normal" | "Holo" | "Prize Card";
  group: string;
  price: number | null;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type DisplayType = "Normal" | "Holo" | "Prize Card";

export type SortOption = "price-asc" | "price-desc" | "stock-asc" | "name-asc";

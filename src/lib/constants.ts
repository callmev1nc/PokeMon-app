export const LOW_STOCK_THRESHOLD = 3;

export const DISPLAY_TYPES: Array<
  "Normal" | "Holo" | "Prize Card" | "EX" | "Holo Prize Card" | "EX Prize Card"
> = ["Normal", "Holo", "Prize Card", "EX", "Holo Prize Card", "EX Prize Card"];

export const TYPE_LABELS: Record<string, string> = {
  Normal: "Normal",
  Holo: "Holo",
  "Prize Card": "Prize Card",
  EX: "EX",
  "Holo Prize Card": "Holo Prize Card",
  "EX Prize Card": "EX Prize Card",
};

export const TYPE_COLORS: Record<string, string> = {
  Normal: "bg-gray-200 text-gray-800",
  Holo: "bg-blue-100 text-blue-800 border border-blue-300",
  "Prize Card": "bg-yellow-100 text-yellow-800 border border-yellow-400",
  EX: "bg-red-100 text-red-800 border border-red-300",
  "Holo Prize Card":
    "bg-purple-100 text-purple-800 border border-purple-300",
  "EX Prize Card":
    "bg-rose-100 text-rose-800 border border-rose-300",
};

export const FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL || "";
export const SHOP_NAME = process.env.NEXT_PUBLIC_SHOP_NAME || "";
export const SHOP_DESCRIPTION = process.env.NEXT_PUBLIC_SHOP_DESCRIPTION || "";

export const GROUP_CATEGORIES = [
  "stadium",
  "item",
  "suppoter",
  "special energy",
  "pokemon",
  "tool",
  "energy",
] as const;

export const GROUP_LABELS: Record<string, string> = {
  pokemon: "Pokemon",
  suppoter: "Supporter",
  item: "Item",
  tool: "Tool",
  stadium: "Stadium",
  "special energy": "Special Energy",
  energy: "Energy",
};

export const GROUP_COLORS: Record<string, string> = {
  stadium: "bg-purple-100 text-purple-800 border border-purple-300",
  item: "bg-green-100 text-green-800 border border-green-300",
  suppoter: "bg-orange-100 text-orange-800 border border-orange-300",
  "special energy": "bg-pink-100 text-pink-800 border border-pink-300",
  pokemon: "bg-red-100 text-red-800 border border-red-300",
  tool: "bg-cyan-100 text-cyan-800 border border-cyan-300",
  energy: "bg-yellow-100 text-yellow-800 border border-yellow-300",
};

export const PAYMENT_STATUSES = ["Chưa thanh toán", "Đã chuyển khoản", "Đã thanh toán"] as const;

export const DELIVERY_STATUSES = ["Chưa giao", "Đang giao", "Đã giao"] as const;

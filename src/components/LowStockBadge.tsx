import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

export default function LowStockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-700">
        Hết hàng
      </span>
    );
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-700">
        Còn ít!
      </span>
    );
  }
  return null;
}

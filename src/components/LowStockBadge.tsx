import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

export default function LowStockBadge({ stock }: { stock: number }) {
  const locale = useLocaleStore((s) => s.locale);

  if (stock === 0) {
    return (
      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-lg bg-red-50 text-red-600 border border-red-200 uppercase tracking-wide">
        {t("product.outOfStock", locale)}
      </span>
    );
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 badge-stock-low uppercase tracking-wide">
        {t("product.lowStock", locale)}
      </span>
    );
  }
  return null;
}

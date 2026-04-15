"use client";

import { useCartStore, getCartTotal } from "@/store/cartStore";

function formatPrice(price: number | null): string {
  if (price === null) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN").format(price * 1000) + " đ";
}

export default function CheckoutSummary() {
  const items = useCartStore((s) => s.items);
  const total = getCartTotal(items);

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">Giỏ hàng trống</p>
        <a
          href="/"
          className="inline-block mt-4 text-brand hover:underline text-sm font-medium"
        >
          Quay lại cửa hàng
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">
          Chi tiết đơn hàng <span className="text-slate-400 font-normal">({items.length} sản phẩm)</span>
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((item) => (
          <div key={item.product.id} className="px-5 py-3.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {item.product.name}
              </p>
              <p className="text-xs text-slate-400">
                {item.product.displayType} &middot; {item.product.series} &middot; <span className="font-mono">{item.product.code}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">
                {item.quantity} x {formatPrice(item.product.price)}
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {item.product.price !== null
                  ? new Intl.NumberFormat("vi-VN").format(
                      item.product.price * item.quantity * 1000
                    ) + " đ"
                  : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-600">Tổng cộng:</span>
          <span className="text-2xl font-bold text-brand">
            {new Intl.NumberFormat("vi-VN").format(total * 1000)} d
          </span>
        </div>
      </div>
    </div>
  );
}

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
        <p className="text-slate-500">Giỏ hàng trống</p>
        <a
          href="/"
          className="inline-block mt-4 text-blue-600 hover:underline text-sm"
        >
          Quay lại cửa hàng
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">
          Chi tiết đơn hàng ({items.length} sản phẩm)
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.product.id} className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {item.product.name}
              </p>
              <p className="text-xs text-slate-400">
                {item.product.displayType} · {item.product.series}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">
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
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">Tổng cộng:</span>
          <span className="text-2xl font-bold text-blue-600">
            {new Intl.NumberFormat("vi-VN").format(total * 1000)} đ
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import LowStockBadge from "./LowStockBadge";

function formatPrice(price: number | null): string {
  if (price === null) return "Liên hệ";
  // Price is in thousands VND
  return new Intl.NumberFormat("vi-VN").format(price * 1000) + " đ";
}

export default function ProductCard({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const cartItem = cartItems.find((i) => i.product.id === product.id);
  const inCart = cartItem?.quantity ?? 0;
  const maxQty = product.stock - inCart;
  const isOutOfStock = product.stock === 0;
  const noPrice = product.price === null;

  const handleAdd = () => {
    if (maxQty <= 0 || noPrice) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    setQty(1);
  };

  return (
    <div className="product-card bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
          <LowStockBadge stock={product.stock} />
        </div>

        {product.series && (
          <p className="text-xs text-slate-400">{product.series}</p>
        )}

        <div className="flex items-center gap-2">
          <span
            className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
              TYPE_COLORS[product.displayType] || "bg-slate-100 text-slate-600"
            } ${product.displayType === "Holo" ? "badge-holo" : ""}`}
          >
            {product.displayType}
          </span>
          <span className="text-xs text-slate-400 capitalize">{product.group}</span>
        </div>

        <div className="mt-auto pt-2">
          <p
            className={`text-lg font-bold ${
              noPrice ? "text-slate-400" : "text-slate-900"
            }`}
          >
            {formatPrice(product.price)}
          </p>
          <p className="text-xs text-slate-500">
            Còn lại: <span className="font-medium">{product.stock}</span>
            {inCart > 0 && (
              <span className="text-blue-600 ml-1">
                (Trong giỏ: {inCart})
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center gap-2">
        {!isOutOfStock && !noPrice && (
          <>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-2 py-1 text-slate-600 hover:bg-slate-100 text-sm font-medium"
              >
                -
              </button>
              <span className="px-3 py-1 text-sm font-medium min-w-[32px] text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty(Math.min(maxQty, qty + 1))}
                className="px-2 py-1 text-slate-600 hover:bg-slate-100 text-sm font-medium"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={maxQty <= 0}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                added
                  ? "bg-green-500 text-white"
                  : maxQty <= 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {added ? "Đã thêm ✓" : "Thêm vào giỏ"}
            </button>
          </>
        )}
        {isOutOfStock && (
          <button
            disabled
            className="w-full py-2 px-3 rounded-lg text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
          >
            Hết hàng
          </button>
        )}
        {noPrice && !isOutOfStock && (
          <button
            disabled
            className="w-full py-2 px-3 rounded-lg text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
          >
            Liên hệ để mua
          </button>
        )}
      </div>
    </div>
  );
}

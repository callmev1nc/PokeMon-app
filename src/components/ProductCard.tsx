"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import LowStockBadge from "./LowStockBadge";

function formatPrice(price: number | null): string {
  if (price === null) return "Lien he";
  return new Intl.NumberFormat("vi-VN").format(price * 1000) + " d";
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
    <div className="product-card bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
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
            className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
              TYPE_COLORS[product.displayType] || "bg-slate-100 text-slate-600"
            } ${product.displayType === "Holo" ? "badge-holo" : ""}`}
          >
            {product.displayType}
          </span>
          <span className="text-[11px] text-slate-400 capitalize font-medium">
            {product.group}
          </span>
        </div>

        <div className="mt-auto pt-3 border-t border-slate-50">
          <p
            className={`text-xl font-bold ${
              noPrice ? "text-slate-300" : "text-slate-900"
            }`}
          >
            {formatPrice(product.price)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Con lai: <span className="font-semibold text-slate-600">{product.stock}</span>
            {inCart > 0 && (
              <span className="text-brand ml-1 font-medium">
                (Trong gio: {inCart})
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center gap-2">
        {!isOutOfStock && !noPrice && (
          <>
            <div className="flex items-center bg-slate-50 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-sm font-bold transition-colors"
              >
                -
              </button>
              <span className="px-2 py-1.5 text-sm font-semibold min-w-[32px] text-center text-slate-700">
                {qty}
              </span>
              <button
                onClick={() => setQty(Math.min(maxQty, qty + 1))}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-sm font-bold transition-colors"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={maxQty <= 0}
              className={`btn-press flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                added
                  ? "bg-green-500 text-white shadow-green-200 shadow-md"
                  : maxQty <= 0
                  ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                  : "bg-brand text-white hover:bg-brand-dark shadow-red-200 shadow-md hover:shadow-lg"
              }`}
            >
              {added ? "Da them" : "Them vao gio"}
            </button>
          </>
        )}
        {isOutOfStock && (
          <button
            disabled
            className="w-full py-2 px-3 rounded-xl text-sm font-semibold bg-slate-50 text-slate-300 cursor-not-allowed"
          >
            Het hang
          </button>
        )}
        {noPrice && !isOutOfStock && (
          <button
            disabled
            className="w-full py-2 px-3 rounded-xl text-sm font-semibold bg-slate-50 text-slate-300 cursor-not-allowed"
          >
            Lien he de mua
          </button>
        )}
      </div>
    </div>
  );
}

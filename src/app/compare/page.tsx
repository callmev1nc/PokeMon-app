"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/lib/types";
import { useComparisonStore } from "@/store/comparisonStore";

function formatPrice(price: number | null): string {
  if (price === null) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN").format(price * 1000) + " đ";
}

export default function ComparePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const ids = useComparisonStore((s) => s.ids);
  const remove = useComparisonStore((s) => s.remove);
  const clear = useComparisonStore((s) => s.clear);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        setProducts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const compareProducts = products.filter((p) => ids.includes(p.id));

  const fields: { key: keyof Product; label: string; render: (p: Product) => string }[] = [
    { key: "name", label: "Tên sản phẩm", render: (p) => p.name },
    { key: "price", label: "Giá", render: (p) => formatPrice(p.price) },
    { key: "stock", label: "Tồn kho", render: (p) => String(p.stock) },
    { key: "type", label: "Loại", render: (p) => p.type },
    { key: "group", label: "Nhóm", render: (p) => p.group },
    { key: "series", label: "Series", render: (p) => p.series || "-" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">So sánh sản phẩm</h1>
        {compareProducts.length > 0 && (
          <button
            onClick={clear}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Đang tải...</p>
        </div>
      ) : compareProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <p className="text-slate-400 text-lg font-medium">Chưa chọn sản phẩm nào</p>
          <p className="text-slate-300 text-sm mt-1">
            Thêm sản phẩm vào danh sách so sánh từ trang cửa hàng
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-5 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors"
          >
            Xem sản phẩm
          </a>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">
                  Thuộc tính
                </th>
                {compareProducts.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {p.imageUrl && (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-20 h-20 object-contain rounded-lg"
                        />
                      )}
                      <button
                        onClick={() => remove(p.id)}
                        className="text-xs px-3 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 font-semibold transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.key} className="border-b border-slate-50 last:border-b-0">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-600 bg-slate-50/50">
                    {field.label}
                  </td>
                  {compareProducts.map((p) => (
                    <td
                      key={p.id}
                      className="px-4 py-3 text-sm text-slate-700 text-center"
                    >
                      {field.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <a href="/" className="text-sm text-blue-600 hover:underline">
          &larr; Quay lại cửa hàng
        </a>
      </div>
    </div>
  );
}

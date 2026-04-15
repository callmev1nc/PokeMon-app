"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/lib/types";

function formatPrice(price: number | null): string {
  if (price === null) return "—";
  return new Intl.NumberFormat("vi-VN").format(price * 1000) + " đ";
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editedProducts, setEditedProducts] = useState<
    Map<string, { price: number | null; stock: number }>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/sheets?action=products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        // Fallback to static JSON if Google Sheets not configured
        const fallback = await fetch("/api/products");
        const fallbackData = await fallback.json();
        setProducts(fallbackData);
      }
    } catch {
      const fallback = await fetch("/api/products");
      const fallbackData = await fallback.json();
      setProducts(fallbackData);
    } finally {
      setLoading(false);
    }
  }

  const handlePriceChange = (id: string, value: string) => {
    const num = value === "" ? null : Number(value);
    setEditedProducts((prev) => {
      const next = new Map(prev);
      const existing = next.get(id) || {
        price:
          products.find((p) => p.id === id)?.price ?? null,
        stock: products.find((p) => p.id === id)?.stock ?? 0,
      };
      next.set(id, { ...existing, price: num });
      return next;
    });
  };

  const handleStockChange = (id: string, value: string) => {
    const num = Number(value) || 0;
    setEditedProducts((prev) => {
      const next = new Map(prev);
      const existing = next.get(id) || {
        price:
          products.find((p) => p.id === id)?.price ?? null,
        stock: products.find((p) => p.id === id)?.stock ?? 0,
      };
      next.set(id, { ...existing, stock: num });
      return next;
    });
  };

  const handleFinishUpdate = async () => {
    setSaving(true);
    setMessage("");

    const updates = Array.from(editedProducts.entries()).map(([id, changes]) => {
      const product = products.find((p) => p.id === id);
      return {
        _row: product?._row,
        code: product?.code || "",
        type: product?.type || "",
        price: changes.price,
        stock: changes.stock,
      };
    });

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateProducts", products: updates }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Đã cập nhật ${data.updated} sản phẩm`);
        setEditedProducts(new Map());
        await fetchProducts();
      } else {
        setMessage("Lỗi: " + (data.error || "Không thể cập nhật"));
      }
    } catch {
      setMessage("Lỗi kết nối đến Google Sheets");
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.series.toLowerCase().includes(q)
    );
  });

  // Stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const withPrice = products.filter((p) => p.price !== null).length;
  const totalValue = products.reduce(
    (sum, p) => sum + (p.price ?? 0) * p.stock,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Quản lý sản phẩm
        </h1>
        <div className="flex gap-2">
          <a
            href="/admin/orders"
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            Đơn hàng
          </a>
          <a
            href="/admin/customers"
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
          >
            Khách hàng
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Tổng sản phẩm</p>
          <p className="text-2xl font-bold text-slate-800">{totalProducts}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Tổng tồn kho</p>
          <p className="text-2xl font-bold text-slate-800">{totalStock}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Có giá</p>
          <p className="text-2xl font-bold text-slate-800">
            {withPrice}/{totalProducts}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Tổng giá trị kho</p>
          <p className="text-2xl font-bold text-blue-600">
            {new Intl.NumberFormat("vi-VN").format(totalValue * 1000)} đ
          </p>
        </div>
      </div>

      {/* Search + Update button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {editedProducts.size > 0 && (
          <button
            onClick={handleFinishUpdate}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Đang lưu..." : `Finish Update (${editedProducts.size})`}
          </button>
        )}
      </div>

      {message && (
        <p
          className={`text-sm font-medium mb-4 px-3 py-2 rounded-lg ${
            message.startsWith("Lỗi")
              ? "text-red-600 bg-red-50"
              : "text-green-600 bg-green-50"
          }`}
        >
          {message}
        </p>
      )}

      {/* Product table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Đang tải sản phẩm...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-3 py-2 font-medium text-slate-600">
                    Mã
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">
                    Tên
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">
                    Nhóm
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">
                    Loại
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-slate-600">
                    Giá bán
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-slate-600">
                    Tồn kho
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((p) => {
                  const edited = editedProducts.get(p.id);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-slate-50 hover:bg-slate-50"
                    >
                      <td className="px-3 py-2 text-slate-500">{p.code}</td>
                      <td className="px-3 py-2 text-slate-800 font-medium max-w-[200px] truncate">
                        {p.name}
                      </td>
                      <td className="px-3 py-2 text-slate-600 capitalize text-xs">
                        {p.group}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            p.displayType === "Holo"
                              ? "bg-blue-100 text-blue-800"
                              : p.displayType === "Prize Card"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {p.displayType}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          defaultValue={edited?.price ?? p.price ?? ""}
                          placeholder="—"
                          onChange={(e) => handlePriceChange(p.id, e.target.value)}
                          className="w-24 px-2 py-1 border border-slate-200 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          defaultValue={edited?.stock ?? p.stock}
                          onChange={(e) => handleStockChange(p.id, e.target.value)}
                          className="w-20 px-2 py-1 border border-slate-200 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length > 100 && (
              <p className="text-center text-xs text-slate-400 py-2">
                Hiển thị 100/{filtered.length} sản phẩm
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <a
          href="/"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Quay lại cửa hàng
        </a>
      </div>
    </div>
  );
}

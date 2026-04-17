"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/lib/types";
import AdminNav from "@/components/AdminNav";

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
  const [showCount, setShowCount] = useState(100);

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
      <div className="mb-4">
        <a
          href="/"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Quay lại cửa hàng
        </a>
      </div>
      <AdminNav active="products" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Tổng sản phẩm</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalProducts}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Tổng tồn kho</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalStock}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Có giá</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {withPrice}/{totalProducts}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Tổng giá trị kho</p>
          <p className="text-2xl font-bold text-brand mt-1">
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
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
        />
        {editedProducts.size > 0 && (
          <button
            onClick={handleFinishUpdate}
            disabled={saving}
            className="btn-press px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-md shadow-green-200"
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Ma
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Ten
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Nhom
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Loai
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Gia ban
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Ton kho
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, showCount).map((p) => {
                  const edited = editedProducts.get(p.id);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-slate-50 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">{p.code}</td>
                      <td className="px-4 py-3 text-slate-800 font-medium max-w-[200px] truncate">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500 capitalize text-xs font-medium">
                        {p.group}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            p.displayType === "Holo"
                              ? "bg-blue-100 text-blue-800"
                              : p.displayType === "Prize Card"
                              ? "bg-yellow-100 text-yellow-800"
                              : p.displayType === "EX"
                              ? "bg-red-100 text-red-800"
                              : p.displayType === "Holo Prize Card"
                              ? "bg-purple-100 text-purple-800"
                              : p.displayType === "EX Prize Card"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {p.displayType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          defaultValue={edited?.price ?? p.price ?? ""}
                          placeholder="—"
                          onChange={(e) => handlePriceChange(p.id, e.target.value)}
                          className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          defaultValue={edited?.stock ?? p.stock}
                          onChange={(e) => handleStockChange(p.id, e.target.value)}
                          className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length > showCount && (
              <div className="text-center py-3">
                <p className="text-xs text-slate-400 mb-2">
                  Hiển thị {showCount}/{filtered.length} sản phẩm
                </p>
                <button
                  onClick={() => setShowCount((c) => c + 100)}
                  className="px-5 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  Hiển thị thêm
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

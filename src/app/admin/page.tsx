"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Product } from "@/lib/types";
import AdminNav from "@/components/AdminNav";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

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
  const debouncedSearch = useDebounce(search, 300);
  const [showCount, setShowCount] = useState(50);
  const [showAddForm, setShowAddForm] = useState(false);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [newProduct, setNewProduct] = useState({
    code: "",
    group: "pokemon",
    name: "",
    series: "",
    type: "normal",
    price: "",
    stock: 1,
  });
  const [addingProduct, setAddingProduct] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [batchPrice, setBatchPrice] = useState("");
  const [batchStock, setBatchStock] = useState("");

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setMessage("");

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      setMessage("Lỗi: File CSV trống hoặc không hợp lệ");
      setImporting(false);
      return;
    }

    const rows = lines.slice(1).map((line) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === "," && !inQuotes) { result.push(current); current = ""; }
        else { current += ch; }
      }
      result.push(current);
      return result;
    });

    try {
      const res = await fetch("/api/import-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Đã nhập ${data.added} sản phẩm mới (${data.skipped} bị bỏ qua)`);
        await fetchProducts();
      } else {
        setMessage("Lỗi: " + data.error);
      }
    } catch {
      setMessage("Lỗi: Không thể nhập file");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

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
        setProducts(Array.isArray(fallbackData) ? fallbackData : fallbackData?.data || []);
      }
    } catch {
      const fallback = await fetch("/api/products");
      const fallbackData = await fallback.json();
      setProducts(Array.isArray(fallbackData) ? fallbackData : fallbackData?.data || []);
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

  const handleAddProduct = async () => {
    if (!newProduct.code || !newProduct.name) {
      setMessage("Lỗi: Mã và tên sản phẩm là bắt buộc");
      return;
    }
    setAddingProduct(true);
    setMessage("");
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addProduct",
          product: {
            code: newProduct.code.trim(),
            group: newProduct.group.trim().toLowerCase(),
            name: newProduct.name.trim(),
            series: newProduct.series.trim(),
            type: newProduct.type.trim().toLowerCase(),
            price: newProduct.price === "" ? null : Number(newProduct.price),
            stock: Number(newProduct.stock) || 0,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Đã thêm sản phẩm mới");
        setNewProduct({
          code: "",
          group: "pokemon",
          name: "",
          series: "",
          type: "normal",
          price: "",
          stock: 1,
        });
        setShowAddForm(false);
        await fetchProducts();
      } else {
        setMessage("Lỗi: " + (data.error || "Không thể thêm"));
      }
    } catch {
      setMessage("Lỗi kết nối đến Google Sheets");
    } finally {
      setAddingProduct(false);
    }
  };

  const filtered = products.filter((p) => {
    if (!debouncedSearch.trim()) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.series.toLowerCase().includes(q)
    );
  });

  const stockFiltered = filtered.filter((p) => {
    if (stockFilter === "low") return p.stock > 0 && p.stock <= 3;
    if (stockFilter === "out") return p.stock === 0;
    return true;
  });

  const handleBatchApply = () => {
    if (selectedProducts.size === 0) return;
    const priceVal = batchPrice === "" ? undefined : Number(batchPrice);
    const stockVal = batchStock === "" ? undefined : Number(batchStock);

    for (const id of selectedProducts) {
      const existing = editedProducts.get(id) || (() => {
        const p = products.find((pr) => pr.id === id);
        return { price: p?.price ?? null, stock: p?.stock ?? 0 };
      })();
      editedProducts.set(id, {
        price: priceVal !== undefined ? priceVal : existing.price,
        stock: stockVal !== undefined ? stockVal : existing.stock,
      });
    }
    setEditedProducts(new Map(editedProducts));
    setBatchPrice("");
    setBatchStock("");
    setMessage(`Đã áp dụng cho ${selectedProducts.size} sản phẩm. Nhấn Finish Update để lưu.`);
  };

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

      {/* Search + Update button + Add button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
        />
        <div className="flex gap-1.5">
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStockFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                stockFilter === f
                  ? f === "out"
                    ? "bg-red-500 text-white"
                    : f === "low"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-800 text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f === "all" ? `Tất cả (${filtered.length})` : f === "low" ? `Còn ít (${filtered.filter(p => p.stock > 0 && p.stock <= 3).length})` : `Hết hàng (${filtered.filter(p => p.stock === 0).length})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-press px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
        >
          + Thêm sản phẩm
        </button>
        <a
          href="/api/export-products"
          className="btn-press px-4 py-2.5 bg-slate-600 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors text-center"
        >
          Xuất CSV
        </a>
        <label className={`btn-press px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors cursor-pointer ${importing ? "opacity-50" : ""}`}>
          {importing ? "Đang nhập..." : "Nhập CSV"}
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
        </label>
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

      {/* Add Product Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Thêm sản phẩm mới</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Mã hàng (VD: PC-PO-100)"
              value={newProduct.code}
              onChange={(e) => setNewProduct((p) => ({ ...p, code: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <input
              type="text"
              placeholder="Tên sản phẩm"
              value={newProduct.name}
              onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <select
              value={newProduct.group}
              onChange={(e) => setNewProduct((p) => ({ ...p, group: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="pokemon">Pokemon</option>
              <option value="item">Item</option>
              <option value="tool">Tool</option>
              <option value="stadium">Stadium</option>
              <option value="suppoter">Supporter</option>
              <option value="energy">Energy</option>
              <option value="special energy">Special Energy</option>
            </select>
            <input
              type="text"
              placeholder="Số seri (VD: TWM 080/167)"
              value={newProduct.series}
              onChange={(e) => setNewProduct((p) => ({ ...p, series: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <select
              value={newProduct.type}
              onChange={(e) => setNewProduct((p) => ({ ...p, type: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="normal">Normal</option>
              <option value="holo">Holo</option>
              <option value="prize card">Prize Card</option>
              <option value="ex">EX</option>
              <option value="holo prize card">Holo Prize Card</option>
              <option value="ex prize card">EX Prize Card</option>
            </select>
            <input
              type="number"
              placeholder="Giá bán"
              value={newProduct.price}
              onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <input
              type="number"
              placeholder="Tồn kho"
              value={newProduct.stock}
              onChange={(e) => setNewProduct((p) => ({ ...p, stock: Number(e.target.value) || 0 }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAddProduct}
              disabled={addingProduct}
              className="px-5 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {addingProduct ? "Đang thêm..." : "Thêm"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

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

      {/* Batch Edit Bar */}
      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-blue-700">
            Đã chọn {selectedProducts.size} sản phẩm
          </span>
          <input
            type="number"
            placeholder="Giá mới"
            value={batchPrice}
            onChange={(e) => setBatchPrice(e.target.value)}
            className="px-3 py-2 border border-blue-200 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
          />
          <input
            type="number"
            placeholder="Tồn kho mới"
            value={batchStock}
            onChange={(e) => setBatchStock(e.target.value)}
            className="px-3 py-2 border border-blue-200 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
          />
          <button
            onClick={handleBatchApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Áp dụng
          </button>
          <button
            onClick={() => setSelectedProducts(new Set())}
            className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Bỏ chọn
          </button>
        </div>
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
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox"
                      checked={selectedProducts.size === stockFiltered.length && stockFiltered.length > 0}
                      onChange={() => {
                        if (selectedProducts.size === stockFiltered.length) setSelectedProducts(new Set());
                        else setSelectedProducts(new Set(stockFiltered.map(p => p.id)));
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide w-10">
                    Ảnh
                  </th>
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
                {stockFiltered.slice(0, showCount).map((p) => {
                  const edited = editedProducts.get(p.id);
                  const isLow = p.stock > 0 && p.stock <= 3;
                  const isOut = p.stock === 0;
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-50 hover:bg-slate-50 ${isOut ? "bg-red-50/50" : isLow ? "bg-orange-50/50" : ""} ${selectedProducts.has(p.id) ? "bg-blue-50/50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input type="checkbox"
                          checked={selectedProducts.has(p.id)}
                          onChange={() => {
                            const next = new Set(selectedProducts);
                            if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                            setSelectedProducts(next);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="w-10 h-14 object-contain rounded-lg bg-slate-50" />
                        ) : (
                          <div className="w-10 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-300 font-bold">
                            {p.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">{p.code}</td>
                      <td className="px-4 py-3 text-slate-800 font-medium max-w-[200px] truncate">
                        {p.name}
                        {isOut && <span className="ml-2 text-[10px] font-semibold text-red-500 bg-red-100 px-1.5 py-0.5 rounded">HẾT</span>}
                        {isLow && <span className="ml-2 text-[10px] font-semibold text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded">ÍT</span>}
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
            {stockFiltered.length > showCount && (
              <div className="text-center py-3">
                <p className="text-xs text-slate-400 mb-2">
                  Hiển thị {showCount}/{stockFiltered.length} sản phẩm
                </p>
                <button
                  onClick={() => setShowCount((c) => c + 50)}
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

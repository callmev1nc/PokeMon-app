"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";

function mapDisplayType(rawType: string): "Normal" | "Holo" | "Prize Card" {
  const t = rawType.toLowerCase().trim();
  if (t === "holo") return "Holo";
  if (t.includes("prize") || t.includes("ex")) return "Prize Card";
  return "Normal";
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage("");

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });

      if (rawData.length < 3) {
        setMessage("File không có đủ dữ liệu");
        setLoading(false);
        return;
      }

      const parsed: Product[] = [];
      for (let i = 2; i < rawData.length; i++) {
        const row = rawData[i];
        const code = String(row[0] || "").trim();
        const name = String(row[2] || "").trim();
        const series = String(row[3] || "").trim();
        const rawType = String(row[4] || "").trim().toLowerCase();
        const group = String(row[1] || "").trim().toLowerCase();
        const price = row[6] ? Number(row[6]) : null;
        const stock = row[10] ? Math.round(Number(row[10])) : 0;

        if (!code || !name) continue;

        const displayType = mapDisplayType(rawType);
        const typeSlug = rawType.replace(/\s+/g, "-");

        parsed.push({
          id: `${code}-${typeSlug}`,
          code,
          name,
          series,
          type: rawType,
          displayType,
          group,
          price: price !== null && !isNaN(price) ? price : null,
          stock,
        });
      }

      setProducts(parsed);
      setMessage(`Đã đọc ${parsed.length} sản phẩm từ file`);
    } catch (err) {
      setMessage("Lỗi đọc file: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Quản lý sản phẩm
      </h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-3">
          Tải lên file Excel mới
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Tải lên file .xlsx để cập nhật danh sách sản phẩm. File phải có cùng
          cấu trúc với file stock hiện tại.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          disabled={loading}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
        />
        {message && (
          <p className="mt-3 text-sm font-medium text-blue-600">{message}</p>
        )}
      </div>

      {products.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">
              Xem trước: {products.length} sản phẩm
            </p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Tải xuống JSON
            </button>
          </div>
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
                      Loại
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">
                      Giá
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">
                      Tồn kho
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 50).map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-50 hover:bg-slate-50"
                    >
                      <td className="px-3 py-2 text-slate-500">{p.code}</td>
                      <td className="px-3 py-2 text-slate-800 font-medium">
                        {p.name}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {p.displayType}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {p.price !== null
                          ? new Intl.NumberFormat("vi-VN").format(
                              p.price * 1000
                            ) + " đ"
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {p.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length > 50 && (
                <p className="text-center text-xs text-slate-400 py-2">
                  Hiển thị 50/{products.length} sản phẩm
                </p>
              )}
            </div>
          </div>
        </>
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

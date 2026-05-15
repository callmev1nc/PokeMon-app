"use client";

import { useState, useEffect, useRef } from "react";
import AdminNav from "@/components/AdminNav";
import QRCode from "qrcode";

interface Product {
  code: string;
  name: string;
  displayType: string;
  group: string;
  stock: number;
}

export default function QRPrintPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch("/api/sheets?action=products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const groups = ["all", ...new Set(products.map((p) => p.group))];
  const exactCodeMatch = search.trim() ? products.find((p) => p.code.toUpperCase() === search.trim().toUpperCase()) : null;
  const filtered = products.filter((p) => {
    if (filter !== "all" && p.group !== filter) return false;
    if (!search) return true;
    if (exactCodeMatch) return p.code === exactCodeMatch.code;
    return p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
  });

  const generateAllQR = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cols = 4;
    const qrSize = 120;
    const padding = 20;
    const labelHeight = 40;
    const cellW = qrSize + padding * 2;
    const cellH = qrSize + labelHeight + padding;
    const rows = Math.ceil(filtered.length / cols);

    canvas.width = cols * cellW;
    canvas.height = rows * cellH;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < filtered.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellW + padding;
      const y = row * cellH + padding;
      const p = filtered[i];

      try {
        const qrDataUrl = await QRCode.toDataURL(p.code, { width: qrSize, margin: 1 });
        const img = new Image();
        img.src = qrDataUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, x, y, qrSize, qrSize);
            resolve();
          };
        });
      } catch {
        ctx.fillStyle = "#fee";
        ctx.fillRect(x, y, qrSize, qrSize);
      }

      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(p.code, x + qrSize / 2, y + qrSize + 16);
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "#64748b";
      const name = p.name.length > 20 ? p.name.slice(0, 18) + ".." : p.name;
      ctx.fillText(name, x + qrSize / 2, y + qrSize + 30);
    }

    // Open print window
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<html><head><title>QR Codes</title><style>@media print { @page { margin: 10mm; } }</style></head><body style="margin:0;display:flex;justify-content:center;"><img src="${dataUrl}" style="max-width:100%;height:auto;"></body></html>`);
      win.document.close();
      win.onload = () => win.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdminNav active="products" />

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">QR Codes - In mã sản phẩm</h2>
              <p className="text-sm text-slate-500">{filtered.length} sản phẩm</p>
            </div>
            <button
              onClick={generateAllQR}
              disabled={filtered.length === 0}
              className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              In QR Codes ({filtered.length})
            </button>
          </div>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã..."
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm flex-1 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-400"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-200"
            >
              {groups.map((g) => (
                <option key={g} value={g}>{g === "all" ? "Tất cả nhóm" : g}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-center py-10 text-slate-400">Đang tải...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filtered.map((p) => (
                <QRCard key={p.code} product={p} />
              ))}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

function QRCard({ product }: { product: Product }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    QRCode.toCanvas(canvasRef.current!, product.code, {
      width: 100,
      margin: 1,
      color: { dark: "#1e293b" },
    });
  }, [product.code]);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col items-center bg-white dark:bg-slate-800/50">
      <canvas ref={canvasRef} />
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 font-mono">{product.code}</p>
      <p className="text-[10px] text-slate-500 text-center truncate w-full">{product.name}</p>
      <span className="text-[10px] text-slate-400 mt-0.5">{product.displayType}</span>
    </div>
  );
}

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
  const [pdfLoading, setPdfLoading] = useState(false);

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

  const handlePrint = async () => {
    const qrPerRow = 3;
    const qrSizePx = 200;
    const labelHeight = 50;
    const padding = 10;
    const cellW = qrSizePx + padding * 2;
    const cellH = qrSizePx + labelHeight + padding;

    // A6: 105 × 148 mm — render one page at a time
    const pageW = 105;
    const pageH = 148;
    const margin = 4;
    const usableW = pageW - margin * 2;
    const scale = usableW / (qrPerRow * cellW);
    const itemsPerPage = qrPerRow; // 1 row x 3 QR per A6 page

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`<html><head><title>QR Codes A6</title><style>
      @page { size: ${pageW}mm ${pageH}mm; margin: ${margin}mm; }
      body { margin: 0; }
      .page { page-break-after: always; display: flex; justify-content: center; align-items: flex-start; }
      .page:last-child { page-break-after: auto; }
    </style></head><body>`);

    for (let start = 0; start < filtered.length; start += itemsPerPage) {
      const pageItems = filtered.slice(start, start + itemsPerPage);
      const pageRows = Math.ceil(pageItems.length / qrPerRow);
      const canvasW = qrPerRow * cellW;
      const canvasH = pageRows * cellH;

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < pageItems.length; i++) {
        const col = i % qrPerRow;
        const row = Math.floor(i / qrPerRow);
        const x = col * cellW + padding;
        const y = row * cellH + padding;
        const p = pageItems[i];

        try {
          const qrDataUrl = await QRCode.toDataURL(p.code, { width: qrSizePx, margin: 1 });
          const img = new Image();
          img.src = qrDataUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, x, y, qrSizePx, qrSizePx);
              resolve();
            };
          });
        } catch {
          ctx.fillStyle = "#fee";
          ctx.fillRect(x, y, qrSizePx, qrSizePx);
        }

        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(p.code, x + qrSizePx / 2, y + qrSizePx + 20);
        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#64748b";
        const name = p.name.length > 22 ? p.name.slice(0, 20) + ".." : p.name;
        ctx.fillText(name, x + qrSizePx / 2, y + qrSizePx + 38);
      }

      win.document.write(`<div class="page"><img src="${canvas.toDataURL("image/png")}" style="width:${canvasW * scale}mm;height:${canvasH * scale}mm;"></div>`);
    }

    win.document.write("</body></html>");
    win.document.close();
    win.onload = () => win.print();
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");

      const qrPerRow = 3;
      const qrSizePx = 200;
      const labelHeight = 50;
      const padding = 10;
      const cellW = qrSizePx + padding * 2;
      const cellH = qrSizePx + labelHeight + padding;

      // A6: 105 × 148 mm
      const pageW = 105;
      const pageH = 148;
      const margin = 4;
      const usableW = pageW - margin * 2;

      const canvasW = qrPerRow * cellW;
      const scale = usableW / canvasW;
      const itemsPerPage = qrPerRow; // 1 row x 3 QR per A6 page

      const doc = new jsPDF({ unit: "mm", format: [pageW, pageH], orientation: "portrait" });

      for (let start = 0; start < filtered.length; start += itemsPerPage) {
        const pageItems = filtered.slice(start, start + itemsPerPage);
        const pageRows = Math.ceil(pageItems.length / qrPerRow);
        const canvasH = pageRows * cellH;

        const canvas = document.createElement("canvas");
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < pageItems.length; i++) {
          const col = i % qrPerRow;
          const row = Math.floor(i / qrPerRow);
          const x = col * cellW + padding;
          const y = row * cellH + padding;
          const p = pageItems[i];

          try {
            const qrDataUrl = await QRCode.toDataURL(p.code, { width: qrSizePx, margin: 1 });
            const img = new Image();
            img.src = qrDataUrl;
            await new Promise<void>((resolve) => {
              img.onload = () => {
                ctx.drawImage(img, x, y, qrSizePx, qrSizePx);
                resolve();
              };
            });
          } catch {
            ctx.fillStyle = "#fee";
            ctx.fillRect(x, y, qrSizePx, qrSizePx);
          }

          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 14px monospace";
          ctx.textAlign = "center";
          ctx.fillText(p.code, x + qrSizePx / 2, y + qrSizePx + 20);
          ctx.font = "12px sans-serif";
          ctx.fillStyle = "#64748b";
          const name = p.name.length > 22 ? p.name.slice(0, 20) + ".." : p.name;
          ctx.fillText(name, x + qrSizePx / 2, y + qrSizePx + 38);
        }

        if (start > 0) doc.addPage();
        doc.addImage(canvas.toDataURL("image/PNG"), "PNG", margin, margin, canvasW * scale, canvasH * scale);
      }

      doc.save(`qr-codes-A6-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setPdfLoading(false);
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
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                disabled={filtered.length === 0}
                className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🖨️ In QR Codes ({filtered.length})
              </button>
              <button
                onClick={downloadPDF}
                disabled={filtered.length === 0 || pdfLoading}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfLoading ? "Đang tạo PDF..." : "📄 Tải PDF"}
              </button>
            </div>
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

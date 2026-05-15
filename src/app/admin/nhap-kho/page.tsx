"use client";

import { useState, useEffect, useRef } from "react";
import AdminNav from "@/components/AdminNav";
import { Html5Qrcode } from "html5-qrcode";

interface Product {
  code: string;
  name: string;
  series: string;
  type: string;
  displayType: string;
  stock: number;
}

interface NhapLog {
  code: string;
  name: string;
  series: string;
  type: string;
  qty: number;
  time: string;
}

export default function NhapKhoPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [variantQty, setVariantQty] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<NhapLog[]>([]);
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    fetch("/api/sheets?action=products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (Array.isArray(data)) setAllProducts(data);
      });
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
        scannerRef.current = null;
      }
    };
  }, []);

  const activeCode = scannedCode || manualCode.trim();
  const matchedVariants = activeCode
    ? allProducts.filter((p) => p.code === activeCode)
    : [];

  const startScan = async () => {
    setError("");
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScannedCode(decodedText.trim());
          scanner.stop();
          setScanning(false);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setError("Không thể mở camera. Kiểm tra quyền truy cập camera.");
    }
  };

  const stopScan = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const variantKey = (v: Product) => `${v.series}|${v.type}`;

  const handleNhapOne = async (variant: Product) => {
    const key = variantKey(variant);
    const numQty = parseInt(variantQty[key] || "", 10);
    if (!numQty || numQty <= 0) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "nhapKho",
          code: variant.code,
          quantity: numQty,
          series: variant.series,
          type: variant.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Lỗi nhập kho");
        return;
      }

      setLogs((prev) => [
        { code: variant.code, name: variant.name, series: variant.series, type: variant.displayType, qty: numQty, time: new Date().toLocaleTimeString("vi-VN") },
        ...prev,
      ]);

      setVariantQty((prev) => ({ ...prev, [key]: "" }));
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const resetCode = () => {
    setScannedCode("");
    setManualCode("");
    setVariantQty({});
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AdminNav active="products" />

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">QR Nhập Kho</h2>
            <p className="text-sm text-slate-500">Quét mã QR sản phẩm hoặc nhập mã thủ công</p>
          </div>

          {/* Scanner */}
          <div className="space-y-3">
            <div className="w-full rounded-xl overflow-hidden bg-black min-h-[200px] relative">
              <div id="qr-reader" />
              {!scanning && (
                <div className="absolute inset-0 z-10 bg-slate-100 dark:bg-slate-700 flex items-center justify-center rounded-xl">
                  <div className="text-center text-slate-400 dark:text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                    </svg>
                    <p className="text-sm font-medium">Nhấn &quot;Quét QR Code&quot; để bắt đầu</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!scanning ? (
                <button onClick={startScan} className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600">
                  Quét QR Code
                </button>
              ) : (
                <button onClick={stopScan} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                  Dừng quét
                </button>
              )}
              {activeCode && (
                <button onClick={resetCode} className="px-4 py-3 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-500">
                  Xóa mã
                </button>
              )}
            </div>

            <div className="text-center text-xs text-slate-400">— hoặc nhập mã thủ công —</div>

            <input
              type="text"
              value={manualCode || scannedCode}
              onChange={(e) => { setManualCode(e.target.value.toUpperCase()); setScannedCode(""); }}
              placeholder="Nhập mã sản phẩm (VD: PO-P-01)"
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-center font-mono uppercase text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>

          {/* No match */}
          {activeCode && matchedVariants.length === 0 && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
              Không tìm thấy sản phẩm với mã &quot;{activeCode}&quot;
            </div>
          )}

          {/* Single variant — simple view */}
          {matchedVariants.length === 1 && (() => {
            const v = matchedVariants[0];
            const key = variantKey(v);
            return (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{v.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{v.code} · {v.series} · {v.displayType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Tồn kho</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{v.stock}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={variantQty[key] || ""}
                    onChange={(e) => setVariantQty((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="Số lượng nhập"
                    min={1}
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-center text-lg font-bold text-slate-800 dark:text-slate-200"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleNhapOne(v); }}
                  />
                  <button
                    onClick={() => handleNhapOne(v)}
                    disabled={submitting || !variantQty[key] || parseInt(variantQty[key] || "0") <= 0}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "..." : "Nhập kho"}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Multiple variants — list with individual qty inputs */}
          {matchedVariants.length > 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {matchedVariants[0]?.name} ({activeCode})
                  <span className="ml-2 text-xs font-normal text-slate-500">{matchedVariants.length} biến thể</span>
                </p>
              </div>
              <div className="space-y-2">
                {matchedVariants.map((v) => {
                  const key = variantKey(v);
                  return (
                    <div key={key} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                            {v.series}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${v.displayType === "Holo" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" : "bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"}`}>
                            {v.displayType}
                          </span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="text-xs text-slate-500">Tồn: </span>
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{v.stock}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={variantQty[key] || ""}
                          onChange={(e) => setVariantQty((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder="Số lượng"
                          min={1}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-center font-bold text-slate-800 dark:text-slate-200"
                          onKeyDown={(e) => { if (e.key === "Enter") handleNhapOne(v); }}
                        />
                        <button
                          onClick={() => handleNhapOne(v)}
                          disabled={submitting || !variantQty[key] || parseInt(variantQty[key] || "0") <= 0}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? "..." : "Nhập"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Log */}
          {logs.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Lịch sử nhập kho ({logs.length})</h3>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-lg px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-green-700 dark:text-green-400">{log.code}</span>
                      <span className="text-slate-600 dark:text-slate-300 ml-2">{log.name}</span>
                      <span className="text-xs text-slate-400 ml-1">({log.series} · {log.type})</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-green-700 dark:text-green-400">+{log.qty}</span>
                      <span className="text-xs text-slate-400">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [justEntered, setJustEntered] = useState<string | null>(null);
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
    } catch {
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

      setJustEntered(key);
      setTimeout(() => setJustEntered(null), 1200);
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

  const totalImported = logs.reduce((sum, l) => sum + l.qty, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AdminNav active="nhap-kho" />

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", letterSpacing: "0.02em" }}>
            NHẬP KHO
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Quét QR hoặc nhập mã sản phẩm để cập nhật tồn kho
          </p>
        </div>

        <div className="space-y-4">

          {/* QR Scanner Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {/* Scanner viewport */}
            <div className="relative" style={{ minHeight: 180 }}>
              <div id="qr-reader" />
              {!scanning && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, var(--bg-sunken), var(--bg-surface-alt))",
                  }}
                >
                  <div className="text-center">
                    <div className="relative mx-auto w-16 h-16 mb-3">
                      <div
                        className="absolute inset-0 rounded-2xl rotate-3"
                        style={{ background: "linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))", opacity: 0.15 }}
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-8 h-8 absolute top-4 left-4"
                        fill="none" viewBox="0 0 24 24"
                        strokeWidth={1.5} stroke="currentColor"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      Nhấn nút bên dưới để quét mã
                    </p>
                  </div>
                </div>
              )}
              {/* Scan line animation */}
              {scanning && (
                <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none overflow-hidden z-20">
                  <div className="absolute inset-x-0 h-0.5 animate-scan-line" style={{ background: "linear-gradient(90deg, transparent, var(--color-brand), transparent)" }} />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 space-y-3">
              <div className="flex gap-2.5">
                {!scanning ? (
                  <button
                    onClick={startScan}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))",
                      color: "#fff",
                      boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
                      Quét QR Code
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={stopScan}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all active:scale-[0.98]"
                  >
                    Dừng quét
                  </button>
                )}
                {activeCode && (
                  <button
                    onClick={resetCode}
                    className="px-5 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                    style={{
                      background: "var(--bg-sunken)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>hoặc nhập tay</span>
                <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
              </div>

              {/* Manual input */}
              <div className="relative">
                <input
                  type="text"
                  value={manualCode || scannedCode}
                  onChange={(e) => { setManualCode(e.target.value.toUpperCase()); setScannedCode(""); }}
                  placeholder="VD: PO-P-01"
                  className="w-full px-4 py-3 rounded-xl text-sm text-center font-mono uppercase transition-all focus:outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1.5px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.12)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
              style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              {error}
            </div>
          )}

          {/* No match */}
          {activeCode && matchedVariants.length === 0 && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
              style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              Không tìm thấy sản phẩm &ldquo;<span style={{ fontFamily: "var(--font-mono)" }}>{activeCode}</span>&rdquo;
            </div>
          )}

          {/* Single variant */}
          {matchedVariants.length === 1 && (() => {
            const v = matchedVariants[0];
            const key = variantKey(v);
            const isEntered = justEntered === key;
            return (
              <div
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: "var(--card-bg)",
                  border: isEntered ? "1.5px solid var(--color-brand)" : "1px solid var(--card-border)",
                  boxShadow: isEntered ? "0 0 24px rgba(245,158,11,0.15)" : "var(--shadow-card)",
                }}
              >
                {/* Product header */}
                <div
                  className="px-5 py-4"
                  style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-base leading-tight" style={{ color: "var(--text-primary)" }}>{v.name}</p>
                      <p className="mt-1 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        {v.code}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tồn kho</p>
                      <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-brand)" }}>
                        {v.stock}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
                      style={{ background: "rgba(59,130,246,0.1)", color: "#2563EB" }}
                    >
                      {v.series}
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
                      style={{
                        background: v.displayType === "Holo" ? "rgba(168,85,247,0.1)" : "rgba(100,116,139,0.1)",
                        color: v.displayType === "Holo" ? "#7C3AED" : "#64748B",
                      }}
                    >
                      {v.displayType}
                    </span>
                  </div>
                </div>

                {/* Input row */}
                <div className="px-5 py-4 flex gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={variantQty[key] || ""}
                      onChange={(e) => setVariantQty((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder="0"
                      min={1}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleNhapOne(v); }}
                      className="w-full px-4 py-3 rounded-xl text-center text-lg font-bold transition-all focus:outline-none"
                      style={{
                        background: "var(--bg-input)",
                        border: "1.5px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.12)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                  <button
                    onClick={() => handleNhapOne(v)}
                    disabled={submitting || !variantQty[key] || parseInt(variantQty[key] || "0") <= 0}
                    className="px-7 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] disabled:active:scale-100"
                    style={{
                      background: submitting ? "var(--bg-sunken)" : "linear-gradient(135deg, #16A34A, #15803D)",
                      color: "#fff",
                      boxShadow: "0 4px 14px rgba(22,163,74,0.25)",
                      opacity: submitting || !variantQty[key] || parseInt(variantQty[key] || "0") <= 0 ? 0.5 : 1,
                      cursor: submitting || !variantQty[key] || parseInt(variantQty[key] || "0") <= 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    {isEntered ? "✓ Xong" : submitting ? "..." : "Nhập kho"}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Multiple variants */}
          {matchedVariants.length > 1 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="min-w-0">
                  <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                    {matchedVariants[0]?.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    {activeCode} · {matchedVariants.length} biến thể
                  </p>
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {matchedVariants.map((v) => {
                  const key = variantKey(v);
                  const isEntered = justEntered === key;
                  return (
                    <div
                      key={key}
                      className="px-5 py-3.5 flex items-center gap-3 transition-all"
                      style={{
                        background: isEntered ? "rgba(245,158,11,0.04)" : "transparent",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: "rgba(59,130,246,0.1)", color: "#2563EB" }}
                          >
                            {v.series}
                          </span>
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              background: v.displayType === "Holo" ? "rgba(168,85,247,0.1)" : "rgba(100,116,139,0.1)",
                              color: v.displayType === "Holo" ? "#7C3AED" : "#64748B",
                            }}
                          >
                            {v.displayType}
                          </span>
                          <span className="text-xs font-bold ml-1" style={{ color: "var(--color-brand)" }}>
                            {v.stock}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          value={variantQty[key] || ""}
                          onChange={(e) => setVariantQty((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder="SL"
                          min={1}
                          onKeyDown={(e) => { if (e.key === "Enter") handleNhapOne(v); }}
                          className="w-20 px-2.5 py-2 rounded-lg text-center text-sm font-bold transition-all focus:outline-none"
                          style={{
                            background: "var(--bg-input)",
                            border: "1.5px solid var(--border-subtle)",
                            color: "var(--text-primary)",
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.12)"; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}
                        />
                        <button
                          onClick={() => handleNhapOne(v)}
                          disabled={submitting || !variantQty[key] || parseInt(variantQty[key] || "0") <= 0}
                          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] disabled:active:scale-100"
                          style={{
                            background: isEntered ? "var(--color-brand)" : "#16A34A",
                            color: "#fff",
                            opacity: submitting || !variantQty[key] || parseInt(variantQty[key] || "0") <= 0 ? 0.5 : 1,
                            cursor: submitting || !variantQty[key] || parseInt(variantQty[key] || "0") <= 0 ? "not-allowed" : "pointer",
                          }}
                        >
                          {isEntered ? "✓" : submitting ? "..." : "Nhập"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Import Log */}
          {logs.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Lịch sử nhập</h3>
                  <span
                    className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: "rgba(245,158,11,0.12)", color: "var(--color-brand)" }}
                  >
                    {logs.length}
                  </span>
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  +{totalImported} tổng
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className="px-5 py-3 flex items-center justify-between"
                    style={{
                      background: i === 0 ? "rgba(245,158,11,0.03)" : "transparent",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{log.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        {log.code} · {log.series} · {log.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span
                        className="text-sm font-bold px-2.5 py-0.5 rounded-lg"
                        style={{ background: "rgba(22,163,74,0.08)", color: "#16A34A" }}
                      >
                        +{log.qty}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0% { top: 0%; }
          50% { top: 90%; }
          100% { top: 0%; }
        }
        .animate-scan-line {
          animation: scan-line 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

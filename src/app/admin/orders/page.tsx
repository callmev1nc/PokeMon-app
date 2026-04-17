"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/lib/types";
import AdminNav from "@/components/AdminNav";
import jsPDF from "jspdf";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");
  const [editValues, setEditValues] = useState<
    Record<number, { buyPrice: string; shippingCost: string }>
  >({});

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/sheets?action=orders");
      const data = await res.json();
      const fetched = Array.isArray(data) ? data : [];
      setOrders(fetched);
      const vals: Record<number, { buyPrice: string; shippingCost: string }> = {};
      fetched.forEach((o: Order, i: number) => {
        vals[i] = {
          buyPrice: o.buyPrice ? String(o.buyPrice) : "",
          shippingCost: o.shippingCost ? String(o.shippingCost) : "",
        };
      });
      setEditValues(vals);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function togglePayment(orderIndex: number, order: Order) {
    const newStatus =
      order.paymentStatus === "Đã thanh toán"
        ? "Chưa thanh toán"
        : "Đã thanh toán";

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateOrder",
          row: orderIndex,
          data: { paymentStatus: newStatus },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Đã cập nhật: ${newStatus}`);
        await fetchOrders();
      } else {
        setMessage("Lỗi cập nhật");
      }
    } catch {
      setMessage("Lỗi kết nối");
    }
  }

  const updateOrderField = useCallback(
    async (
      orderIndex: number,
      field: "buyPrice" | "shippingCost" | "notes" | "orderCode",
      value: string | number
    ) => {
      try {
        await fetch("/api/sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateOrder",
            row: orderIndex,
            data: { [field]: value },
          }),
        });
      } catch {
        // silent fail for inline edits
      }
    },
    []
  );

  function formatPrice(val: number): string {
    return new Intl.NumberFormat("vi-VN").format(val * 1000) + " đ";
  }

  function getProfit(order: Order, idx: number): number {
    const buy = Number(editValues[idx]?.buyPrice) || order.buyPrice || 0;
    const ship = Number(editValues[idx]?.shippingCost) || order.shippingCost || 0;
    return (order.sellPrice || 0) - buy - ship;
  }

  function downloadPDF(order: Order, idx: number) {
    // A6 size: 105 x 148 mm
    const doc = new jsPDF({ unit: "mm", format: [105, 148] });
    const pageWidth = 105;
    const margin = 6;
    const contentWidth = pageWidth - margin * 2;
    let y = 8;

    // Title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("V1ncc TCG Card Shop", pageWidth / 2, y, { align: "center" });
    y += 6;

    // Date
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${order.orderDate || "N/A"}`, margin, y);
    y += 5;

    // Divider
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    // Customer + Phone
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Customer:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(order.customerName || "N/A"), margin + 20, y);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.text("Phone:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(order.phone || "N/A"), margin + 20, y);
    y += 4;

    // Address
    doc.setFont("helvetica", "bold");
    doc.text("Address:", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    const addrLines = doc.splitTextToSize(
      String(order.address || "N/A"),
      contentWidth
    );
    doc.text(addrLines, margin, y);
    y += addrLines.length * 3.5 + 2;

    // Divider
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    // Products (one per line)
    doc.setFont("helvetica", "bold");
    doc.text("Products:", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    const productList = (order.products || "")
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);
    for (const prod of productList) {
      const prodLines = doc.splitTextToSize(
        `- ${prod}`,
        contentWidth
      );
      doc.text(prodLines, margin, y);
      y += prodLines.length * 3.5;
    }
    y += 3;

    // Divider
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // Sell Price (only)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", margin, y);
    doc.text(formatPrice(order.sellPrice || 0), pageWidth - margin, y, {
      align: "right",
    });
    y += 6;

    // Payment Status
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const status = order.paymentStatus || "";
    doc.text("Status:", margin, y);
    doc.text(status, margin + 16, y);

    doc.save(
      `order-${order.customerName || "unknown"}-${order.orderDate || "date"}.pdf`
    );
  }

  const filtered = orders.filter((o) => {
    if (filter === "pending") return o.paymentStatus === "Chưa thanh toán";
    if (filter === "paid") return o.paymentStatus === "Đã thanh toán";
    return true;
  });

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "Đã thanh toán")
    .reduce((sum, o) => sum + (o.sellPrice || 0), 0);

  const pendingCount = orders.filter(
    (o) => o.paymentStatus === "Chưa thanh toán"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AdminNav active="orders" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Chờ thanh toán</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Doanh thu</p>
          <p className="text-2xl font-bold text-green-600">
            {formatPrice(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["all", "pending", "paid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f === "all" ? "Tất cả" : f === "pending" ? "Chưa thanh toán" : "Đã thanh toán"}
          </button>
        ))}
      </div>

      {message && (
        <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-4">
          {message}
        </p>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Đang tải đơn hàng...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>Không có đơn hàng</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, idx) => {
            const orderIdx = orders.indexOf(order);
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {order.customerName || "Khách"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {order.orderDate} · {order.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        order.paymentStatus === "Đã thanh toán"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-orange-50 text-orange-700 border border-orange-100"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                    <button
                      onClick={() => togglePayment(orderIdx, order)}
                      className="text-xs px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 font-semibold transition-colors"
                    >
                      {order.paymentStatus === "Đã thanh toán"
                        ? "Hủy"
                        : "Xác nhận"}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-2">
                  <span className="text-slate-400">Sản phẩm:</span>{" "}
                  {order.products}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs">GIÁ BÁN</span>
                    <p className="font-medium text-slate-800">
                      {formatPrice(order.sellPrice || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">GIÁ MUA</span>
                    <input
                      type="number"
                      value={editValues[orderIdx]?.buyPrice ?? ""}
                      placeholder="0"
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [orderIdx]: {
                            buyPrice: e.target.value,
                            shippingCost:
                              prev[orderIdx]?.shippingCost ?? "",
                          },
                        }))
                      }
                      onBlur={(e) =>
                        updateOrderField(
                          orderIdx,
                          "buyPrice",
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">
                      SHIP + ĐÓNG GÓI
                    </span>
                    <input
                      type="number"
                      value={editValues[orderIdx]?.shippingCost ?? ""}
                      placeholder="0"
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [orderIdx]: {
                            buyPrice: prev[orderIdx]?.buyPrice ?? "",
                            shippingCost: e.target.value,
                          },
                        }))
                      }
                      onBlur={(e) =>
                        updateOrderField(
                          orderIdx,
                          "shippingCost",
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">LỢI NHUẬN</span>
                      <button
                        onClick={() => downloadPDF(order, orderIdx)}
                        className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors font-semibold flex items-center gap-1"
                        title="Tải PDF"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        PDF
                      </button>
                    </div>
                    <p
                      className={`font-medium ${
                        getProfit(order, orderIdx) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatPrice(getProfit(order, orderIdx))}
                    </p>
                  </div>
                </div>

                {order.address && (
                  <p className="text-xs text-slate-400 mt-2">
                    Địa chỉ: {order.address}
                  </p>
                )}
                {order.notes && (
                  <p className="text-xs text-slate-400 mt-1">
                    Ghi chú: {order.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <a
          href="/admin"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Quay lại quản lý
        </a>
      </div>
    </div>
  );
}

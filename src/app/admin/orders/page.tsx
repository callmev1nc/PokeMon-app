"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/lib/types";
import AdminNav from "@/components/AdminNav";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "paid" | "delivered" | "undelivered"
  >("all");
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

  async function togglePayment(order: Order) {
    const orderIdx = orders.indexOf(order);
    if (orderIdx === -1) return;

    const newStatus =
      order.paymentStatus === "Đã thanh toán"
        ? "Chưa thanh toán"
        : "Đã thanh toán";

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirmOrder",
          row: orderIdx,
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

  async function toggleDelivery(order: Order) {
    const orderIdx = orders.indexOf(order);
    if (orderIdx === -1) return;

    const newStatus =
      order.deliveryStatus === "Đã giao" ? "Chưa giao" : "Đã giao";

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateOrder",
          row: orderIdx,
          data: { deliveryStatus: newStatus },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Giao hàng: ${newStatus}`);
        await fetchOrders();
      } else {
        setMessage("Lỗi cập nhật");
      }
    } catch {
      setMessage("Lỗi kết nối");
    }
  }

  async function handleDeleteOrder(order: Order) {
    const orderIdx = orders.indexOf(order);
    if (orderIdx === -1) return;

    if (
      !confirm(
        `Xóa đơn hàng của ${order.customerName || "Khách"}?\n${
          order.paymentStatus === "Đã thanh toán"
            ? "Đơn đã thanh toán - tồn kho sẽ được hoàn lại."
            : ""
        }`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteOrder", row: orderIdx }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("Đã xóa đơn hàng");
        await fetchOrders();
      } else {
        setMessage("Lỗi xóa đơn hàng");
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

  /** HTML-escape for safe insertion into print window */
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  function handlePrintTable() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const ordersToPrint = filtered;
    const rowsHtml = ordersToPrint
      .map(
        (o) => `
      <tr>
        <td>${esc(o.customerName || "Khách")}</td>
        <td>${esc(o.orderDate || o.timestamp)}</td>
        <td>${esc(o.phone)}</td>
        <td>${esc(o.products)}</td>
        <td style="text-align:right">${formatPrice(o.sellPrice || 0)}</td>
        <td>${esc(o.paymentStatus)}</td>
        <td>${esc(o.deliveryStatus || "Chưa giao")}</td>
        <td>${esc(o.address || "")}</td>
      </tr>`
      )
      .join("");

    const totalRevenue = ordersToPrint
      .filter((o) => o.paymentStatus === "Đã thanh toán")
      .reduce((sum, o) => sum + (o.sellPrice || 0), 0);

    printWindow.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Danh sách đơn hàng</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 24px; color: #1a202c; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #718096; font-size: 13px; margin-bottom: 16px; }
    .stats { display: flex; gap: 24px; margin-bottom: 16px; font-size: 13px; }
    .stats strong { color: #2d3748; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f7fafc; border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; font-weight: 600; color: #4a5568; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { border: 1px solid #e2e8f0; padding: 6px 10px; color: #2d3748; }
    tr:nth-child(even) td { background: #fafbfc; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Danh sách đơn hàng</h1>
  <p class="subtitle">In lúc: ${new Date().toLocaleString("vi-VN")}</p>
  <div class="stats">
    <span>Tổng: <strong>${ordersToPrint.length}</strong> đơn</span>
    <span>Đã thanh toán: <strong>${ordersToPrint.filter((o) => o.paymentStatus === "Đã thanh toán").length}</strong></span>
    <span>Đã giao: <strong>${ordersToPrint.filter((o) => o.deliveryStatus === "Đã giao").length}</strong></span>
    <span>Doanh thu: <strong>${formatPrice(totalRevenue)}</strong></span>
  </div>
  <table>
    <thead><tr>
      <th>Khách hàng</th><th>Ngày</th><th>SĐT</th><th>Sản phẩm</th>
      <th style="text-align:right">Giá bán</th><th>Thanh toán</th><th>Giao hàng</th><th>Địa chỉ</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
  }

  const filtered = orders.filter((o) => {
    if (filter === "pending") return o.paymentStatus === "Chưa thanh toán";
    if (filter === "paid") return o.paymentStatus === "Đã thanh toán";
    if (filter === "delivered") return o.deliveryStatus === "Đã giao";
    if (filter === "undelivered") return o.deliveryStatus !== "Đã giao";
    return true;
  });

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "Đã thanh toán")
    .reduce((sum, o) => sum + (o.sellPrice || 0), 0);

  const pendingCount = orders.filter(
    (o) => o.paymentStatus === "Chưa thanh toán"
  ).length;

  const deliveredCount = orders.filter(
    (o) => o.deliveryStatus === "Đã giao"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AdminNav active="orders" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Chờ thanh toán</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Đã giao</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{deliveredCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Doanh thu</p>
          <p className="text-2xl font-bold text-green-600">
            {formatPrice(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Filter + Print */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["all", "Tất cả"],
            ["pending", "Chưa thanh toán"],
            ["paid", "Đã thanh toán"],
            ["delivered", "Đã giao"],
            ["undelivered", "Chưa giao"],
          ] as const
        ).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={handlePrintTable}
          className="ml-auto px-4 py-1.5 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12Zm-2.25 0h.008v.008H16.5V12Z" />
          </svg>
          In / Tải PDF
        </button>
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
          {filtered.map((order) => {
            const orderIdx = orders.indexOf(order);
            return (
              <div
                key={`${order.orderDate}-${order.customerName}-${orderIdx}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {order.customerName || "Khách"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {order.orderDate || order.timestamp} · {order.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Payment badge */}
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        order.paymentStatus === "Đã thanh toán"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-orange-50 text-orange-700 border border-orange-100"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                    {/* Delivery badge */}
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        order.deliveryStatus === "Đã giao"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "bg-slate-50 text-slate-500 border border-slate-100"
                      }`}
                    >
                      {order.deliveryStatus || "Chưa giao"}
                    </span>
                    {/* Confirm payment */}
                    <button
                      onClick={() => togglePayment(order)}
                      className="text-xs px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 font-semibold transition-colors"
                    >
                      {order.paymentStatus === "Đã thanh toán" ? "Hủy TT" : "Xác nhận TT"}
                    </button>
                    {/* Delivery toggle */}
                    <button
                      onClick={() => toggleDelivery(order)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                        order.deliveryStatus === "Đã giao"
                          ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {order.deliveryStatus === "Đã giao" ? "Đã giao" : "Giao hàng"}
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteOrder(order)}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 font-semibold transition-colors"
                    >
                      Xóa
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
                            shippingCost: prev[orderIdx]?.shippingCost ?? "",
                          },
                        }))
                      }
                      onBlur={(e) =>
                        updateOrderField(orderIdx, "buyPrice", Number(e.target.value) || 0)
                      }
                      className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">SHIP + ĐÓNG GÓI</span>
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
                        updateOrderField(orderIdx, "shippingCost", Number(e.target.value) || 0)
                      }
                      className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">LỢI NHUẬN</span>
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

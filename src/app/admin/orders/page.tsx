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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

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
        `Xóa đơn hàng của ${order.customerName || "Khách"}?\nTồn kho sẽ được hoàn lại.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteOrder",
          row: order._row || orderIdx + 2,
          orderData: { products: order.products },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("Đã xóa đơn hàng");
        setSelected(new Set());
        await fetchOrders();
      } else {
        setMessage("Lỗi xóa đơn hàng");
      }
    } catch {
      setMessage("Lỗi kết nối");
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Xóa ${selected.size} đơn hàng đã chọn?\nTồn kho sẽ được hoàn lại.`)) return;

    const items = Array.from(selected).map((idx) => {
      const order = filtered[idx];
      return {
        row: order._row || orders.indexOf(order) + 2,
        products: order.products,
      };
    });

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteOrders", items }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`Đã xóa ${data.deleted} đơn hàng`);
        setSelected(new Set());
        setSelectMode(false);
        await fetchOrders();
      } else {
        setMessage("Lỗi xóa đơn hàng");
      }
    } catch {
      setMessage("Lỗi kết nối");
    }
  }

  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((_, i) => i)));
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

  function buildOrderHtml(order: Order): string {
    const now = new Date();
    const hanoiTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const dateStr = hanoiTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + hanoiTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const productLines = (order.products || "").split(", ").map((p) => {
      const match = p.match(/^(\d+)x\s+(.+?)\s+-\s+(\S+)$/);
      if (match) return `<div>${match[1]}x ${match[2]} - ${match[3]}</div>`;
      return `<div>${esc(p)}</div>`;
    }).join("");

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Order - ${esc(order.customerName || "Khách")}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1a202c; max-width: 400px; margin: 0 auto; }
    h1 { font-size: 18px; text-align: center; margin-bottom: 12px; border-bottom: 2px solid #333; padding-bottom: 8px; }
    .field { margin-bottom: 6px; font-size: 13px; }
    .field strong { display: inline-block; min-width: 90px; }
    .products { margin: 10px 0; padding: 8px; background: #f9f9f9; border-radius: 4px; font-size: 12px; line-height: 1.6; }
    .products-title { font-weight: 700; margin-bottom: 4px; font-size: 13px; }
    .status { margin-top: 8px; padding: 6px 10px; border-radius: 4px; font-size: 13px; font-weight: 600; text-align: center; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-unpaid { background: #fff7ed; color: #9a3412; }
    .total { font-size: 16px; font-weight: 700; text-align: right; margin-top: 10px; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <h1>V1ncc TCG Card Shop - Order Details</h1>
  <div class="field"><strong>Customer:</strong> ${esc(order.customerName || "Khách")}</div>
  <div class="field"><strong>Phone:</strong> ${esc(order.phone || "")}</div>
  <div class="field"><strong>Date:</strong> ${dateStr}</div>
  <div class="products">
    <div class="products-title">Products:</div>
    ${productLines}
  </div>
  ${order.oldAddress ? `<div class="field"><strong>Địa chỉ cũ:</strong> ${esc(order.oldAddress)}</div>` : ""}
  <div class="field"><strong>Địa chỉ mới:</strong> ${esc(order.address || "")}</div>
  <div class="status ${order.paymentStatus === "Đã thanh toán" ? "status-paid" : "status-unpaid"}">
    ${order.paymentStatus === "Đã thanh toán" ? "Đã thanh toán" : "Chưa thanh toán"}
  </div>
  <div class="total">${formatPrice(order.sellPrice || 0)}</div>
</body>
</html>`;
  }

  function handleDownloadPdf(order: Order) {
    const html = buildOrderHtml(order);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (order.customerName || "order").replace(/\s+/g, "-");
    const datePart = (order.orderDate || "").replace(/\//g, "-");
    a.href = url;
    a.download = `order-${safeName}-${datePart}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handlePrintSingle(order: Order) {
    const html = buildOrderHtml(order);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
  }

  function handlePrintTable() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const ordersToPrint = filtered;
    const totalRevenue = ordersToPrint
      .filter((o) => o.paymentStatus === "Đã thanh toán")
      .reduce((sum, o) => sum + (o.sellPrice || 0), 0);

    const orderCards = ordersToPrint.map((o) => {
      const now = new Date();
      const hanoiTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      const dateStr = hanoiTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + hanoiTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

      const productLines = (o.products || "").split(", ").map((p) => {
        const match = p.match(/^(\d+)x\s+(.+?)\s+-\s+(\S+)$/);
        if (match) return `<div>${match[1]}x ${match[2]} - ${match[3]}</div>`;
        return `<div>${esc(p)}</div>`;
      }).join("");

      return `
      <div class="order-card">
        <h2>V1ncc TCG Card Shop - Order Details</h2>
        <div class="field"><strong>Customer:</strong> ${esc(o.customerName || "Khách")}</div>
        <div class="field"><strong>Phone:</strong> ${esc(o.phone || "")}</div>
        <div class="field"><strong>Date:</strong> ${dateStr}</div>
        <div class="products">
          <div class="products-title">Products:</div>
          ${productLines}
        </div>
        ${o.oldAddress ? `<div class="field"><strong>Địa chỉ cũ:</strong> ${esc(o.oldAddress)}</div>` : ""}
        <div class="field"><strong>Địa chỉ mới:</strong> ${esc(o.address || "")}</div>
        <div class="status ${o.paymentStatus === "Đã thanh toán" ? "status-paid" : "status-unpaid"}">
          ${o.paymentStatus === "Đã thanh toán" ? "Đã thanh toán" : "Chưa thanh toán"}
        </div>
        <div class="total">${formatPrice(o.sellPrice || 0)}</div>
      </div>`;
    }).join("");

    printWindow.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Danh sách đơn hàng</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1a202c; }
    .order-card { max-width: 400px; margin: 0 auto 30px; page-break-inside: avoid; border-bottom: 1px dashed #ccc; padding-bottom: 20px; }
    .order-card:last-child { border-bottom: none; }
    h2 { font-size: 18px; text-align: center; margin-bottom: 10px; }
    .field { margin-bottom: 5px; font-size: 13px; }
    .field strong { display: inline-block; min-width: 90px; }
    .products { margin: 8px 0; padding: 6px 8px; background: #f9f9f9; border-radius: 4px; font-size: 12px; line-height: 1.6; }
    .products-title { font-weight: 700; margin-bottom: 3px; font-size: 13px; }
    .status { margin-top: 6px; padding: 5px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-align: center; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-unpaid { background: #fff7ed; color: #9a3412; }
    .total { font-size: 15px; font-weight: 700; text-align: right; margin-top: 8px; }
    .summary { text-align: center; font-size: 12px; color: #718096; margin-bottom: 20px; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="summary">
    Tổng: ${ordersToPrint.length} đơn | Đã thanh toán: ${ordersToPrint.filter((o) => o.paymentStatus === "Đã thanh toán").length} | Doanh thu: ${formatPrice(totalRevenue)}
  </div>
  ${orderCards}
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

      {/* Filter + Actions */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
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
            onClick={() => { setFilter(f); setSelected(new Set()); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {/* Select mode toggle */}
          <button
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectMode
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {selectMode ? "Hủy chọn" : "Chọn xóa"}
          </button>
          {/* Bulk delete */}
          {selectMode && selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Xóa ({selected.size})
            </button>
          )}
          {/* Print all */}
          <button
            onClick={handlePrintTable}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081-.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12Zm-2.25 0h.008v.008H16.5V12Z" />
            </svg>
            In tất cả
          </button>
        </div>
      </div>

      {/* Select all bar */}
      {selectMode && filtered.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Chọn tất cả ({filtered.length})
          </label>
          {selected.size > 0 && (
            <span className="text-sm text-slate-400">
              Đã chọn {selected.size}/{filtered.length}
            </span>
          )}
        </div>
      )}

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
            const isSelected = selected.has(idx);
            return (
              <div
                key={`${order.orderDate}-${order.customerName}-${orderIdx}`}
                className={`bg-white rounded-2xl border shadow-sm p-5 animate-fade-in transition-colors ${
                  isSelected ? "border-red-200 bg-red-50/30" : "border-slate-100"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(idx)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                    )}
                    <div>
                      <p className="font-medium text-slate-800">
                        {order.customerName || "Khách"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {order.orderDate || order.timestamp} · {order.phone}
                      </p>
                    </div>
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
                    {/* Print */}
                    <button
                      onClick={() => handlePrintSingle(order)}
                      className="text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold transition-colors flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081-.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12Zm-2.25 0h.008v.008H16.5V12Z" />
                      </svg>
                      In
                    </button>
                    {/* Download PDF */}
                    <button
                      onClick={() => handleDownloadPdf(order)}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      PDF
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
                    Địa chỉ mới: {order.address}
                  </p>
                )}
                {order.oldAddress && (
                  <p className="text-xs text-slate-400 mt-1">
                    Địa chỉ cũ: {order.oldAddress}
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

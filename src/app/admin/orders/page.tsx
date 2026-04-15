"use client";

import { useState, useEffect } from "react";
import type { Order } from "@/lib/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/sheets?action=orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
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

  async function updateOrderField(
    orderIndex: number,
    field: "buyPrice" | "shippingCost" | "notes" | "orderCode",
    value: string | number
  ) {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Quản lý đơn hàng
        </h1>
        <div className="flex gap-2">
          <a
            href="/admin"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Sản phẩm
          </a>
          <a
            href="/admin/customers"
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
          >
            Khách hàng
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-slate-800">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Chờ thanh toán</p>
          <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Doanh thu</p>
          <p className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat("vi-VN").format(totalRevenue * 1000)} đ
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
          {filtered.map((order, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-4"
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
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      order.paymentStatus === "Đã thanh toán"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                  <button
                    onClick={() => togglePayment(idx, order)}
                    className="text-xs px-3 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
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
                    {new Intl.NumberFormat("vi-VN").format(
                      (order.sellPrice || 0) * 1000
                    )}{" "}
                    đ
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">GIÁ MUA</span>
                  <input
                    type="number"
                    defaultValue={order.buyPrice || ""}
                    placeholder="0"
                    onBlur={(e) =>
                      updateOrderField(
                        idx,
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
                    defaultValue={order.shippingCost || ""}
                    placeholder="0"
                    onBlur={(e) =>
                      updateOrderField(
                        idx,
                        "shippingCost",
                        Number(e.target.value) || 0
                      )
                    }
                    className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                  />
                </div>
                <div>
                  <span className="text-slate-400 text-xs">LỢI NHUẬN</span>
                  <p className="font-medium text-blue-600">
                    {new Intl.NumberFormat("vi-VN").format(
                      ((order.sellPrice || 0) -
                        (order.buyPrice || 0) -
                        (order.shippingCost || 0)) *
                        1000
                    )}{" "}
                    đ
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
          ))}
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

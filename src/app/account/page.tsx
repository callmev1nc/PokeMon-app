"use client";

import { useState } from "react";
import Header from "@/components/Header";

interface CustomerOrder {
  orderCode: string;
  orderDate: string;
  customerName: string;
  products: string;
  sellPrice: number;
  shippingCost: number;
  paymentStatus: string;
  deliveryStatus: string;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

function getPaymentStyle(status: string) {
  switch (status) {
    case "Đã thanh toán":
    case "Đã chuyển khoản":
      return "bg-green-100 text-green-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

function getDeliveryStyle(status: string) {
  switch (status) {
    case "Đã giao":
      return "bg-green-100 text-green-700";
    case "Đang giao":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function AccountPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const handleLookup = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/track-order?phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();
      const results = Array.isArray(data) ? data : [];
      setOrders(results);
      if (results.length > 0) {
        setCustomerName(results[0].customerName);
      } else {
        setCustomerName("");
      }
    } catch {
      setOrders([]);
      setCustomerName("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLookup();
  };

  const totalSpent = orders.reduce((sum, o) => sum + (o.sellPrice || 0), 0);
  const paidCount = orders.filter(
    (o) =>
      o.paymentStatus === "Đã thanh toán" ||
      o.paymentStatus === "Đã chuyển khoản"
  ).length;

  return (
    <>
      <Header onCartClick={() => {}} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Tài khoản khách hàng
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Nhập số điện thoại để xem thông tin và lịch sử đơn hàng
        </p>

        {/* Phone Input */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <label className="text-sm font-semibold text-slate-600 block mb-2">
            Số điện thoại
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="Nhập số điện thoại..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
            <button
              onClick={handleLookup}
              disabled={loading || !phone.trim()}
              className="px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang tìm..." : "Tra cứu"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* No Results */}
        {!loading && searched && orders.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 mx-auto mb-3 opacity-50"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            <p className="text-lg font-medium">Không tìm thấy đơn hàng</p>
            <p className="text-sm mt-1">
              Kiểm tra lại số điện thoại và thử lại
            </p>
          </div>
        )}

        {/* Customer Info + Orders */}
        {!loading && orders.length > 0 && (
          <>
            {/* Customer Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-brand"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-slate-800">{customerName}</p>
                  <p className="text-xs text-slate-400">{phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Tổng đơn hàng</p>
                  <p className="text-lg font-bold text-slate-800">
                    {orders.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Đã thanh toán</p>
                  <p className="text-lg font-bold text-green-600">
                    {paidCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tổng chi tiêu</p>
                  <p className="text-lg font-bold text-brand">
                    {formatVND(totalSpent)}
                  </p>
                </div>
              </div>
            </div>

            {/* Order History */}
            <h2 className="text-lg font-bold text-slate-800 mb-3">
              Lịch sử đơn hàng
            </h2>

            {orders.map((order) => (
              <div
                key={order.orderCode}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-800">
                      {order.orderCode || "N/A"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {order.orderDate}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-brand">
                    {formatVND(order.sellPrice)}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex gap-2 mb-4">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStyle(
                      order.paymentStatus
                    )}`}
                  >
                    {order.paymentStatus}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getDeliveryStyle(
                      order.deliveryStatus
                    )}`}
                  >
                    {order.deliveryStatus}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Đặt hàng</span>
                    <span>Thanh toán</span>
                    <span>Đang giao</span>
                    <span>Đã giao</span>
                  </div>
                  <div className="flex gap-1">
                    {[
                      true,
                      order.paymentStatus === "Đã thanh toán" ||
                        order.paymentStatus === "Đã chuyển khoản",
                      order.deliveryStatus === "Đang giao" ||
                        order.deliveryStatus === "Đã giao",
                      order.deliveryStatus === "Đã giao",
                    ].map((done, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          done ? "bg-brand" : "bg-slate-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Products */}
                <div className="border-t border-slate-50 pt-3">
                  <p className="text-xs text-slate-400 mb-1">Sản phẩm:</p>
                  <p className="text-sm text-slate-700">
                    {order.products || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Back to shop */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Về cửa hàng
          </a>
        </div>
      </main>
    </>
  );
}

"use client";

import { useState } from "react";
import Header from "@/components/Header";

interface TrackedOrder {
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

export default function OrderTrackingPage() {
  const [searchType, setSearchType] = useState<"phone" | "code">("phone");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchType === "phone") params.set("phone", query.trim());
      else params.set("orderCode", query.trim());

      const res = await fetch(`/api/track-order?${params}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <>
      <Header onCartClick={() => {}} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Tra cứu đơn hàng
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Nhập số điện thoại hoặc mã đơn hàng để xem trạng thái
        </p>

        {/* Search Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSearchType("phone")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                searchType === "phone"
                  ? "bg-brand text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              Số điện thoại
            </button>
            <button
              onClick={() => setSearchType("code")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                searchType === "code"
                  ? "bg-brand text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              Mã đơn hàng
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type={searchType === "phone" ? "tel" : "text"}
              placeholder={
                searchType === "phone"
                  ? "Nhập số điện thoại..."
                  : "Nhập mã đơn hàng..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

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
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <p className="text-lg font-medium">Không tìm thấy đơn hàng</p>
            <p className="text-sm mt-1">
              Kiểm tra lại {searchType === "phone" ? "số điện thoại" : "mã đơn hàng"} và thử lại
            </p>
          </div>
        )}

        {!loading &&
          orders.map((order) => (
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

              {/* Customer */}
              <p className="text-sm text-slate-600 mb-2">
                <span className="text-slate-400">Khách hàng:</span>{" "}
                {order.customerName}
              </p>

              {/* Products */}
              <div className="border-t border-slate-50 pt-3">
                <p className="text-xs text-slate-400 mb-1">Sản phẩm:</p>
                <p className="text-sm text-slate-700">
                  {order.products || "N/A"}
                </p>
              </div>
            </div>
          ))}
      </main>
    </>
  );
}

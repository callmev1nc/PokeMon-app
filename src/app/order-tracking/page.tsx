"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

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
      return "bg-emerald-500/10 text-emerald-400";
    default:
      return "bg-amber-500/10 text-amber-400";
  }
}

function getDeliveryStyle(status: string) {
  switch (status) {
    case "Đã giao":
      return "bg-emerald-500/10 text-emerald-400";
    case "Đang giao":
      return "bg-blue-500/10 text-blue-400";
    default:
      return "bg-amber-500/10 text-amber-400";
  }
}

export default function OrderTrackingPage() {
  const locale = useLocaleStore((s) => s.locale);
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
        <h1 className="text-2xl font-bold text-slate-100 uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
          {t("order.track", locale)}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          {t("order.trackSub", locale)}
        </p>

        {/* Search Form */}
        <div className="bg-[#0F1629] rounded-2xl border border-slate-700/50 shadow-sm p-5 mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSearchType("phone")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                searchType === "phone"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/50"
              }`}
            >
              {t("order.phone", locale)}
            </button>
            <button
              onClick={() => setSearchType("code")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                searchType === "code"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/50"
              }`}
            >
              {t("order.code", locale)}
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type={searchType === "phone" ? "tel" : "text"}
              placeholder={
                searchType === "phone"
                  ? t("order.enterPhone", locale)
                  : t("order.enterCode", locale)
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/30 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("order.searching", locale) : t("order.search", locale)}
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
          <div className="text-center py-12 text-slate-500">
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
            <p className="text-lg font-medium">{t("order.notFound", locale)}</p>
            <p className="text-sm mt-1">
              {t("order.checkAgain", locale).replace("{type}", t(searchType === "phone" ? "order.type.phone" : "order.type.code", locale))}
            </p>
          </div>
        )}

        {!loading &&
          orders.map((order) => (
            <div
              key={order.orderCode}
              className="bg-[#0F1629] rounded-2xl border border-slate-700/50 shadow-sm p-5 mb-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-100">
                    {order.orderCode || "N/A"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {order.orderDate}
                  </p>
                </div>
                <p className="text-lg font-bold text-amber-400">
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
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>{t("order.ordered", locale)}</span>
                  <span>{t("order.payment", locale)}</span>
                  <span>{t("order.shipping", locale)}</span>
                  <span>{t("order.delivered", locale)}</span>
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
                        done ? "bg-amber-500" : "bg-slate-700/50"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Customer */}
              <p className="text-sm text-slate-300 mb-2">
                <span className="text-slate-500">{t("order.customer", locale)}</span>{" "}
                {order.customerName}
              </p>

              {/* Products */}
              <div className="border-t border-slate-700/50 pt-3">
                <p className="text-xs text-slate-500 mb-1">{t("order.products", locale)}</p>
                <p className="text-sm text-slate-300">
                  {order.products || "N/A"}
                </p>
              </div>
            </div>
          ))}
      </main>
    </>
  );
}

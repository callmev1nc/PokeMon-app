"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

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

export default function AccountPage() {
  const locale = useLocaleStore((s) => s.locale);
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
        <h1 className="text-2xl font-bold text-slate-100 uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
          {t("account.title", locale)}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          {t("account.subtitle", locale)}
        </p>

        {/* Phone Input */}
        <div className="bg-[#0F1629] rounded-2xl border border-slate-700/50 shadow-sm p-5 mb-6">
          <label className="text-sm font-semibold text-slate-300 block mb-2">
            {t("account.phoneLabel", locale)}
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder={t("order.enterPhone", locale)}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/30 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500"
            />
            <button
              onClick={handleLookup}
              disabled={loading || !phone.trim()}
              className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("order.searching", locale) : t("account.lookup", locale)}
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
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            <p className="text-lg font-medium">{t("order.notFound", locale)}</p>
            <p className="text-sm mt-1">
              {t("order.checkAgain", locale).replace("{type}", t("order.type.phone", locale))}
            </p>
          </div>
        )}

        {/* Customer Info + Orders */}
        {!loading && orders.length > 0 && (
          <>
            {/* Customer Summary */}
            <div className="bg-[#0F1629] rounded-2xl border border-slate-700/50 shadow-sm p-5 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-amber-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-slate-100">{customerName}</p>
                  <p className="text-xs text-slate-500">{phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">{t("account.totalOrders", locale)}</p>
                  <p className="text-lg font-bold text-slate-100">
                    {orders.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("account.paid", locale)}</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {paidCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("account.totalSpent", locale)}</p>
                  <p className="text-lg font-bold text-amber-400">
                    {formatVND(totalSpent)}
                  </p>
                </div>
              </div>
            </div>

            {/* Order History */}
            <h2 className="text-lg font-bold text-slate-100 mb-3">
              {t("account.orderHistory", locale)}
            </h2>

            {orders.map((order) => (
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

                {/* Products */}
                <div className="border-t border-slate-700/50 pt-3">
                  <p className="text-xs text-slate-500 mb-1">{t("order.products", locale)}</p>
                  <p className="text-sm text-slate-300">
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
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:underline"
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
            {t("account.backToShop", locale)}
          </a>
        </div>
      </main>
    </>
  );
}

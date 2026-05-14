"use client";

import { useState } from "react";
import Header from "@/components/Header";
import CheckoutSummary from "@/components/CheckoutSummary";
import QRCodeSection from "@/components/QRCodeSection";
import { useCartStore, getCartTotal } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const total = getCartTotal(items);
  const clearCart = useCartStore((s) => s.clearCart);
  const locale = useLocaleStore((s) => s.locale);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const customerStr = sessionStorage.getItem("customerInfo");
      const customer = customerStr
        ? JSON.parse(customerStr)
        : { name: "", phone: "", newAddress: "", oldAddress: "", notes: "", deliveryMethod: "shipping" };

      const productDesc = items
        .map((item) => {
          const pricePart = item.product.price !== null ? `|${item.product.price}` : "";
          return `${item.quantity}x ${item.product.name} - ${item.product.code}${pricePart}`;
        })
        .join(", ");

      const isShipping = customer.deliveryMethod !== "pickup";
      const shippingCost = isShipping ? 15000 : 0;

      const order = {
        timestamp: new Date().toISOString(),
        orderDate: new Date().toLocaleDateString("vi-VN"),
        orderCode: "",
        products: productDesc,
        customerName: customer.name,
        phone: customer.phone,
        address: isShipping ? (customer.newAddress || customer.oldAddress) : "Tự đến lấy",
        oldAddress: customer.oldAddress || "",
        notes: customer.notes || "",
        sellPrice: total * 1000,
        buyPrice: 0,
        shippingCost,
        profit: 0,
        paymentStatus: "Chưa thanh toán" as const,
      };

      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addOrder", order }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("checkout.error", locale));
        return;
      }

      setSubmitted(true);
      clearCart();
      sessionStorage.removeItem("customerInfo");
    } catch {
      setError(t("checkout.connectionError", locale));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header onCartClick={() => {}} />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-20 sm:pb-8 space-y-6 animate-fade-in">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-green-600">{t("step.info", locale)}</span>
          </div>
          <div className="w-8 h-px bg-brand-yellow" />
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">2</span>
            <span className="text-xs font-semibold text-brand">{t("step.payment", locale)}</span>
          </div>
          <div className="w-8 h-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center">3</span>
            <span className="text-xs font-medium text-slate-400">{t("step.done", locale)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100" style={{ fontFamily: "var(--font-display)" }}>
            {t("checkout.title", locale)}
          </h2>
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            &larr; {t("checkout.continueShopping", locale)}
          </a>
        </div>

        <CheckoutSummary />

        {!submitted ? (
          <button
            onClick={handleSubmitOrder}
            disabled={submitting || items.length === 0}
            className="btn-primary btn-press w-full py-3.5 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t("checkout.submitting", locale) : t("checkout.submit", locale)}
          </button>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-2xl mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-green-800 font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
              {t("checkout.success", locale)}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {t("checkout.successSub", locale)}
            </p>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 font-medium">
            {error}
          </div>
        )}

        <QRCodeSection
          onDone={() => {
            window.location.href = "/";
          }}
        />
      </main>
    </>
  );
}

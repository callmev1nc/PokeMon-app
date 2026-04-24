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
        : { name: "", phone: "", newAddress: "", oldAddress: "" };

      const productDesc = items
        .map((item) => `${item.quantity}x ${item.product.name} - ${item.product.code}`)
        .join(", ");

      const order = {
        timestamp: new Date().toISOString(),
        orderDate: new Date().toLocaleDateString("vi-VN"),
        orderCode: "",
        products: productDesc,
        customerName: customer.name,
        phone: customer.phone,
        address: customer.newAddress || customer.oldAddress,
        oldAddress: customer.oldAddress || "",
        notes: "",
        sellPrice: total * 1000,
        buyPrice: 0,
        shippingCost: 0,
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
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">{t("checkout.title", locale)}</h2>
          <a
            href="/"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            &larr; {t("checkout.continueShopping", locale)}
          </a>
        </div>

        <CheckoutSummary />

        {!submitted ? (
          <button
            onClick={handleSubmitOrder}
            disabled={submitting || items.length === 0}
            className="btn-press w-full py-3.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-red-200"
          >
            {submitting ? t("checkout.submitting", locale) : t("checkout.submit", locale)}
          </button>
        ) : (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-green-800 font-semibold">
              {t("checkout.success", locale)}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {t("checkout.successSub", locale)}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
            {error}
          </p>
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

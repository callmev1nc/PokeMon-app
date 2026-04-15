"use client";

import { useState } from "react";
import Header from "@/components/Header";
import CheckoutSummary from "@/components/CheckoutSummary";
import QRCodeSection from "@/components/QRCodeSection";
import { useCartStore, getCartTotal } from "@/store/cartStore";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const total = getCartTotal(items);
  const clearCart = useCartStore((s) => s.clearCart);
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
        notes: "",
        sellPrice: total,
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
        setError(data.error || "Lỗi gửi đơn hàng");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header onCartClick={() => {}} />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Thanh toán</h2>
          <a
            href="/"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            &larr; Tiếp tục mua sắm
          </a>
        </div>

        <CheckoutSummary />

        {!submitted ? (
          <button
            onClick={handleSubmitOrder}
            disabled={submitting || items.length === 0}
            className="btn-press w-full py-3.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-red-200"
          >
            {submitting ? "Đang gửi đơn hàng..." : "Xác nhận đặt hàng"}
          </button>
        ) : (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-green-800 font-semibold">
              Đơn hàng đã được gửi thành công!
            </p>
            <p className="text-sm text-green-600 mt-1">
              Vui lòng thanh toán qua QR code bên dưới
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
            clearCart();
            window.location.href = "/";
          }}
        />
      </main>
    </>
  );
}

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
      // Get customer info from sessionStorage
      const customerStr = sessionStorage.getItem("customerInfo");
      const customer = customerStr
        ? JSON.parse(customerStr)
        : { name: "", phone: "", newAddress: "", oldAddress: "" };

      // Build product description
      const productDesc = items
        .map((item) => `${item.product.name} x${item.quantity}`)
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
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Thanh toán</h2>
          <a
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Tiếp tục mua sắm
          </a>
        </div>

        <CheckoutSummary />

        {!submitted ? (
          <button
            onClick={handleSubmitOrder}
            disabled={submitting || items.length === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Đang gửi đơn hàng..." : "Xác nhận đặt hàng"}
          </button>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-800 font-medium">
              Đơn hàng đã được gửi thành công!
            </p>
            <p className="text-sm text-green-600 mt-1">
              Vui lòng thanh toán qua QR code bên dưới
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
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

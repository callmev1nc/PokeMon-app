"use client";

import Header from "@/components/Header";
import CheckoutSummary from "@/components/CheckoutSummary";
import QRCodeSection from "@/components/QRCodeSection";

export default function CheckoutPage() {
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
        <QRCodeSection />
      </main>
    </>
  );
}

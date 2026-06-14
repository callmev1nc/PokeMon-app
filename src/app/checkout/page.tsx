"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header";
import CheckoutSummary from "@/components/CheckoutSummary";
import QRCodeSection from "@/components/QRCodeSection";
import { useCartStore, getCartTotal } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const total = useMemo(() => getCartTotal(items), [items]);
  const clearCart = useCartStore((s) => s.clearCart);
  const locale = useLocaleStore((s) => s.locale);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      // Validate stock against latest product data
      const stockRes = await fetch("/api/products");
      const stockData = await stockRes.json();
      const latestProducts: { id: string; stock: number; name: string }[] = Array.isArray(stockData) ? stockData : (stockData?.data || []);
      const productMap = new Map(latestProducts.map((p) => [p.id, p]));
      const stockErrors: string[] = [];
      for (const item of items) {
        const latest = productMap.get(item.product.id);
        if (!latest) {
          stockErrors.push(`${item.product.name}: không tìm thấy`);
        } else if (latest.stock === 0) {
          stockErrors.push(`${item.product.name}: đã hết hàng`);
        } else if (latest.stock < item.quantity) {
          stockErrors.push(`${item.product.name}: chỉ còn ${latest.stock} (bạn đặt ${item.quantity})`);
        }
      }
      if (stockErrors.length > 0) {
        setError("Một số sản phẩm không đủ tồn kho:\n" + stockErrors.join("\n"));
        setSubmitting(false);
        return;
      }

      const customerStr = sessionStorage.getItem("customerInfo");
      const customer = customerStr
        ? JSON.parse(customerStr)
        : { name: "", phone: "", newAddress: "", oldAddress: "", notes: "", deliveryMethod: "shopee" };

      const productDesc = items
        .map((item) => {
          const pricePart = item.product.price !== null ? `|${item.product.price}` : "";
          return `${item.quantity}x ${item.product.name} - ${item.product.code}${pricePart}`;
        })
        .join(", ");

      const deliveryMethod = customer.deliveryMethod || "shopee";
      const isPickup = deliveryMethod === "pickup";
      const shippingCost = deliveryMethod === "shopee" ? 15000 : 0;

      const order = {
        timestamp: new Date().toISOString(),
        orderDate: new Date().toLocaleDateString("vi-VN"),
        orderCode: "",
        products: productDesc,
        customerName: customer.name,
        phone: customer.phone,
        address: isPickup ? "Tự đến lấy" : (customer.newAddress || customer.oldAddress),
        oldAddress: customer.oldAddress || "",
        notes: (deliveryMethod === "grab" ? "[Grab - chờ tính phí] " : "") + (customer.notes || ""),
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
      setOrderCode(data?.orderCode || "");
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
            {orderCode && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white border border-green-200 rounded-xl px-4 py-2.5">
                <span className="text-xs text-slate-500 font-medium">Mã đơn:</span>
                <span className="text-sm font-bold text-slate-800 font-mono">{orderCode}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(orderCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                  title="Sao chép mã đơn"
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 font-medium">
            {error}
          </div>
        )}

        {submitted && (
          <QRCodeSection
            onDone={() => {
              window.location.href = "/";
            }}
          />
        )}
      </main>
    </>
  );
}

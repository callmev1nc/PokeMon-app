"use client";

import { useState } from "react";
import Header from "@/components/Header";

export default function CustomerInfoPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [oldAddress, setOldAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addCustomer",
          customer: { name, phone, newAddress, oldAddress },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Lỗi lưu thông tin");
        return;
      }

      // Store customer info in sessionStorage for checkout
      sessionStorage.setItem(
        "customerInfo",
        JSON.stringify({ name, phone, newAddress, oldAddress })
      );

      window.location.href = "/checkout";
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header onCartClick={() => {}} />
      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Thông tin giao hàng
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Vui lòng điền thông tin trước khi thanh toán
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Tên <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Họ và tên"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Số Điện Thoại <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0xxx xxx xxx"
            />
          </div>

          <div>
            <label
              htmlFor="newAddress"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Địa Chỉ mới
            </label>
            <input
              id="newAddress"
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Địa chỉ nhận hàng"
            />
          </div>

          <div>
            <label
              htmlFor="oldAddress"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Địa chỉ cũ
            </label>
            <input
              id="oldAddress"
              type="text"
              value={oldAddress}
              onChange={(e) => setOldAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Địa chỉ cũ (nếu có)"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Đang lưu..." : "Tiếp tục thanh toán"}
          </button>
        </form>

        <div className="mt-4">
          <a
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Tiếp tục mua sắm
          </a>
        </div>
      </main>
    </>
  );
}

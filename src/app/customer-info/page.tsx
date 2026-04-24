"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

function validatePhone(phone: string, locale: string): string | null {
  if (!phone) return t("customer.phoneError", locale);
  if (phone.length < 9) return t("customer.phoneShort", locale);
  if (!/^(0[3-9]\d{8,9})$/.test(phone)) return t("customer.phoneInvalid", locale);
  return null;
}

export default function CustomerInfoPage() {
  const locale = useLocaleStore((s) => s.locale);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [oldAddress, setOldAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string) => {
    const errs = { ...fieldErrors };
    if (field === "name" && !value.trim()) errs.name = t("customer.nameError", locale);
    else if (field === "name") delete errs.name;

    if (field === "phone") {
      const e = validatePhone(value, locale);
      if (e) errs.phone = e; else delete errs.phone;
    }

    if (field === "oldAddress" && !value.trim()) errs.oldAddress = t("customer.oldAddressError", locale);
    else if (field === "oldAddress") delete errs.oldAddress;

    setFieldErrors(errs);
  };

  const handleBlur = (field: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const val = field === "name" ? name : field === "phone" ? phone : field === "oldAddress" ? oldAddress : newAddress;
    validateField(field, val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate all
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t("customer.nameError", locale);
    const phoneErr = validatePhone(phone, locale);
    if (phoneErr) errs.phone = phoneErr;
    if (!oldAddress.trim()) errs.oldAddress = t("customer.oldAddressError", locale);
    setFieldErrors(errs);
    setTouched({ name: true, phone: true, oldAddress: true });

    if (Object.keys(errs).length > 0) return;

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
        setError(data.error || t("customer.error", locale));
        return;
      }

      sessionStorage.setItem(
        "customerInfo",
        JSON.stringify({ name, phone, newAddress, oldAddress })
      );

      window.location.href = "/checkout";
    } catch {
      setError(t("customer.connectionError", locale));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header onCartClick={() => {}} />
      <main className="max-w-lg mx-auto px-4 py-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand/10 rounded-2xl mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-brand">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {t("customer.title", locale)}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t("customer.subtitle", locale)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t("customer.name", locale)} <span className="text-brand">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              required
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors ${
                touched.name && fieldErrors.name ? "border-red-300 bg-red-50/50" : "border-slate-200"
              }`}
              placeholder={t("customer.namePlaceholder", locale)}
            />
            {touched.name && fieldErrors.name && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t("customer.phone", locale)} <span className="text-brand">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                setPhone(val);
              }}
              onBlur={() => handleBlur("phone")}
              required
              maxLength={11}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors ${
                touched.phone && fieldErrors.phone ? "border-red-300 bg-red-50/50" : "border-slate-200"
              }`}
              placeholder="0xxx xxx xxx"
            />
            {touched.phone && fieldErrors.phone && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="newAddress" className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t("customer.newAddress", locale)}
            </label>
            <input
              id="newAddress"
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              placeholder={t("customer.newAddressPlaceholder", locale)}
            />
          </div>

          <div>
            <label htmlFor="oldAddress" className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t("customer.oldAddress", locale)} <span className="text-brand">*</span>
            </label>
            <input
              id="oldAddress"
              type="text"
              value={oldAddress}
              onChange={(e) => setOldAddress(e.target.value)}
              onBlur={() => handleBlur("oldAddress")}
              required
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors ${
                touched.oldAddress && fieldErrors.oldAddress ? "border-red-300 bg-red-50/50" : "border-slate-200"
              }`}
              placeholder={t("customer.oldAddressPlaceholder", locale)}
            />
            {touched.oldAddress && fieldErrors.oldAddress && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.oldAddress}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-press w-full py-3 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-red-200"
          >
            {loading ? t("customer.saving", locale) : t("customer.continue", locale)}
          </button>
        </form>

        <div className="text-center mt-4">
          <a
            href="/"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            &larr; {t("checkout.continueShopping", locale)}
          </a>
        </div>
      </main>
    </>
  );
}

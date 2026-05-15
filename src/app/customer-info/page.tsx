"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useLocaleStore } from "@/store/localeStore";
import { t, type Locale } from "@/lib/i18n";

function validatePhone(phone: string, locale: Locale): string | null {
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
  const [notes, setNotes] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">("shipping");
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

    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t("customer.nameError", locale);
    const phoneErr = validatePhone(phone, locale);
    if (phoneErr) errs.phone = phoneErr;
    if (deliveryMethod === "shipping" && !oldAddress.trim()) errs.oldAddress = t("customer.oldAddressError", locale);
    setFieldErrors(errs);
    setTouched({ name: true, phone: true, oldAddress: deliveryMethod === "shipping" });

    if (Object.keys(errs).length > 0) return;

    setLoading(true);

        try {
          const res = await fetch("/api/sheets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "addCustomer",
              customer: { name, phone, newAddress, oldAddress, notes },
            }),
          });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("customer.error", locale));
        return;
      }

      sessionStorage.setItem(
        "customerInfo",
        JSON.stringify({ name, phone, newAddress, oldAddress, notes, deliveryMethod })
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
      <main className="max-w-lg mx-auto px-4 py-8 md:py-10 animate-fade-in">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">1</span>
            <span className="text-xs font-semibold text-amber-400">{t("step.info", locale)}</span>
          </div>
          <div className="w-8 h-px bg-slate-200 dark:bg-slate-700/50" />
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center">2</span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{t("step.payment", locale)}</span>
          </div>
          <div className="w-8 h-px bg-slate-200 dark:bg-slate-700/50" />
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center justify-center">3</span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{t("step.done", locale)}</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/5 rounded-2xl mb-3 border border-amber-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
            {t("customer.title", locale)}
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            {t("customer.subtitle", locale)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="vault-card p-5 md:p-6 space-y-5">
          {/* Delivery Method Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide">
              {t("customer.deliveryMethod", locale)}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("shipping")}
                className={`flex flex-col items-center gap-1 py-3 px-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                  deliveryMethod === "shipping"
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <span>{t("customer.shipping", locale)}</span>
                <span className="text-[10px] font-normal opacity-70">+15.000 đ</span>
              </button>
              <button
                type="button"
                onClick={() => { setDeliveryMethod("pickup"); setNewAddress(""); setOldAddress(""); setNotes(""); }}
                className={`flex flex-col items-center gap-1 py-3 px-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                  deliveryMethod === "pickup"
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                </svg>
                <span>{t("customer.pickup", locale)}</span>
                <span className="text-[10px] font-normal opacity-70">Miễn phí</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              {t("customer.name", locale)} <span className="text-amber-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              required
              className={`w-full px-4 py-3 border rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all ${
                touched.name && fieldErrors.name
                  ? "border-red-500/50 bg-red-50 dark:bg-red-500/10 focus:ring-red-400/30"
                  : "border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
              placeholder={t("customer.namePlaceholder", locale)}
            />
            {touched.name && fieldErrors.name && (
              <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              {t("customer.phone", locale)} <span className="text-amber-400">*</span>
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
              className={`w-full px-4 py-3 border rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all ${
                touched.phone && fieldErrors.phone
                  ? "border-red-500/50 bg-red-50 dark:bg-red-500/10 focus:ring-red-400/30"
                  : "border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
              placeholder="0xxx xxx xxx"
            />
            {touched.phone && fieldErrors.phone && (
              <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.phone}</p>
            )}
          </div>

          {deliveryMethod === "shipping" && (<>
          <div>
            <label htmlFor="newAddress" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              {t("customer.newAddress", locale)}
            </label>
            <input
              id="newAddress"
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all hover:border-slate-300 dark:hover:border-slate-600"
              placeholder={t("customer.newAddressPlaceholder", locale)}
            />
          </div>

          <div>
            <label htmlFor="oldAddress" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              {t("customer.oldAddress", locale)} <span className="text-amber-400">*</span>
            </label>
            <input
              id="oldAddress"
              type="text"
              value={oldAddress}
              onChange={(e) => setOldAddress(e.target.value)}
              onBlur={() => handleBlur("oldAddress")}
              required
              className={`w-full px-4 py-3 border rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all ${
                touched.oldAddress && fieldErrors.oldAddress
                  ? "border-red-500/50 bg-red-50 dark:bg-red-500/10 focus:ring-red-400/30"
                  : "border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
              placeholder={t("customer.oldAddressPlaceholder", locale)}
            />
            {touched.oldAddress && fieldErrors.oldAddress && (
              <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.oldAddress}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              {t("customer.notes", locale)}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all hover:border-slate-300 dark:hover:border-slate-600 resize-none"
              placeholder={t("customer.notesPlaceholder", locale)}
            />
          </div>
          </>)}

          {error && (
            <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-4 py-3 rounded-xl border border-red-100 dark:border-red-500/20 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-press w-full py-3.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("customer.saving", locale) : t("customer.continue", locale)}
          </button>
        </form>

        <div className="text-center mt-5">
          <a
            href="/"
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium"
          >
            &larr; {t("checkout.continueShopping", locale)}
          </a>
        </div>
      </main>
    </>
  );
}

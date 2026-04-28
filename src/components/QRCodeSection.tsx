"use client";

import { FACEBOOK_URL } from "@/lib/constants";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";

export default function QRCodeSection({ onDone }: { onDone: () => void }) {
  const locale = useLocaleStore((s) => s.locale);

  return (
    <div className="bg-[#0F1629] rounded-2xl border border-slate-700/50 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/50">
        <h3 className="font-bold text-slate-100 uppercase tracking-wider" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
          {t("qr.title", locale)}
        </h3>
      </div>
      <div className="p-6 flex flex-col items-center gap-5">
        <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <img
            src="/qr-code.jpg"
            alt={t("qr.title", locale)}
            className="w-52 h-auto rounded-xl"
          />
        </div>

        <div className="text-center space-y-2 max-w-sm">
          <p className="text-sm font-semibold text-slate-300">
            {t("qr.scan", locale)}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t("qr.instruction", locale)}
          </p>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#1877F2] font-semibold hover:underline text-sm mt-1"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {t("qr.facebook", locale)}
          </a>
        </div>

        <button
          onClick={onDone}
          className="btn-press mt-2 w-full max-w-sm py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors shadow-md shadow-green-200/50"
        >
          {t("qr.done", locale)}
        </button>
      </div>
    </div>
  );
}

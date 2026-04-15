"use client";

import { FACEBOOK_URL } from "@/lib/constants";

export default function QRCodeSection({ onDone }: { onDone: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Thanh toan</h3>
      </div>
      <div className="p-6 flex flex-col items-center gap-5">
        <img
          src="/qr-code.jpg"
          alt="Ma QR thanh toan"
          className="w-56 h-auto rounded-xl border border-slate-100 shadow-sm"
        />

        <div className="text-center space-y-2 max-w-sm">
          <p className="text-sm font-semibold text-slate-700">
            Vui long quet ma QR de thanh toan
          </p>
          <p className="text-sm text-slate-500">
            Sau khi chuyen khoan, vui long chup anh man hinh va gui qua Facebook de xac nhan don hang:
          </p>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand font-semibold hover:underline text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Gui tin nhan Facebook
          </a>
        </div>

        <button
          onClick={onDone}
          className="btn-press mt-2 w-full max-w-sm py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-md shadow-green-200"
        >
          Da thanh toan - Quay lai
        </button>
      </div>
    </div>
  );
}

"use client";

import { FACEBOOK_URL } from "@/lib/constants";

export default function QRCodeSection({ onDone }: { onDone: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">Thanh toán</h3>
      </div>
      <div className="p-6 flex flex-col items-center gap-4">
        <img
          src="/qr-code.jpg"
          alt="Mã QR thanh toán"
          className="w-64 h-auto rounded-lg border border-slate-200"
        />

        <div className="text-center space-y-2 max-w-sm">
          <p className="text-sm font-medium text-slate-700">
            Vui lòng quét mã QR để thanh toán
          </p>
          <p className="text-sm text-slate-600">
            Sau khi chuyển khoản, vui lòng chụp ảnh màn hình làm hóa đơn
          </p>
          <p className="text-sm text-slate-600">
            Sau đó gửi qua Facebook để xác nhận đơn hàng:
          </p>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Gửi tin nhắn Facebook
          </a>
        </div>

        <button
          onClick={onDone}
          className="mt-2 w-full max-w-sm py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
        >
          Đã thanh toán - Quay lại
        </button>
      </div>
    </div>
  );
}

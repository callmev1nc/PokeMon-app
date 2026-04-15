"use client";

import { useState, useEffect } from "react";
import type { Customer } from "@/lib/types";
import AdminNav from "@/components/AdminNav";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Customer>>({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/sheets?action=customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit() {
    if (editIndex === null) return;

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateCustomer",
          row: editIndex,
          data: editData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("Đã cập nhật thông tin khách hàng");
        setEditIndex(null);
        setEditData({});
        await fetchCustomers();
      } else {
        setMessage("Lỗi cập nhật");
      }
    } catch {
      setMessage("Lỗi kết nối");
    }
  }

  const startEdit = (index: number, customer: Customer) => {
    setEditIndex(index);
    setEditData({
      name: customer.name,
      phone: customer.phone,
      newAddress: customer.newAddress,
      oldAddress: customer.oldAddress,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AdminNav active="customers" />

      {message && (
        <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-4">
          {message}
        </p>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Đang tải danh sách khách hàng...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>Chưa có khách hàng</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Tên
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Số Điện Thoại
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Địa Chỉ Mới
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Địa chỉ cũ
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Sửa
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    {editIndex === idx ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editData.name || ""}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editData.phone || ""}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editData.newAddress || ""}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                newAddress: e.target.value,
                              }))
                            }
                            className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editData.oldAddress || ""}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                oldAddress: e.target.value,
                              }))
                            }
                            className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={saveEdit}
                              className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => {
                                setEditIndex(null);
                                setEditData({});
                              }}
                              className="text-xs px-3 py-1 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                            >
                              Hủy
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 font-medium text-slate-800">
                          {customer.name}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {customer.phone}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {customer.newAddress || "—"}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {customer.oldAddress || "—"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => startEdit(idx, customer)}
                            className="text-xs px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 font-semibold transition-colors"
                          >
                            Sửa
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8">
        <a
          href="/admin"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Quay lại quản lý
        </a>
      </div>
    </div>
  );
}

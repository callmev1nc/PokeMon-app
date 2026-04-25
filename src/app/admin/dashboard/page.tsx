"use client";

import { useEffect, useState, useCallback } from "react";
import type { Order, Product } from "@/lib/types";
import AdminNav from "@/components/AdminNav";

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + " đ";
}

/**
 * Parse a DD/MM/YYYY date string into a Date object (midnight local time).
 * Returns null for unparseable dates.
 */
function parseOrderDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  lowStockCount: number;
  outOfStockCount: number;
  topProducts: { name: string; count: number; revenue: number }[];
  revenueByDate: { date: string; revenue: number; orders: number }[];
  paymentBreakdown: { status: string; count: number }[];
}

function computeStats(orders: Order[], products: Product[]): DashboardStats {
  let totalRevenue = 0;
  let totalProfit = 0;
  let paidOrders = 0;
  let pendingOrders = 0;
  let deliveredOrders = 0;
  const productMap = new Map<string, { name: string; count: number; revenue: number }>();
  const dateMap = new Map<string, { revenue: number; orders: number }>();
  const paymentMap = new Map<string, number>();

  for (const o of orders) {
    totalRevenue += o.sellPrice || 0;
    totalProfit += o.profit || 0;

    if (o.paymentStatus === "Đã thanh toán" || o.paymentStatus === "Đã chuyển khoản") {
      paidOrders++;
    } else {
      pendingOrders++;
    }

    if (o.deliveryStatus === "Đã giao") deliveredOrders++;

    const status = o.paymentStatus || "Chưa thanh toán";
    paymentMap.set(status, (paymentMap.get(status) || 0) + 1);

    // Parse products
    if (o.products) {
      const items = o.products.split(", ");
      for (const item of items) {
        const match = item.match(/^(\d+)x\s+(.+?)\s+-\s+(\S+)$/);
        if (match) {
          const qty = parseInt(match[1]);
          const name = match[2];
          const existing = productMap.get(name) || { name, count: 0, revenue: 0 };
          existing.count += qty;
          existing.revenue += (o.sellPrice || 0) / items.length * qty;
          productMap.set(name, existing);
        }
      }
    }

    // Group by date
    const date = o.orderDate || o.timestamp?.split("T")[0] || "Unknown";
    const dateEntry = dateMap.get(date) || { revenue: 0, orders: 0 };
    dateEntry.revenue += o.sellPrice || 0;
    dateEntry.orders++;
    dateMap.set(date, dateEntry);
  }

  const topProducts = [...productMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const revenueByDate = [...dateMap.entries()]
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  const paymentBreakdown = [...paymentMap.entries()].map(([status, count]) => ({ status, count }));

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 3).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return {
    totalRevenue,
    totalProfit,
    totalOrders: orders.length,
    paidOrders,
    pendingOrders,
    deliveredOrders,
    lowStockCount,
    outOfStockCount,
    topProducts,
    revenueByDate,
    paymentBreakdown,
  };
}

const MAX_BAR_WIDTH = 100;

/**
 * Filter orders to those whose orderDate falls within [from, to] inclusive.
 * from/to are YYYY-MM-DD strings (HTML date input format).
 */
function filterOrdersByDateRange(
  orders: Order[],
  from: string,
  to: string
): Order[] {
  const fromDate = from ? new Date(from + "T00:00:00") : null;
  const toDate = to ? new Date(to + "T23:59:59") : null;

  if (!fromDate && !toDate) return orders;

  return orders.filter((o) => {
    const orderDate = parseOrderDate(o.orderDate);
    if (!orderDate) return false;
    if (fromDate && orderDate < fromDate) return false;
    if (toDate && orderDate > toDate) return false;
    return true;
  });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const recalculate = useCallback(
    (orders: Order[], products: Product[], from: string, to: string) => {
      const filtered = filterOrdersByDateRange(orders, from, to);
      setStats(computeStats(filtered, products));
    },
    []
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/sheets?action=orders", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([orders, products]: [Order[], Product[]]) => {
        setAllOrders(orders || []);
        setAllProducts(products || []);
        setStats(computeStats(orders || [], products || []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFromDate(newFrom);
    setToDate(newTo);
    recalculate(allOrders, allProducts, newFrom, newTo);
  };

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    recalculate(allOrders, allProducts, "", "");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdminNav active="dashboard" />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxRevenue = Math.max(...stats.revenueByDate.map((d) => d.revenue), 1);
  const maxProductCount = Math.max(...stats.topProducts.map((p) => p.count), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <AdminNav active="products" />

      <h2 className="text-xl font-bold text-slate-800 mb-4">Dashboard</h2>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-600">Lọc theo ngày:</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Từ</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => handleDateChange(e.target.value, toDate)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Đến</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => handleDateChange(fromDate, e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              onClick={clearDateFilter}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Xóa lọc
            </button>
          )}
          {(fromDate || toDate) && (
            <span className="text-xs text-slate-400">
              Đang hiển thị {filterOrdersByDateRange(allOrders, fromDate, toDate).length} / {allOrders.length} đơn hàng
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Doanh thu</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatVND(stats.totalRevenue)}</p>
          <p className="text-xs text-slate-400 mt-1">{stats.paidOrders} đã thanh toán</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Lợi nhuận</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatVND(stats.totalProfit)}</p>
          <p className="text-xs text-slate-400 mt-1">Biên: {stats.totalRevenue > 0 ? Math.round(stats.totalProfit / stats.totalRevenue * 100) : 0}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Đơn hàng</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalOrders}</p>
          <p className="text-xs text-slate-400 mt-1">{stats.pendingOrders} chờ xử lý</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tồn kho</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {stats.lowStockCount > 0 && <span className="text-orange-500">{stats.lowStockCount} thấp</span>}
            {stats.lowStockCount > 0 && stats.outOfStockCount > 0 && <span className="text-slate-300"> / </span>}
            {stats.outOfStockCount > 0 && <span className="text-red-500">{stats.outOfStockCount} hết</span>}
          </p>
          <p className="text-xs text-slate-400 mt-1">Cần chú ý</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Date */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Doanh thu theo ngày</h3>
          {stats.revenueByDate.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-2">
              {stats.revenueByDate.map((d) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-20 shrink-0">{d.date}</span>
                  <div className="flex-1 bg-slate-50 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-brand h-full rounded-full transition-all"
                      style={{ width: `${(d.revenue / maxRevenue) * MAX_BAR_WIDTH}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-28 text-right">
                    {formatVND(d.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Sản phẩm bán chạy</h3>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-2">
              {stats.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                  <span className="text-sm text-slate-700 flex-1 truncate">{p.name}</span>
                  <div className="w-20 bg-slate-50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-accent h-full rounded-full"
                      style={{ width: `${(p.count / maxProductCount) * MAX_BAR_WIDTH}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-10 text-right">{p.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">Trạng thái thanh toán</h3>
        <div className="flex gap-4 flex-wrap">
          {stats.paymentBreakdown.map((p) => (
            <div key={p.status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                p.status === "Đã thanh toán" || p.status === "Đã chuyển khoản"
                  ? "bg-green-500"
                  : "bg-yellow-400"
              }`} />
              <span className="text-sm text-slate-600">{p.status}</span>
              <span className="text-sm font-bold text-slate-800">{p.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

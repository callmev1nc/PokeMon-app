"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Order, Product } from "@/lib/types";
import { formatPrice as formatPriceUtil, formatNumber } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import ConfirmDialog, { useConfirmDialog } from "@/components/ConfirmDialog";

const GROUP_ORDER: Record<string, number> = {
  pokemon: 1,
  item: 2,
  tool: 3,
  suppoter: 4,
  supporter: 4,
  stadium: 5,
  energy: 6,
  "special energy": 7,
};

interface ParsedProduct {
  qty: number;
  name: string;
  code: string;
  group: string;
  series: string;
  price: number | null;
}

function codeSortKey(code: string): [string, string, number] {
  const parts = code.split("-");
  const seg1 = (parts[0] || "").toUpperCase();
  const seg2 = (parts[1] || "").toUpperCase();
  const seg3 = parseInt(parts[2] || "0") || 0;
  return [seg1, seg2, seg3];
}

function parseAndSortProducts(productsStr: string, codeToGroup: Map<string, string>, productMap: Map<string, Product>): ParsedProduct[] {
  const items: ParsedProduct[] = (productsStr || "").split(", ").map((p) => {
    const match = p.match(/^(\d+)x\s+(.+?)\s+-\s+([^\s|]+)(?:\|([\d.]+))?$/);
    if (!match) return null;
    const code = match[3];
    const storedPrice = match[4] !== undefined ? parseFloat(match[4]) : undefined;
    const prod = productMap.get(code);
    return {
      qty: parseInt(match[1]),
      name: match[2],
      code,
      group: codeToGroup.get(code) || "z",
      series: prod?.series || "",
      price: storedPrice !== undefined ? storedPrice : (prod?.price ?? null),
    };
  }).filter(Boolean) as ParsedProduct[];

  return items.sort((a, b) => {
    const ga = GROUP_ORDER[a.group] || 99;
    const gb = GROUP_ORDER[b.group] || 99;
    if (ga !== gb) return ga - gb;
    const ka = codeSortKey(a.code);
    const kb = codeSortKey(b.code);
    if (ka[0] !== kb[0]) return ka[0].localeCompare(kb[0]);
    if (ka[1] !== kb[1]) return ka[1].localeCompare(kb[1]);
    return ka[2] - kb[2];
  });
}

function normalizePayment(val: string): Order["paymentStatus"] {
  if (!val || val === "false" || val === "FALSE" || val === "0") return "Chưa thanh toán";
  if (val === "true" || val === "TRUE" || val === "1") return "Đã thanh toán";
  return val as Order["paymentStatus"];
}

function normalizeDelivery(val: string | undefined): "Chưa giao" | "Đang giao" | "Đã giao" {
  if (!val || val === "false" || val === "FALSE" || val === "0") return "Chưa giao";
  if (val === "true" || val === "TRUE" || val === "1") return "Đã giao";
  return val as "Chưa giao" | "Đang giao" | "Đã giao";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "paid" | "delivered" | "undelivered"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editValues, setEditValues] = useState<
    Record<number, { buyPrice: string; shippingCost: string; notes: string }>
  >({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Record<number, string>>({});
  const [productSearch, setProductSearch] = useState<Record<number, string>>({});
  const [showProductSearch, setShowProductSearch] = useState<Record<number, boolean>>({});
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
  const pdfGenerating = useRef(false);
  const { dialogProps, confirm: confirmAction } = useConfirmDialog();

  const [showNewOrder, setShowNewOrder] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: "",
    phone: "",
    address: "",
    oldAddress: "",
    products: "",
    sellPrice: "",
    buyPrice: "",
    shippingCost: "",
    notes: "",
    paymentStatus: "Chưa thanh toán" as "Chưa thanh toán" | "Đã chuyển khoản" | "Đã thanh toán",
  });

  const { productMap, codeToGroup } = useMemo(() => {
    const pm = new Map<string, Product>();
    const cg = new Map<string, string>();
    for (const p of products) {
      pm.set(p.code, p);
      cg.set(p.code, p.group);
    }
    return { productMap: pm, codeToGroup: cg };
  }, [products]);

  useEffect(() => {
    fetchOrders();
    fetch("/api/products").then((r) => r.json()).then((data) => setProducts(Array.isArray(data) ? data : data?.data || [])).catch(() => {});
    const interval = setInterval(fetchOrders, 30000);
    window.addEventListener("focus", fetchOrders);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchOrders);
    };
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/sheets?action=orders");
      const data = await res.json();
      const raw = Array.isArray(data) ? data : [];
      const fetched = raw.map((o: Order) => ({
        ...o,
        paymentStatus: normalizePayment(o.paymentStatus),
        deliveryStatus: normalizeDelivery(o.deliveryStatus),
      }));
      fetched.reverse();
      setOrders(fetched);
      const vals: Record<number, { buyPrice: string; shippingCost: string; notes: string }> = {};
      fetched.forEach((o: Order, i: number) => {
        vals[i] = {
          buyPrice: o.buyPrice ? String(o.buyPrice) : "",
          shippingCost: o.shippingCost ? String(o.shippingCost) : "",
          notes: o.notes || "",
        };
      });
      setEditValues(vals);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updatePaymentStatus(order: Order, newStatus: string) {
    const orderIdx = orders.indexOf(order);
    if (orderIdx === -1) return;
    setPendingStatus((prev) => ({ ...prev, [orderIdx]: newStatus }));
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirmOrder",
          row: order._row,
          orderRow: order._row,
          orderCode: order.orderCode,
          data: { paymentStatus: newStatus },
          products: order.products,
        }),
      });
      const data = await res.json();
      if (data.success) { setMessage(`Thanh toán: ${newStatus}`); await fetchOrders(); }
      else setMessage("Lỗi cập nhật");
    } catch { setMessage("Lỗi kết nối"); }
    setPendingStatus((prev) => { const next = { ...prev }; delete next[orderIdx]; return next; });
  }

  async function updateDeliveryStatus(order: Order, newStatus: string) {
    const orderIdx = orders.indexOf(order);
    if (orderIdx === -1) return;
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateOrder", row: order._row, sheetRow: order._row, orderCode: order.orderCode, data: { deliveryStatus: newStatus } }),
      });
      const data = await res.json();
      if (data.success) { setMessage(`Giao hàng: ${newStatus}`); await fetchOrders(); }
      else setMessage("Lỗi cập nhật");
    } catch { setMessage("Lỗi kết nối"); }
  }

  async function handleRefundOrder(order: Order) {
    if (!confirm("Hoàn hàng và khôi phục tồn kho?")) return;
    try {
      const res = await fetch("/api/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: order.products }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Đã hoàn hàng và khôi phục tồn kho");
      } else {
        setMessage("Lỗi hoàn hàng");
      }
    } catch {
      setMessage("Lỗi kết nối");
    }
  }

  function handleDeleteOrder(order: Order) {
    const orderIdx = orders.indexOf(order);
    if (orderIdx === -1) return;
    confirmAction(
      "Xóa đơn hàng?",
      `Xóa đơn hàng của ${order.customerName || "Khách"}? Tồn kho sẽ được hoàn lại.`,
      async () => {
        try {
          const res = await fetch("/api/sheets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "deleteOrder", row: order._row || orderIdx + 2, orderData: { products: order.products } }),
          });
          const data = await res.json();
          if (data.success) { setMessage("Đã xóa đơn hàng"); setSelected(new Set()); await fetchOrders(); }
          else setMessage("Lỗi xóa đơn hàng");
        } catch { setMessage("Lỗi kết nối"); }
      }
    );
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    confirmAction(
      `Xóa ${selected.size} đơn hàng?`,
      "Tồn kho sẽ được hoàn lại.",
      async () => {
        const items = Array.from(selected).map((idx) => {
          const order = filtered[idx];
          return { row: order._row || orders.indexOf(order) + 2, products: order.products };
        });
        try {
          const res = await fetch("/api/sheets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "deleteOrders", items }),
          });
          const data = await res.json();
          if (data.success) { setMessage(`Đã xóa ${data.deleted} đơn hàng`); setSelected(new Set()); setSelectMode(false); await fetchOrders(); }
          else setMessage("Lỗi xóa đơn hàng");
        } catch { setMessage("Lỗi kết nối"); }
      }
    );
  }

  function handleBulkPaymentStatus(status: string) {
    if (selected.size === 0) return;
    confirmAction(
      `Cập nhật thanh toán ${selected.size} đơn hàng?`,
      `Chuyển ${selected.size} đơn hàng sang "${status}"?`,
      async () => {
        const results = await Promise.all(Array.from(selected).map(async (idx) => {
          const order = filtered[idx];
          if (!order) return false;
          try {
            const res = await fetch("/api/sheets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "confirmOrder",
                row: order._row,
                orderRow: order._row,
                orderCode: order.orderCode,
                data: { paymentStatus: status },
                products: order.products,
              }),
            });
            const data = await res.json();
            return data.success;
          } catch { return false; }
        }));
        const succeeded = results.filter(Boolean).length;
        if (succeeded === selected.size) {
          setMessage(`Đã cập nhật ${succeeded} đơn hàng`);
        } else {
          setMessage(`Cập nhật ${succeeded}/${selected.size} đơn hàng (${selected.size - succeeded} lỗi)`);
        }
        setSelected(new Set());
        setSelectMode(false);
        await fetchOrders();
      }
    );
  }

  function handleBulkDeliveryStatus(status: string) {
    if (selected.size === 0) return;
    confirmAction(
      `Cập nhật giao hàng ${selected.size} đơn hàng?`,
      `Chuyển ${selected.size} đơn hàng sang "${status}"?`,
      async () => {
        const results = await Promise.all(Array.from(selected).map(async (idx) => {
          const order = filtered[idx];
          if (!order) return false;
          try {
            const res = await fetch("/api/sheets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "updateOrder",
                row: order._row,
                sheetRow: order._row,
                orderCode: order.orderCode,
                data: { deliveryStatus: status },
              }),
            });
            const data = await res.json();
            return data.success;
          } catch { return false; }
        }));
        const succeeded = results.filter(Boolean).length;
        if (succeeded === selected.size) {
          setMessage(`Đã cập nhật ${succeeded} đơn hàng`);
        } else {
          setMessage(`Cập nhật ${succeeded}/${selected.size} đơn hàng (${selected.size - succeeded} lỗi)`);
        }
        setSelected(new Set());
        setSelectMode(false);
        await fetchOrders();
      }
    );
  }

  function toggleSelect(idx: number) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((_, i) => i)));
  }

  async function handleSubmitNewOrder() {
    if (!newOrder.customerName.trim()) { setMessage("Vui lòng nhập tên khách hàng"); return; }
    setSubmittingOrder(true);
    setMessage("");
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addOrder",
          order: {
            timestamp: new Date().toISOString(),
            orderDate: new Date().toLocaleDateString("vi-VN"),
            orderCode: "",
            products: newOrder.products,
            customerName: newOrder.customerName,
            phone: newOrder.phone,
            address: newOrder.address,
            oldAddress: newOrder.oldAddress,
            notes: newOrder.notes,
            sellPrice: Number(newOrder.sellPrice) || 0,
            buyPrice: Number(newOrder.buyPrice) || 0,
            shippingCost: Number(newOrder.shippingCost) || 0,
            profit: 0,
            paymentStatus: newOrder.paymentStatus,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Đã tạo đơn hàng mới");
        setShowNewOrder(false);
        setNewOrder({
          customerName: "", phone: "", address: "", oldAddress: "",
          products: "", sellPrice: "", buyPrice: "", shippingCost: "",
          notes: "", paymentStatus: "Chưa thanh toán",
        });
        await fetchOrders();
      } else {
        setMessage("Lỗi: " + (data.error || "Không thể tạo đơn hàng"));
      }
    } catch {
      setMessage("Lỗi kết nối");
    } finally {
      setSubmittingOrder(false);
    }
  }

  function handleCopyOrder(order: Order) {
    setNewOrder({
      customerName: order.customerName || "",
      phone: order.phone || "",
      address: order.address || "",
      oldAddress: order.oldAddress || "",
      products: order.products || "",
      sellPrice: String(order.sellPrice || ""),
      buyPrice: String(order.buyPrice || ""),
      shippingCost: String(order.shippingCost || ""),
      notes: order.notes || "",
      paymentStatus: "Chưa thanh toán",
    });
    setShowNewOrder(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleRemoveProduct(order: Order, product: ParsedProduct) {
    const items = parseAndSortProducts(order.products, codeToGroup, productMap);
    const remaining = items.filter((p) => !(p.code === product.code && p.name === product.name));
    const newProducts = remaining.map((p) => `${p.qty}x ${p.name} - ${p.code}${p.price !== null ? `|${p.price}` : ""}`).join(", ");
    const removedStr = `${product.qty}x ${product.name} - ${product.code}`;
    const isPaid = order.paymentStatus === "Đã thanh toán" || order.paymentStatus === "Đã chuyển khoản";
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "editOrderProducts", row: order._row, sheetRow: order._row, orderCode: order.orderCode, newProducts, removedItems: removedStr, addedItems: "", isPaid }),
      });
      const data = await res.json();
      if (data.success) { setMessage(`Đã xóa ${product.name}`); await fetchOrders(); }
      else setMessage("Lỗi cập nhật");
    } catch { setMessage("Lỗi kết nối"); }
  }

  async function handleAddProduct(order: Order, product: Product, qty: number) {
    const orderIdx = orders.indexOf(order);
    if (orderIdx === -1) return;
    const items = parseAndSortProducts(order.products, codeToGroup, productMap);
    const existing = items.find((p) => p.code === product.code);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ qty, name: product.name, code: product.code, group: product.group || "", series: product.series || "", price: product.price });
    }
    const newProducts = items.map((p) => `${p.qty}x ${p.name} - ${p.code}${p.price !== null ? `|${p.price}` : ""}`).join(", ");
    const addedStr = `${qty}x ${product.name} - ${product.code}`;
    const isPaid = order.paymentStatus === "Đã thanh toán" || order.paymentStatus === "Đã chuyển khoản";
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "editOrderProducts", row: order._row, sheetRow: order._row, orderCode: order.orderCode, newProducts, removedItems: "", addedItems: addedStr, isPaid }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Đã thêm ${product.name}`);
        setProductSearch((prev) => { const next = { ...prev }; delete next[orderIdx]; return next; });
        setShowProductSearch((prev) => ({ ...prev, [orderIdx]: false }));
        await fetchOrders();
      } else { setMessage("Lỗi cập nhật"); }
    } catch { setMessage("Lỗi kết nối"); }
  }

  async function handleChangeQty(order: Order, product: ParsedProduct, delta: number) {
    const items = parseAndSortProducts(order.products, codeToGroup, productMap);
    const target = items.find((p) => p.code === product.code && p.name === product.name);
    if (!target) return;

    const newQty = target.qty + delta;
    const isPaid = order.paymentStatus === "Đã thanh toán" || order.paymentStatus === "Đã chuyển khoản";

    let newProducts: string;
    let removedItems = "";
    let addedItems = "";

    if (newQty <= 0) {
      const remaining = items.filter((p) => !(p.code === product.code && p.name === product.name));
      newProducts = remaining.map((p) => `${p.qty}x ${p.name} - ${p.code}${p.price !== null ? `|${p.price}` : ""}`).join(", ");
      removedItems = `${target.qty}x ${target.name} - ${target.code}`;
    } else {
      target.qty = newQty;
      newProducts = items.map((p) => `${p.qty}x ${p.name} - ${p.code}${p.price !== null ? `|${p.price}` : ""}`).join(", ");
      if (delta > 0) addedItems = `${delta}x ${target.name} - ${target.code}`;
      else removedItems = `${Math.abs(delta)}x ${target.name} - ${target.code}`;
    }

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "editOrderProducts", row: order._row, sheetRow: order._row, orderCode: order.orderCode, newProducts, removedItems, addedItems, isPaid }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(delta > 0 ? `+${delta} ${target.name}` : `${delta} ${target.name}`);
        await fetchOrders();
      } else { setMessage("Lỗi cập nhật"); }
    } catch { setMessage("Lỗi kết nối"); }
  }

  const updateOrderField = useCallback(
    async (orderIndex: number, field: "buyPrice" | "shippingCost" | "notes" | "orderCode", value: string | number, sheetRow?: number, orderCode?: string) => {
      try {
        await fetch("/api/sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateOrder", row: sheetRow || orderIndex, sheetRow, orderCode, data: { [field]: value } }),
        });
      } catch {}
    }, []
  );

  function formatPrice(val: number): string {
    return formatNumber(val) + " đ";
  }

  function getProfit(order: Order, idx: number): number {
    const buy = Number(editValues[idx]?.buyPrice) || order.buyPrice || 0;
    const ship = Number(editValues[idx]?.shippingCost) || order.shippingCost || 0;
    return calcProductsTotal(order.products) - buy - ship;
  }

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  function getHanoiTime(): string {
    const now = new Date();
    const hanoiTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    return hanoiTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + hanoiTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  function renderProductLines(productsStr: string): string {
    const sorted = parseAndSortProducts(productsStr, codeToGroup, productMap);
    return sorted.map((p) => {
      const seriesTag = p.series ? ` <span style="color:#e53e3e;font-weight:600;">[${esc(p.series)}]</span>` : "";
      let priceInfo = "";
      if (p.price !== null) {
        const lineTotal = p.price * p.qty * 1000;
        priceInfo = ` — ${formatPrice(p.price)} x ${p.qty} = ${formatNumber(lineTotal)} đ`;
      }
      return `<div>${p.qty}x ${esc(p.name)} (${esc(p.code)})${seriesTag}${priceInfo}</div>`;
    }).join("");
  }

  function calcProductsTotal(productsStr: string): number {
    const sorted = parseAndSortProducts(productsStr, codeToGroup, productMap);
    return sorted.reduce((sum, p) => {
      if (p.price === null) return sum;
      return sum + p.price * p.qty * 1000;
    }, 0);
  }

  function buildOrderPdfHtml(order: Order): string {
    const dateStr = getHanoiTime();
    const sorted = parseAndSortProducts(order.products, codeToGroup, productMap);
    const receiptTotal = calcProductsTotal(order.products);

    const productLines = sorted.map((p) => {
      const seriesTag = p.series ? `<span style="color:#e53e3e;font-weight:600;">[${esc(p.series)}]</span> ` : "";
      let priceInfo = "";
      if (p.price !== null) {
        const lineTotal = p.price * p.qty * 1000;
        priceInfo = ` — <span style="color:#555;">${formatPrice(p.price)} x ${p.qty} = ${formatNumber(lineTotal)} đ</span>`;
      }
      return `<div style="padding:1px 0;">${p.qty}x ${esc(p.name)} <span style="color:#888;">(${esc(p.code)})</span> ${seriesTag}${priceInfo}</div>`;
    }).join("");

    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a202c; padding: 8mm; font-size: 13px; line-height: 1.5;">
      <div style="text-align:center; font-size:16px; font-weight:700; margin-bottom:2px; border-bottom:2px solid #e53e3e; padding-bottom:4px;">
        V1ncc TCG Card Shop
      </div>
      ${order.orderCode ? `<div style="text-align:center; font-size:10px; color:#999; margin-bottom:4px;">Mã đơn: ${esc(order.orderCode)}</div>` : ""}
      <div style="margin-bottom:3px;"><b>Khách hàng:</b> ${esc(order.customerName || "Khách")}</div>
      <div style="margin-bottom:3px;"><b>SĐT:</b> ${esc(order.phone || "")}</div>
      <div style="margin-bottom:3px;"><b>Ngày:</b> ${dateStr}</div>
      <div style="margin:5px 0; padding:4px; background:#f5f5f5; border-radius:3px;">
        <div style="font-weight:700; margin-bottom:2px; font-size:13px;">Sản phẩm:</div>
        ${productLines}
      </div>
      ${order.oldAddress ? `<div style="margin-bottom:2px;"><b>Địa chỉ cũ:</b> ${esc(order.oldAddress)}</div>` : ""}
      <div style="margin-bottom:3px;"><b>Địa chỉ mới:</b> ${esc(order.address || "")}</div>
      ${order.notes ? `<div style="margin-bottom:3px;"><b>Ghi chú:</b> ${esc(order.notes)}</div>` : ""}
      <div style="margin-top:5px; padding:4px 8px; border-radius:3px; font-weight:600; text-align:center; font-size:13px; background:${order.paymentStatus === "Đã thanh toán" ? "#d1fae5" : "#fff7ed"}; color:${order.paymentStatus === "Đã thanh toán" ? "#065f46" : "#9a3412"};">
        ${order.paymentStatus === "Đã thanh toán" ? "Đã thanh toán" : "Chưa thanh toán"}
      </div>
      <div style="font-size:14px; font-weight:700; text-align:right; margin-top:6px; padding-top:4px; border-top:1.5px solid #333;">
        Tổng: ${formatPrice(receiptTotal)}
      </div>
    </div>`;
  }

  async function handleDownloadPdf(order: Order) {
    if (pdfGenerating.current) return;
    pdfGenerating.current = true;
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const container = document.createElement("div");
      container.innerHTML = buildOrderPdfHtml(order);
      const safeName = (order.customerName || "order").replace(/\s+/g, "-");
      const datePart = (order.orderDate || "").replace(/\//g, "-");

      await html2pdf().set({
        margin: 0,
        filename: `order-${safeName}-${datePart}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: [105, 148], orientation: "portrait" },
      }).from(container).save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      setMessage("Lỗi tạo PDF");
    } finally {
      pdfGenerating.current = false;
    }
  }

  function handlePrintSingle(order: Order) {
    const dateStr = getHanoiTime();
    const productLines = renderProductLines(order.products);
    const receiptTotal = calcProductsTotal(order.products);
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Order - ${esc(order.customerName || "Khách")}</title>
  <style>
    @page { size: A6 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 5mm; color: #1a202c; font-size: 13px; }
    .field { margin-bottom: 4px; font-size: 13px; }
    .field strong { display: inline-block; min-width: 80px; }
    .products { margin: 6px 0; padding: 5px; background: #f9f9f9; border-radius: 3px; font-size: 12px; line-height: 1.5; }
    .products-title { font-weight: 700; margin-bottom: 2px; font-size: 13px; }
    .status { margin-top: 6px; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: 600; text-align: center; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-unpaid { background: #fff7ed; color: #9a3412; }
    .total { font-size: 16px; font-weight: 700; text-align: right; margin-top: 6px; }
    .header { font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 6px; border-bottom: 1.5px solid #333; padding-bottom: 4px; }
  </style>
</head>
<body>
  <div class="header">V1ncc TCG Card Shop</div>
  <div class="field"><strong>Customer:</strong> ${esc(order.customerName || "Khách")}</div>
  <div class="field"><strong>Phone:</strong> ${esc(order.phone || "")}</div>
  <div class="field"><strong>Date:</strong> ${dateStr}</div>
  <div class="products">
    <div class="products-title">Products:</div>
    ${productLines}
  </div>
  ${order.oldAddress ? `<div class="field"><strong>Địa chỉ cũ:</strong> ${esc(order.oldAddress)}</div>` : ""}
  <div class="field"><strong>Địa chỉ mới:</strong> ${esc(order.address || "")}</div>
  ${order.notes ? `<div class="field"><strong>Ghi chú:</strong> ${esc(order.notes)}</div>` : ""}
  <div class="status ${order.paymentStatus === "Đã thanh toán" ? "status-paid" : "status-unpaid"}">
    ${order.paymentStatus === "Đã thanh toán" ? "Đã thanh toán" : "Chưa thanh toán"}
  </div>
  <div class="total">Tổng: ${formatPrice(receiptTotal)}</div>
</body>
</html>`;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
  }

  function handlePrintTable() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const ordersToPrint = filtered;
    const totalAll = ordersToPrint.reduce((sum, o) => sum + calcProductsTotal(o.products), 0);
    const totalPaid = ordersToPrint.filter((o) => o.paymentStatus === "Đã thanh toán" || o.paymentStatus === "Đã chuyển khoản").reduce((sum, o) => sum + calcProductsTotal(o.products), 0);
    const paidCount = ordersToPrint.filter((o) => o.paymentStatus === "Đã thanh toán" || o.paymentStatus === "Đã chuyển khoản").length;
    const orderCards = ordersToPrint.map((o) => {
      const productLines = renderProductLines(o.products);
      const receiptTotal = calcProductsTotal(o.products);
      return `
      <div class="order-card">
        <div class="header">V1ncc TCG Card Shop</div>
        <div class="field"><strong>Customer:</strong> ${esc(o.customerName || "Khách")}</div>
        <div class="field"><strong>Phone:</strong> ${esc(o.phone || "")}</div>
        <div class="field"><strong>Date:</strong> ${getHanoiTime()}</div>
        <div class="products"><div class="products-title">Products:</div>${productLines}</div>
        ${o.oldAddress ? `<div class="field"><strong>Địa chỉ cũ:</strong> ${esc(o.oldAddress)}</div>` : ""}
        <div class="field"><strong>Địa chỉ mới:</strong> ${esc(o.address || "")}</div>
        ${o.notes ? `<div class="field"><strong>Ghi chú:</strong> ${esc(o.notes)}</div>` : ""}
        <div class="status ${o.paymentStatus === "Đã thanh toán" ? "status-paid" : "status-unpaid"}">
          ${o.paymentStatus === "Đã thanh toán" ? "Đã thanh toán" : "Chưa thanh toán"}
        </div>
        <div class="total">Tổng: ${formatPrice(receiptTotal)}</div>
      </div>`;
    }).join("");
    printWindow.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Danh sách đơn hàng</title>
  <style>
    @page { size: A6 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 5mm; color: #1a202c; }
    .order-card { page-break-inside: avoid; border-bottom: 1px dashed #ccc; padding-bottom: 12px; margin-bottom: 12px; }
    .order-card:last-child { border-bottom: none; }
    .header { font-size: 14px; font-weight: 700; text-align: center; margin-bottom: 5px; border-bottom: 1.5px solid #333; padding-bottom: 3px; }
    .field { margin-bottom: 3px; font-size: 11px; }
    .field strong { display: inline-block; min-width: 80px; }
    .products { margin: 5px 0; padding: 4px; background: #f9f9f9; border-radius: 3px; font-size: 10px; line-height: 1.5; }
    .products-title { font-weight: 700; margin-bottom: 2px; font-size: 11px; }
    .status { margin-top: 4px; padding: 3px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; text-align: center; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-unpaid { background: #fff7ed; color: #9a3412; }
    .total { font-size: 13px; font-weight: 700; text-align: right; margin-top: 4px; }
    .summary { text-align: center; font-size: 10px; color: #718096; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="summary">
    <div>Tổng: ${ordersToPrint.length} đơn | Đã TT: ${paidCount}/${ordersToPrint.length}</div>
    <div>Tổng tiền: ${formatPrice(totalAll)} | Đã thanh toán: ${formatPrice(totalPaid)}</div>
  </div>
  ${orderCards}
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
  }

  const isPaid = (o: Order) => o.paymentStatus === "Đã thanh toán" || o.paymentStatus === "Đã chuyển khoản";

  const filtered = orders.filter((o) => {
    if (filter === "pending") return o.paymentStatus === "Chưa thanh toán";
    if (filter === "paid") return isPaid(o);
    if (filter === "delivered") return o.deliveryStatus === "Đã giao";
    if (filter === "undelivered") return o.deliveryStatus !== "Đã giao";
    return true;
  }).filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (o.customerName || "").toLowerCase().includes(q) || (o.orderCode || "").toLowerCase().includes(q);
  });

  const totalRevenue = orders.filter(isPaid).reduce((sum, o) => sum + calcProductsTotal(o.products), 0);
  const pendingCount = orders.filter((o) => o.paymentStatus === "Chưa thanh toán").length;
  const deliveredCount = orders.filter((o) => o.deliveryStatus === "Đã giao").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AdminNav active="orders" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 relative">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{orders.length}</p>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
            title="Làm mới"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Chờ thanh toán</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Đã giao</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{deliveredCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Doanh thu</p>
          <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* Filter + Actions */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc mã đơn..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 w-full sm:w-56"
        />
        {([["all", "Tất cả"], ["pending", "Chưa thanh toán"], ["paid", "Đã thanh toán"], ["delivered", "Đã giao"], ["undelivered", "Chưa giao"]] as const).map(([f, label]) => (
          <button key={f} onClick={() => { setFilter(f); setSelected(new Set()); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => { setShowNewOrder(!showNewOrder); setNewOrder({ customerName: "", phone: "", address: "", oldAddress: "", products: "", sellPrice: "", buyPrice: "", shippingCost: "", notes: "", paymentStatus: "Chưa thanh toán" }); }}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Đơn mới
          </button>
          <button onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectMode ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {selectMode ? "Hủy chọn" : "Chọn nhiều"}
          </button>
          {selectMode && selected.size > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">TT:</span>
              {(["Chưa thanh toán", "Đã chuyển khoản", "Đã thanh toán"] as const).map((s) => (
                <button key={s} onClick={() => handleBulkPaymentStatus(s)}
                  className={`text-xs px-2 py-1 rounded font-semibold transition-colors ${
                    s === "Đã thanh toán" ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : s === "Đã chuyển khoản" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                  }`}>
                  {s === "Chưa thanh toán" ? "Chưa TT" : s === "Đã chuyển khoản" ? "Đã CK" : "Đã TT"}
                </button>
              ))}
              <span className="w-px h-5 bg-slate-200 mx-1"></span>
              <span className="text-xs text-slate-400 font-medium">GH:</span>
              {(["Chưa giao", "Đang giao", "Đã giao"] as const).map((s) => (
                <button key={s} onClick={() => handleBulkDeliveryStatus(s)}
                  className={`text-xs px-2 py-1 rounded font-semibold transition-colors ${
                    s === "Đã giao" ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : s === "Đang giao" ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}>
                  {s}
                </button>
              ))}
              <span className="w-px h-5 bg-slate-200 mx-1"></span>
              <button onClick={handleBulkDelete} className="text-xs px-2 py-1 rounded font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                Xóa ({selected.size})
              </button>
            </div>
          )}
          <button onClick={handlePrintTable} className="px-4 py-1.5 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081-.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12Zm-2.25 0h.008v.008H16.5V12Z" />
            </svg>
            In tất cả
          </button>
        </div>
      </div>

      {/* Select all bar */}
      {selectMode && filtered.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Chọn tất cả ({filtered.length})
          </label>
          {selected.size > 0 && <span className="text-sm text-slate-400">Đã chọn {selected.size}/{filtered.length}</span>}
        </div>
      )}

      {message && <p className={`text-sm px-3 py-2 rounded-lg mb-4 ${message.startsWith("Lỗi") ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}`}>{message}</p>}

      {/* New Order Form */}
      {showNewOrder && (
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 mb-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">Tạo đơn hàng mới</h3>
            <button onClick={() => setShowNewOrder(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input type="text" placeholder="Tên khách hàng *" value={newOrder.customerName}
              onChange={(e) => setNewOrder((p) => ({ ...p, customerName: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400" />
            <input type="tel" placeholder="Số điện thoại" value={newOrder.phone}
              onChange={(e) => setNewOrder((p) => ({ ...p, phone: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400" />
            <input type="text" placeholder="Địa chỉ mới" value={newOrder.address}
              onChange={(e) => setNewOrder((p) => ({ ...p, address: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400" />
            <input type="text" placeholder="Địa chỉ cũ" value={newOrder.oldAddress}
              onChange={(e) => setNewOrder((p) => ({ ...p, oldAddress: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400" />
            <div className="sm:col-span-2">
              <textarea placeholder="Sản phẩm (VD: 1x Pikachu - PC-PO-025, 2x Charizard - PC-PO-006)" value={newOrder.products}
                onChange={(e) => setNewOrder((p) => ({ ...p, products: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 resize-none" />
            </div>
            <input type="number" placeholder="Giá bán" value={newOrder.sellPrice}
              onChange={(e) => setNewOrder((p) => ({ ...p, sellPrice: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400" />
            <input type="number" placeholder="Giá mua" value={newOrder.buyPrice}
              onChange={(e) => setNewOrder((p) => ({ ...p, buyPrice: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400" />
            <input type="number" placeholder="Ship + Đóng gói" value={newOrder.shippingCost}
              onChange={(e) => setNewOrder((p) => ({ ...p, shippingCost: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400" />
            <input type="text" placeholder="Ghi chú" value={newOrder.notes}
              onChange={(e) => setNewOrder((p) => ({ ...p, notes: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400" />
            <select value={newOrder.paymentStatus}
              onChange={(e) => setNewOrder((p) => ({ ...p, paymentStatus: e.target.value as "Chưa thanh toán" | "Đã chuyển khoản" | "Đã thanh toán" }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400">
              <option value="Chưa thanh toán">Chưa thanh toán</option>
              <option value="Đã chuyển khoản">Đã chuyển khoản</option>
              <option value="Đã thanh toán">Đã thanh toán</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmitNewOrder} disabled={submittingOrder}
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
              {submittingOrder ? "Đang tạo..." : "Tạo đơn hàng"}
            </button>
            <button onClick={() => setShowNewOrder(false)}
              className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
              Hủy
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><p className="text-slate-500">Đang tải đơn hàng...</p></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400"><p>Không có đơn hàng</p></div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, idx) => {
            const orderIdx = orders.indexOf(order);
            const isSelected = selected.has(idx);
            return (
              <div key={order.orderCode || order._row || orderIdx}
                className={`bg-white rounded-2xl border shadow-sm p-5 animate-fade-in transition-colors ${isSelected ? "border-red-200 bg-red-50/30" : "border-slate-100"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {selectMode && (
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(idx)} className="mt-1 w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                    )}
                    <div>
                      <p className="font-medium text-slate-800">{order.customerName || "Khách"}</p>
                      <p className="text-xs text-slate-400">{order.orderDate || order.timestamp} · {order.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <select
                      value={pendingStatus[orderIdx] || order.paymentStatus || "Chưa thanh toán"}
                      onChange={(e) => updatePaymentStatus(order, e.target.value)}
                      className={`text-xs px-2 py-1.5 rounded-lg font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-blue-400 ${
                        order.paymentStatus === "Đã thanh toán"
                          ? "bg-green-50 text-green-700"
                          : order.paymentStatus === "Đã chuyển khoản"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      <option value="Chưa thanh toán">Chưa thanh toán</option>
                      <option value="Đã chuyển khoản">Đã chuyển khoản</option>
                      <option value="Đã thanh toán">Đã thanh toán</option>
                    </select>
                    <select
                      value={order.deliveryStatus || "Chưa giao"}
                      onChange={(e) => updateDeliveryStatus(order, e.target.value)}
                      className={`text-xs px-2 py-1.5 rounded-lg font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-blue-400 ${
                        order.deliveryStatus === "Đã giao"
                          ? "bg-blue-50 text-blue-700"
                          : order.deliveryStatus === "Đang giao"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      <option value="Chưa giao">Chưa giao</option>
                      <option value="Đang giao">Đang giao</option>
                      <option value="Đã giao">Đã giao</option>
                    </select>
                    <button onClick={() => handleCopyOrder(order)} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-semibold transition-colors flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                      </svg>
                      Copy
                    </button>
                    <button onClick={() => handleRefundOrder(order)} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-semibold transition-colors">Hoàn hàng</button>
                    <button onClick={() => handleDeleteOrder(order)} className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 font-semibold transition-colors">Xóa</button>
                    <button onClick={() => handlePrintSingle(order)} className="text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold transition-colors flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081-.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12Zm-2.25 0h.008v.008H16.5V12Z" />
                      </svg>
                      In
                    </button>
                    <button onClick={() => handleDownloadPdf(order)} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      PDF
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs uppercase tracking-wide">Sản phẩm</span>
                      <button
                        onClick={() => setExpandedOrders((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                      >
                        {expandedOrders[idx] ? "Thu gọn" : `Chi tiết (${parseAndSortProducts(order.products, codeToGroup, productMap).length})`}
                      </button>
                    </div>
                    <button
                      onClick={() => setShowProductSearch((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                      className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 font-medium transition-colors"
                    >
                      {showProductSearch[idx] ? "Đóng" : "+ Thêm thẻ"}
                    </button>
                  </div>
                  {expandedOrders[idx] && (
                    <div className="space-y-1">
                      {parseAndSortProducts(order.products, codeToGroup, productMap).map((p, pi) => (
                        <div key={pi} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-2.5 py-1.5 group">
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleChangeQty(order, p, -1)}
                              className="w-6 h-6 rounded bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-500 text-xs font-bold flex items-center justify-center transition-colors"
                              title="Giảm 1"
                            >-</button>
                            <span className="w-6 text-center font-semibold text-slate-700">{p.qty}</span>
                            <button
                              onClick={() => handleChangeQty(order, p, 1)}
                              className="w-6 h-6 rounded bg-slate-200 hover:bg-amber-100 hover:text-amber-600 text-slate-500 text-xs font-bold flex items-center justify-center transition-colors"
                              title="Tăng 1"
                            >+</button>
                          </div>
                          <span className="flex-1 min-w-0">
                            <span className="text-slate-800">{p.name}</span>{" "}
                            <span className="text-slate-400 font-mono text-xs">({p.code})</span>
                            {p.price !== null && (
                              <span className="text-slate-500 text-xs ml-1">
                                — {formatPrice(p.price)} × {p.qty} = {formatNumber(p.price * p.qty * 1000)} đ
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => handleRemoveProduct(order, p)}
                            className="text-red-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Xóa thẻ này"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {parseAndSortProducts(order.products, codeToGroup, productMap).length === 0 && (
                        <p className="text-xs text-slate-400 italic">Chưa có sản phẩm</p>
                      )}
                    </div>
                  )}
                  {expandedOrders[idx] && showProductSearch[idx] && (
                    <div className="mt-2 relative">
                      <input
                        type="text"
                        placeholder="Tìm thẻ theo tên hoặc mã..."
                        value={productSearch[idx] || ""}
                        onChange={(e) => setProductSearch((prev) => ({ ...prev, [idx]: e.target.value }))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                        autoFocus
                      />
                      {(productSearch[idx] || "").length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {products
                            .filter((p) => {
                              const q = (productSearch[idx] || "").toLowerCase();
                              return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
                            })
                            .slice(0, 12)
                            .map((p) => (
                              <button
                                key={p.id}
                                onClick={() => handleAddProduct(order, p, 1)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between gap-2"
                              >
                                <span>
                                  <span className="font-medium text-slate-800">{p.name}</span>{" "}
                                  <span className="text-slate-400 font-mono text-xs">({p.code})</span>
                                </span>
                                <span className="text-xs text-slate-500 shrink-0">
                                  {p.price !== null ? formatPrice(p.price) : "Liên hệ"}
                                  {p.stock > 0 && <span className="text-green-600 ml-1">({p.stock} có sẵn)</span>}
                                </span>
                              </button>
                            ))
                          }
                          {products.filter((p) => {
                            const q = (productSearch[idx] || "").toLowerCase();
                            return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
                          }).length === 0 && (
                            <p className="px-3 py-2 text-xs text-slate-400">Không tìm thấy thẻ</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs">GIÁ BÁN</span>
                    <p className="font-medium text-slate-800">{formatPrice(calcProductsTotal(order.products))}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">GIÁ MUA</span>
                    <input type="number" value={editValues[orderIdx]?.buyPrice ?? ""} placeholder="0"
                      onChange={(e) => setEditValues((prev) => ({ ...prev, [orderIdx]: { buyPrice: e.target.value, shippingCost: prev[orderIdx]?.shippingCost ?? "", notes: prev[orderIdx]?.notes ?? "" } }))}
                      onBlur={(e) => updateOrderField(orderIdx, "buyPrice", Number(e.target.value) || 0, order._row, order.orderCode)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">SHIP + ĐÓNG GÓI</span>
                    <input type="number" value={editValues[orderIdx]?.shippingCost ?? ""} placeholder="0"
                      onChange={(e) => setEditValues((prev) => ({ ...prev, [orderIdx]: { buyPrice: prev[orderIdx]?.buyPrice ?? "", shippingCost: e.target.value, notes: prev[orderIdx]?.notes ?? "" } }))}
                      onBlur={(e) => updateOrderField(orderIdx, "shippingCost", Number(e.target.value) || 0, order._row, order.orderCode)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">LỢI NHUẬN</span>
                    <p className={`font-medium ${getProfit(order, orderIdx) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatPrice(getProfit(order, orderIdx))}
                    </p>
                  </div>
                </div>

                {order.address && <p className="text-xs text-slate-400 mt-2">Địa chỉ mới: {order.address}</p>}
                {order.oldAddress && <p className="text-xs text-slate-400 mt-1">Địa chỉ cũ: {order.oldAddress}</p>}
                <div className="mt-3">
                  <label className="text-xs font-semibold text-amber-600 uppercase tracking-wide">📝 Ghi chú</label>
                  <input type="text" value={editValues[orderIdx]?.notes ?? ""} placeholder="Thêm ghi chú..."
                    onChange={(e) => setEditValues((prev) => ({ ...prev, [orderIdx]: { buyPrice: prev[orderIdx]?.buyPrice ?? "", shippingCost: prev[orderIdx]?.shippingCost ?? "", notes: e.target.value } }))}
                    onBlur={(e) => updateOrderField(orderIdx, "notes", e.target.value, order._row, order.orderCode)}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <a href="/admin" className="text-sm text-blue-600 hover:underline">← Quay lại quản lý</a>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

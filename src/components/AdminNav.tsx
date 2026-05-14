export default function AdminNav({ active }: { active: "dashboard" | "products" | "orders" | "customers" | "validate" | "qr" | "nhap-kho" }) {
  const links = [
    { href: "/admin/dashboard", label: "Dashboard", key: "dashboard" as const },
    { href: "/admin", label: "Sản phẩm", key: "products" as const },
    { href: "/admin/orders", label: "Đơn hàng", key: "orders" as const },
    { href: "/admin/customers", label: "Khách hàng", key: "customers" as const },
    { href: "/admin/nhap-kho", label: "Nhập kho", key: "nhap-kho" as const },
    { href: "/admin/qr", label: "QR Code", key: "qr" as const },
    { href: "/admin/validate", label: "Validate", key: "validate" as const },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <a href="/admin" className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-8 w-auto rounded-lg" />
        </a>
        <h1 className="text-xl font-bold text-slate-800">
          {active === "dashboard" && "Dashboard"}
          {active === "products" && "Quản lý sản phẩm"}
          {active === "orders" && "Quản lý đơn hàng"}
          {active === "customers" && "Khách hàng"}
          {active === "validate" && "Card Validation"}
        </h1>
      </div>
      <nav className="flex gap-1.5">
        {links.map((link) => (
          <a
            key={link.key}
            href={link.href}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              active === link.key
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

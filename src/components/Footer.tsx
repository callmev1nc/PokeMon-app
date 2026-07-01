"use client";

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-sunken)] text-[var(--text-primary)] mt-auto border-t border-[var(--border-accent)]">
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-24 sm:pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="text-[var(--color-gold-bright)] font-semibold text-sm px-2.5 py-1 rounded-lg tracking-[0.15em] font-display border border-[var(--border-accent)]">
                V1NCC
              </div>
              <span className="text-[var(--text-muted)] font-mono uppercase tracking-[0.15em] text-[10px]">TCG Shop</span>
            </div>
            <p className="text-white/40 text-xs leading-relaxed">
              Premium Pokemon Trading Cards &bull; Vietnam<br />
              100% Authentic &bull; Fast Shipping
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-bold text-sm mb-3 font-display">SHOP</h4>
            <div className="flex flex-col gap-2">
              <a href="/" className="text-white/50 hover:text-white text-xs transition-colors">All Cards</a>
              <a href="/hot-items" className="text-white/50 hover:text-white text-xs transition-colors">Hot Items</a>
              <a href="/new-arrivals" className="text-white/50 hover:text-white text-xs transition-colors">New Arrivals</a>
              <a href="/sets" className="text-white/50 hover:text-white text-xs transition-colors">Sets / Series</a>
              <a href="/types" className="text-white/50 hover:text-white text-xs transition-colors">Browse by Type</a>
            </div>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-bold text-sm mb-3 font-display">INFO</h4>
            <div className="flex flex-col gap-2">
              <a href="/order-tracking" className="text-white/50 hover:text-white text-xs transition-colors">Track Order</a>
              <a href="/account" className="text-white/50 hover:text-white text-xs transition-colors">My Account</a>
              <a href="/admin" className="text-white/50 hover:text-white text-xs transition-colors">Admin</a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center">
          <p className="text-white/25 text-[10px]">
            &copy; {new Date().getFullYear()} V1NCC TCG. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

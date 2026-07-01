"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import useSWR from "swr";
import type { Product } from "@/lib/types";
import { TYPE_COLORS, GROUP_LABELS } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { useCardTilt } from "@/hooks/useCardTilt";
import Header from "@/components/Header";
import CardImage from "@/components/CardImage";
import LowStockBadge from "@/components/LowStockBadge";
import ProductCard from "@/components/ProductCard";
import { useToast } from "@/components/NotificationToast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<><Header onCartClick={() => {}} /><div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" /></div></>}>
      <ProductDetailContent />
    </Suspense>
  );
}

function ProductDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const locale = useLocaleStore((s) => s.locale);
  const { data, isLoading } = useSWR("/api/products", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120000,
  });
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();
  const inCart = useCartStore(
    useCallback((s) => {
      const item = s.items.find((i) => i.product.id === id);
      return item?.quantity ?? 0;
    }, [id])
  );
  const toggleWish = useWishlistStore((s) => s.toggle);
  const wishIds = useWishlistStore((s) => s.ids);

  const allProducts = Array.isArray(data) ? data : data?.data || [];
  const product = allProducts.find((p: Product) => p.id === id) || null;
  const isWished = product ? wishIds.includes(product.id) : false;

  const displayPrice = (price: number | null): string => {
    if (price === null) return t("contact.price", locale);
    return formatPrice(price);
  };

  const { ref: tiltRef, handleMouseEnter, handleMouseMove, handleMouseLeave } = useCardTilt();
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    if (!product || allProducts.length === 0) return;
    const sameGroup = allProducts.filter(
      (p: Product) => p.group === product.group && p.id !== product.id
    ).slice(0, 4);
    setRelated(sameGroup);
  }, [product, allProducts]);

  if (isLoading) {
    return (
      <>
        <Header onCartClick={() => {}} />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header onCartClick={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400 dark:text-slate-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-slate-500">{t("product.notFound", locale)}</p>
          <a href="/" className="text-amber-400 text-sm mt-3 inline-flex items-center gap-1 hover:text-amber-300 font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            {t("common.backToShop", locale)}
          </a>
        </div>
      </>
    );
  }

  const maxQty = product.stock - inCart;
  const isOutOfStock = product.stock === 0;
  const noPrice = product.price === null;
  const isHolo = ["Holo", "EX", "Prize Card", "Holo Prize Card", "EX Prize Card"].includes(
    product.displayType
  );

  const handleAdd = () => {
    if (maxQty <= 0 || noPrice) return;
    addItem(product, qty);
    setAdded(true);
    showToast(`${t("cart.added", locale)} ${qty} × ${product.name}`, "success");
    setTimeout(() => setAdded(false), 1500);
    setQty(1);
  };

  return (
    <>
      <Header onCartClick={() => {}} />

      <main className="max-w-5xl mx-auto px-4 py-4 md:py-6 pb-20 sm:pb-6 animate-fade-in">
        {/* Breadcrumb */}
        <a href="/" className="text-xs text-slate-400 dark:text-slate-500 hover:text-amber-400 transition-colors mb-5 inline-flex items-center gap-1 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          {t("common.back", locale)}
        </a>

        <div className="vault-card overflow-hidden">
          <div className="md:flex">
            {/* Image */}
            <div
              className="vault-spotlight md:w-2/5 p-4 md:p-6 md:md:p-8 flex items-center justify-center bg-[var(--bg-sunken)] relative overflow-hidden"
              ref={tiltRef}
              onMouseEnter={handleMouseEnter}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ perspective: "700px" }}
            >
              <motion.div
                data-type={product.type}
                data-display-type={product.displayType}
                className="pedestal w-full max-w-[280px] md:max-w-[300px] relative"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="card-glow relative overflow-hidden rounded-[var(--radius-card)]">
                  <CardImage
                    src={product.imageUrl}
                    name={product.name}
                    displayType={product.displayType}
                    type={product.type}
                  />
                  {isHolo && <div className="holo-glare" aria-hidden />}
                </div>
                <div className="absolute -inset-3 bg-gradient-to-br from-amber-500/5 via-transparent to-cyan-500/5 rounded-2xl -z-10 blur-sm" style={{ transform: "translateZ(-10px)" }} />
              </motion.div>
            </div>

            {/* Details */}
            <div className="md:w-3/5 p-4 md:p-6 md:md:p-8 flex flex-col gap-3 md:gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 leading-tight tracking-wider" style={{ fontFamily: "var(--font-display)" }}>
                    {product.name}
                  </h1>
                  {product.series && (
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 font-mono tracking-tight">{product.series}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleWish(product.id)}
                  className={`p-2.5 rounded-xl border transition-all duration-300 flex-shrink-0 ${
                    isWished
                      ? "border-red-500/30 bg-red-500/10 text-red-400 scale-110"
                      : "border-slate-200 dark:border-slate-700/50 text-slate-400 dark:text-slate-600 hover:text-red-400 hover:border-red-500/30"
                  }`}
                  aria-label={isWished ? "Bỏ yêu thích" : "Yêu thích"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-5 h-5 ${isWished ? "fill-red-400" : "fill-none"}`} strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-wide ${TYPE_COLORS[product.displayType] || "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                  {product.displayType}
                </span>
                <span className="px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {GROUP_LABELS[product.group] || product.group}
                </span>
                <LowStockBadge stock={product.stock} />
              </div>

              {/* Price */}
              <div className="py-5 border-t border-b border-slate-200 dark:border-slate-700/50">
                <p className={`text-3xl md:text-5xl font-bold tracking-wider ${noPrice ? "text-slate-400" : "text-amber-400"}`} style={{ fontFamily: "var(--font-display)" }}>
                  {displayPrice(product.price)}
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5">
                  {t("product.stock", locale)}{" "}
                  <span className={`font-semibold ${product.stock <= 3 ? "text-amber-500" : "text-slate-500 dark:text-slate-400"}`}>
                    {product.stock}
                  </span>
                  {inCart > 0 && (
                    <span className="text-amber-400 ml-2 font-medium">({t("product.inCart", locale)}: {inCart})</span>
                  )}
                </p>
              </div>

              {/* Code */}
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t("product.code", locale)}{" "}
                <span className="font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded">{product.code}</span>
              </p>

              {/* Add to cart */}
              {!isOutOfStock && !noPrice && (
                <div className="flex items-center gap-3 mt-auto pt-2">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="px-3.5 py-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 py-2.5 text-sm font-bold min-w-[40px] text-center text-slate-600 dark:text-slate-300">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(Math.min(maxQty, qty + 1))}
                      className="px-3.5 py-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={maxQty <= 0}
                    className={`btn-press flex-1 py-3.5 px-5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      added
                        ? "bg-emerald-500 text-white shadow-emerald-500/20 shadow-md"
                        : maxQty <= 0
                        ? "bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                        : "btn-primary"
                    }`}
                  >
                    {added ? t("cart.addedLong", locale) : t("cart.add", locale)}
                  </button>
                </div>
              )}
              {isOutOfStock && (
                <button disabled className="w-full py-3.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed mt-auto">
                  {t("product.outOfStock", locale)}
                </button>
              )}
              {noPrice && !isOutOfStock && (
                <button disabled className="w-full py-3.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed mt-auto">
                  {t("product.contact", locale)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl text-amber-400 tracking-wider mb-5" style={{ fontFamily: "var(--font-display)" }}>
              {t("product.related", locale)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

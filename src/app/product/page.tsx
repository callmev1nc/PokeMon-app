"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import { TYPE_COLORS, GROUP_LABELS } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useLocaleStore } from "@/store/localeStore";
import { t } from "@/lib/i18n";
import Header from "@/components/Header";
import CardImage from "@/components/CardImage";
import LowStockBadge from "@/components/LowStockBadge";
import ProductCard from "@/components/ProductCard";

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<><Header onCartClick={() => {}} /><div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" /></div></>}>
      <ProductDetailContent />
    </Suspense>
  );
}

function ProductDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const locale = useLocaleStore((s) => s.locale);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => product ? s.ids.includes(product.id) : false);

  function formatPrice(price: number | null): string {
    if (price === null) return t("contact.price", locale);
    return new Intl.NumberFormat("vi-VN").format(price * 1000) + " đ";
  }

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        setAllProducts(data);
        const found = data.find((p) => p.id === id);
        setProduct(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product || allProducts.length === 0) return;
    const sameGroup = allProducts.filter(
      (p) => p.group === product.group && p.id !== product.id
    ).slice(0, 4);
    setRelated(sameGroup);
  }, [product, allProducts]);

  if (loading) {
    return (
      <>
        <Header onCartClick={() => {}} />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header onCartClick={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-lg text-slate-400">{t("product.notFound", locale)}</p>
          <a href="/" className="text-brand text-sm mt-2 inline-block hover:underline">
            {t("common.backToShop", locale)}
          </a>
        </div>
      </>
    );
  }

  const cartItem = cartItems.find((i) => i.product.id === product.id);
  const inCart = cartItem?.quantity ?? 0;
  const maxQty = product.stock - inCart;
  const isOutOfStock = product.stock === 0;
  const noPrice = product.price === null;

  const handleAdd = () => {
    if (maxQty <= 0 || noPrice) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    setQty(1);
  };

  return (
    <>
      <Header onCartClick={() => {}} />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <a href="/" className="text-sm text-slate-400 hover:text-brand transition-colors mb-4 inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          {t("common.back", locale)}
        </a>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="md:flex">
            {/* Image */}
            <div className="md:w-2/5 p-6 flex items-center justify-center bg-slate-50">
              <div className="w-full max-w-[280px]">
                <CardImage
                  src={product.imageUrl}
                  name={product.name}
                  displayType={product.displayType}
                />
              </div>
            </div>

            {/* Details */}
            <div className="md:w-3/5 p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">{product.name}</h1>
                  {product.series && (
                    <p className="text-sm text-slate-400 mt-1">{product.series}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleWish(product.id)}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isWished
                        ? "border-red-200 bg-red-50 text-red-500"
                        : "border-slate-200 text-slate-400 hover:text-red-400 hover:border-red-200"
                    }`}
                    aria-label={isWished ? "Bỏ yêu thích" : "Yêu thích"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-5 h-5 ${isWished ? "fill-red-500" : "fill-none"}`} strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${TYPE_COLORS[product.displayType] || "bg-slate-100 text-slate-600"}`}>
                  {product.displayType}
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 capitalize">
                  {GROUP_LABELS[product.group] || product.group}
                </span>
                <LowStockBadge stock={product.stock} />
              </div>

              {/* Price */}
              <div className="py-4 border-t border-b border-slate-100">
                <p className={`text-3xl font-bold ${noPrice ? "text-slate-300" : "text-slate-900"}`}>
                  {formatPrice(product.price)}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {t("product.stock", locale)} <span className="font-semibold text-slate-600">{product.stock}</span>
                  {inCart > 0 && (
                    <span className="text-brand ml-2 font-medium">({t("product.inCart", locale)}: {inCart})</span>
                  )}
                </p>
              </div>

              {/* Code */}
              <p className="text-xs text-slate-400">
                {t("product.code", locale)} <span className="font-mono font-semibold text-slate-500">{product.code}</span>
              </p>

              {/* Add to cart */}
              {!isOutOfStock && !noPrice && (
                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex items-center bg-slate-50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="px-3 py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 py-2.5 text-sm font-semibold min-w-[40px] text-center text-slate-700">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(Math.min(maxQty, qty + 1))}
                      className="px-3 py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={maxQty <= 0}
                    className={`btn-press flex-1 py-3 px-5 rounded-xl text-sm font-semibold transition-all ${
                      added
                        ? "bg-green-500 text-white shadow-green-200 shadow-md"
                        : maxQty <= 0
                        ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "bg-brand text-white hover:bg-brand-dark shadow-red-200 shadow-md hover:shadow-lg"
                    }`}
                  >
                    {added ? t("cart.addedLong", locale) : t("cart.add", locale)}
                  </button>
                </div>
              )}
              {isOutOfStock && (
                <button disabled className="w-full py-3 rounded-xl text-sm font-semibold bg-slate-50 text-slate-300 cursor-not-allowed">
                  {t("product.outOfStock", locale)}
                </button>
              )}
              {noPrice && !isOutOfStock && (
                <button disabled className="w-full py-3 rounded-xl text-sm font-semibold bg-slate-50 text-slate-300 cursor-not-allowed">
                  {t("product.contact", locale)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4">{t("product.related", locale)}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

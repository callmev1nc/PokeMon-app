export interface PromoCode {
  code: string;
  discountPercent: number;
  minOrder: number;
  expiresAt: string | null;
  active: boolean;
}

const PROMO_CODES: PromoCode[] = [
  { code: "WELCOME10", discountPercent: 10, minOrder: 50, expiresAt: null, active: true },
  { code: "POKEMON20", discountPercent: 20, minOrder: 100, expiresAt: "2026-12-31", active: true },
];

export function validatePromoCode(
  code: string,
  orderTotal: number
): { valid: boolean; discount: number; error?: string } {
  const promo = PROMO_CODES.find(
    (p) => p.code.toLowerCase() === code.toLowerCase()
  );
  if (!promo) return { valid: false, discount: 0, error: "Mã không tồn tại" };
  if (!promo.active)
    return { valid: false, discount: 0, error: "Mã đã hết hạn" };
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date())
    return { valid: false, discount: 0, error: "Mã đã hết hạn" };
  if (orderTotal < promo.minOrder)
    return {
      valid: false,
      discount: 0,
      error: `Đơn hàng tối thiểu ${promo.minOrder * 1000}đ`,
    };
  return {
    valid: true,
    discount: Math.round((orderTotal * promo.discountPercent) / 100),
  };
}

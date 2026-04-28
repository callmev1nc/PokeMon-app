const vndFormatter = new Intl.NumberFormat("vi-VN");

export function formatPrice(price: number | null): string {
  if (price === null) return "";
  return vndFormatter.format(price * 1000) + " đ";
}

export function formatNumber(value: number): string {
  return vndFormatter.format(value);
}

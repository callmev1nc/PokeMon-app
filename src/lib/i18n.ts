type Locale = "vi" | "en";

const translations: Record<Locale, Record<string, string>> = {
  vi: {
    "shop.name": "V1ncc TCG Card Shop",
    "shop.tagline": "Thẻ Bài Pokémon Chất Lượng",
    "cart.empty": "Giỏ hàng trống",
    "cart.add": "Thêm vào giỏ",
    "cart.added": "Đã thêm",
    "cart.title": "Giỏ hàng",
    "product.outOfStock": "Hết hàng",
    "product.contact": "Liên hệ để mua",
    "product.remaining": "Còn lại:",
    "product.inCart": "Trong giỏ:",
    "order.track": "Tra cứu đơn hàng",
    "order.all": "Tất cả",
    "filter.search": "Tìm kiếm...",
    "filter.clear": "Xóa bộ lọc",
    "common.loading": "Đang tải...",
    "common.back": "Quay lại",
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.delete": "Xóa",
    "common.edit": "Sửa",
    "common.close": "Đóng",
  },
  en: {
    "shop.name": "V1ncc TCG Card Shop",
    "shop.tagline": "Quality Pokemon Cards",
    "cart.empty": "Cart is empty",
    "cart.add": "Add to cart",
    "cart.added": "Added",
    "cart.title": "Shopping Cart",
    "product.outOfStock": "Out of stock",
    "product.contact": "Contact to buy",
    "product.remaining": "Remaining:",
    "product.inCart": "In cart:",
    "order.track": "Track Order",
    "order.all": "All",
    "filter.search": "Search...",
    "filter.clear": "Clear filters",
    "common.loading": "Loading...",
    "common.back": "Go back",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
  },
};

export function t(key: string, locale: Locale = "vi"): string {
  return translations[locale]?.[key] || key;
}

export type { Locale };

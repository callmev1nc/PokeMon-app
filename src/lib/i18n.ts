type Locale = "vi" | "en";

const translations: Record<Locale, Record<string, string>> = {
  vi: {
    // Shop
    "shop.name": "V1ncc TCG Card Shop",
    "shop.tagline": "Thẻ Bài Pokémon Chất Lượng",
    "shop.description": "Thẻ bài Pokémon chất lượng cao - Normal, Holo, Prize Card, EX. Hàng luôn cập nhật mỗi ngày!",
    "shop.footer": "Thẻ bài Pokémon chất lượng, giá tốt",

    // Hero
    "hero.authentic": "Hàng chính hãng",
    "hero.shipping": "Giao hàng toàn quốc",

    // Cart
    "cart.empty": "Giỏ hàng trống",
    "cart.emptySub": "Thêm sản phẩm để bắt đầu mua sắm",
    "cart.add": "Thêm vào giỏ",
    "cart.added": "Đã thêm",
    "cart.addedLong": "Đã thêm vào giỏ!",
    "cart.title": "Giỏ hàng",
    "cart.itemCount": "{count} sản phẩm",
    "cart.total": "Tổng cộng:",
    "cart.checkout": "Thanh toán",
    "cart.clearAll": "Xóa tất cả",
    "cart.perCard": "/ thẻ",

    // Product
    "product.outOfStock": "Hết hàng",
    "product.contact": "Liên hệ để mua",
    "product.remaining": "Còn lại:",
    "product.inCart": "Trong giỏ:",
    "product.stock": "Tồn kho:",
    "product.code": "Mã sản phẩm:",
    "product.related": "Sản phẩm liên quan",
    "product.notFound": "Không tìm thấy sản phẩm",

    // Order
    "order.track": "Tra cứu đơn hàng",
    "order.trackSub": "Nhập số điện thoại hoặc mã đơn hàng để xem trạng thái",
    "order.all": "Tất cả",
    "order.phone": "Số điện thoại",
    "order.code": "Mã đơn hàng",
    "order.search": "Tìm kiếm",
    "order.searching": "Đang tìm...",
    "order.enterPhone": "Nhập số điện thoại...",
    "order.enterCode": "Nhập mã đơn hàng...",
    "order.notFound": "Không tìm thấy đơn hàng",
    "order.checkAgain": "Kiểm tra lại {type} và thử lại",
    "order.type.phone": "số điện thoại",
    "order.type.code": "mã đơn hàng",
    "order.ordered": "Đặt hàng",
    "order.payment": "Thanh toán",
    "order.shipping": "Đang giao",
    "order.delivered": "Đã giao",
    "order.customer": "Khách hàng:",
    "order.products": "Sản phẩm:",
    "order.placed": "Đã đặt",

    // Customer info
    "customer.title": "Thông tin giao hàng",
    "customer.subtitle": "Vui lòng điền thông tin trước khi thanh toán",
    "customer.name": "Tên",
    "customer.namePlaceholder": "Họ và tên",
    "customer.nameError": "Vui lòng nhập họ tên",
    "customer.phone": "Số Điện Thoại",
    "customer.phonePlaceholder": "0xxx xxx xxx",
    "customer.phoneError": "Vui lòng nhập số điện thoại",
    "customer.phoneShort": "Số điện thoại quá ngắn",
    "customer.phoneInvalid": "Số điện thoại không hợp lệ",
    "customer.newAddress": "Địa Chỉ Mới",
    "customer.newAddressPlaceholder": "Địa chỉ nhận hàng",
    "customer.oldAddress": "Địa chỉ cũ",
    "customer.oldAddressPlaceholder": "Địa chỉ cũ",
    "customer.oldAddressError": "Vui lòng nhập địa chỉ",
    "customer.continue": "Tiếp tục thanh toán",
    "customer.saving": "Đang lưu...",
    "customer.error": "Lỗi lưu thông tin",
    "customer.connectionError": "Lỗi kết nối",

    // Checkout
    "checkout.title": "Thanh toán",
    "checkout.continueShopping": "Tiếp tục mua sắm",
    "checkout.submit": "Xác nhận đặt hàng",
    "checkout.submitting": "Đang gửi đơn hàng...",
    "checkout.success": "Đơn hàng đã được gửi thành công!",
    "checkout.successSub": "Vui lòng thanh toán qua QR code bên dưới",
    "checkout.orderDetail": "Chi tiết đơn hàng",
    "checkout.error": "Lỗi gửi đơn hàng",
    "checkout.connectionError": "Lỗi kết nối",

    // QR
    "qr.title": "Thanh toán",
    "qr.scan": "Vui lòng quét mã QR để thanh toán",
    "qr.instruction": "Sau khi chuyển khoản, vui lòng chụp ảnh màn hình và gửi qua Facebook để xác nhận đơn hàng:",
    "qr.facebook": "Gửi tin nhắn Facebook",
    "qr.done": "Đã thanh toán - Quay lại",

    // Account
    "account.title": "Tài khoản khách hàng",
    "account.subtitle": "Nhập số điện thoại để xem thông tin và lịch sử đơn hàng",
    "account.phoneLabel": "Số điện thoại",
    "account.lookup": "Tra cứu",
    "account.totalOrders": "Tổng đơn hàng",
    "account.paid": "Đã thanh toán",
    "account.totalSpent": "Tổng chi tiêu",
    "account.orderHistory": "Lịch sử đơn hàng",
    "account.backToShop": "Về cửa hàng",

    // Compare
    "compare.title": "So sánh sản phẩm",
    "compare.empty": "Chưa chọn sản phẩm nào",
    "compare.emptySub": "Thêm sản phẩm vào danh sách so sánh từ trang cửa hàng",
    "compare.viewProducts": "Xem sản phẩm",
    "compare.attribute": "Thuộc tính",
    "compare.name": "Tên sản phẩm",
    "compare.price": "Giá",
    "compare.stockField": "Tồn kho",
    "compare.type": "Loại",
    "compare.group": "Nhóm",
    "compare.series": "Series",

    // Filter
    "filter.search": "Tìm kiếm theo tên...",
    "filter.clear": "Xóa bộ lọc",
    "filter.noResults": "Không tìm thấy sản phẩm nào",
    "filter.noResultsSub": "Thay đổi bộ lọc hoặc từ khóa tìm kiếm",
    "filter.loadMore": "Xem thêm ({count} sản phẩm)",
    "filter.allShown": "Đã hiển thị tất cả {count} sản phẩm",
    "filter.count": "{total} sản phẩm · {stock} thẻ còn lại",
    "sort.name": "Tên A-Z",
    "sort.priceAsc": "Giá tăng dần",
    "sort.priceDesc": "Giá giảm dần",
    "sort.stock": "Tồn kho thấp nhất",

    // Recently viewed
    "recent.title": "Đã xem gần đây",

    // Common
    "common.loading": "Đang tải...",
    "common.back": "Quay lại",
    "common.backToShop": "Quay lại cửa hàng",
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.delete": "Xóa",
    "common.edit": "Sửa",
    "common.close": "Đóng",
    "common.manage": "Quản lý",

    // Contact
    "contact.price": "Liên hệ",
  },
  en: {
    // Shop
    "shop.name": "V1ncc TCG Card Shop",
    "shop.tagline": "Quality Pokemon Cards",
    "shop.description": "High quality Pokemon cards - Normal, Holo, Prize Card, EX. New stock updated daily!",
    "shop.footer": "Quality Pokemon cards at great prices",

    // Hero
    "hero.authentic": "Authentic products",
    "hero.shipping": "Nationwide shipping",

    // Cart
    "cart.empty": "Cart is empty",
    "cart.emptySub": "Add products to start shopping",
    "cart.add": "Add to cart",
    "cart.added": "Added",
    "cart.addedLong": "Added to cart!",
    "cart.title": "Shopping Cart",
    "cart.itemCount": "{count} items",
    "cart.total": "Total:",
    "cart.checkout": "Checkout",
    "cart.clearAll": "Clear all",
    "cart.perCard": "/ card",

    // Product
    "product.outOfStock": "Out of stock",
    "product.contact": "Contact to buy",
    "product.remaining": "Remaining:",
    "product.inCart": "In cart:",
    "product.stock": "In stock:",
    "product.code": "Product code:",
    "product.related": "Related Products",
    "product.notFound": "Product not found",

    // Order
    "order.track": "Track Order",
    "order.trackSub": "Enter phone number or order code to check status",
    "order.all": "All",
    "order.phone": "Phone number",
    "order.code": "Order code",
    "order.search": "Search",
    "order.searching": "Searching...",
    "order.enterPhone": "Enter phone number...",
    "order.enterCode": "Enter order code...",
    "order.notFound": "No orders found",
    "order.checkAgain": "Check the {type} and try again",
    "order.type.phone": "phone number",
    "order.type.code": "order code",
    "order.ordered": "Ordered",
    "order.payment": "Payment",
    "order.shipping": "Shipping",
    "order.delivered": "Delivered",
    "order.customer": "Customer:",
    "order.products": "Products:",
    "order.placed": "Placed",

    // Customer info
    "customer.title": "Shipping Information",
    "customer.subtitle": "Please fill in your details before checkout",
    "customer.name": "Name",
    "customer.namePlaceholder": "Full name",
    "customer.nameError": "Please enter your name",
    "customer.phone": "Phone Number",
    "customer.phonePlaceholder": "0xxx xxx xxx",
    "customer.phoneError": "Please enter phone number",
    "customer.phoneShort": "Phone number too short",
    "customer.phoneInvalid": "Invalid phone number",
    "customer.newAddress": "New Address",
    "customer.newAddressPlaceholder": "Delivery address",
    "customer.oldAddress": "Old Address",
    "customer.oldAddressPlaceholder": "Old address",
    "customer.oldAddressError": "Please enter address",
    "customer.continue": "Continue to checkout",
    "customer.saving": "Saving...",
    "customer.error": "Error saving info",
    "customer.connectionError": "Connection error",

    // Checkout
    "checkout.title": "Checkout",
    "checkout.continueShopping": "Continue shopping",
    "checkout.submit": "Confirm order",
    "checkout.submitting": "Submitting order...",
    "checkout.success": "Order submitted successfully!",
    "checkout.successSub": "Please pay via the QR code below",
    "checkout.orderDetail": "Order Details",
    "checkout.error": "Error submitting order",
    "checkout.connectionError": "Connection error",

    // QR
    "qr.title": "Payment",
    "qr.scan": "Please scan QR code to pay",
    "qr.instruction": "After transfer, please screenshot and send via Facebook to confirm your order:",
    "qr.facebook": "Send Facebook message",
    "qr.done": "Paid - Go back",

    // Account
    "account.title": "Customer Account",
    "account.subtitle": "Enter phone number to view info and order history",
    "account.phoneLabel": "Phone number",
    "account.lookup": "Look up",
    "account.totalOrders": "Total orders",
    "account.paid": "Paid",
    "account.totalSpent": "Total spent",
    "account.orderHistory": "Order History",
    "account.backToShop": "Back to shop",

    // Compare
    "compare.title": "Compare Products",
    "compare.empty": "No products selected",
    "compare.emptySub": "Add products to compare from the shop page",
    "compare.viewProducts": "View products",
    "compare.attribute": "Attribute",
    "compare.name": "Product Name",
    "compare.price": "Price",
    "compare.stockField": "In Stock",
    "compare.type": "Type",
    "compare.group": "Group",
    "compare.series": "Series",

    // Filter
    "filter.search": "Search by name...",
    "filter.clear": "Clear filters",
    "filter.noResults": "No products found",
    "filter.noResultsSub": "Try changing filters or search terms",
    "filter.loadMore": "Load more ({count} products)",
    "filter.allShown": "Showing all {count} products",
    "filter.count": "{total} products · {stock} cards left",
    "sort.name": "Name A-Z",
    "sort.priceAsc": "Price low to high",
    "sort.priceDesc": "Price high to low",
    "sort.stock": "Lowest stock first",

    // Recently viewed
    "recent.title": "Recently Viewed",

    // Common
    "common.loading": "Loading...",
    "common.back": "Go back",
    "common.backToShop": "Back to shop",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.manage": "Manage",

    // Contact
    "contact.price": "Contact",
  },
};

export function t(key: string, locale: Locale = "vi"): string {
  return translations[locale]?.[key] || key;
}

export type { Locale };

# V1ncc TCG Card Shop

Next.js 16 Pokemon TCG e-commerce with Google Sheets backend.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4
- **State**: Zustand (cart, wishlist, theme, locale)
- **Backend**: Google Sheets via Apps Script (POST-as-GET workaround)
- **Fonts**: Bebas Neue (display), Outfit (body)
- **Virtualization**: @tanstack/react-virtual for product grid

## Key Files

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Homepage (hero, featured cards, type browser, product grid) |
| `src/app/layout.tsx` | Root layout (fonts, metadata, theme sync) |
| `src/app/checkout/page.tsx` | Checkout flow with stock validation |
| `src/app/admin/page.tsx` | Admin product management (CRUD, batch edit, CSV import/export) |
| `src/app/admin/orders/page.tsx` | Admin order management (status, products, bulk ops, PDF) |
| `src/app/admin/dashboard/page.tsx` | Dashboard with revenue, profit, KPI charts |
| `src/components/ProductGrid.tsx` | Product grid with virtual scrolling, search, filters, sort |
| `src/components/ProductCard.tsx` | Product card with image, price, stock, add-to-cart |
| `src/components/CardImage.tsx` | Lazy-loaded card image with gradient placeholder |
| `src/components/FilterBar.tsx` | Filter/sort controls (collapsible on mobile) |
| `src/components/CartDrawer.tsx` | Slide-out cart drawer |
| `src/components/MobileNav.tsx` | Mobile bottom navigation |
| `src/lib/data.ts` | Server data layer (Google Sheets + local JSON fallback) |
| `src/lib/imageUtils.ts` | Image URL transformation (high.webp) |
| `src/lib/format.ts` | Price formatting utilities |
| `src/store/cartStore.ts` | Zustand cart store with localStorage persistence |
| `src/app/api/products/route.ts` | Products API with caching and rate limiting |
| `src/app/api/sheets/route.ts` | Google Sheets proxy (admin CRUD operations) |

## Commands

- `npm run dev` — Development server
- `npm run build` — Production build
- `npm run lint` — Lint check
- `npm run start` — Production server

## Environment Variables

- `GOOGLE_STOCK_URL` — Google Apps Script URL for stock data
- `GOOGLE_BUSINESS_URL` — Google Apps Script URL for business data

## Conventions

- **Language**: Vietnamese (admin UI), bilingual (customer-facing)
- **Prices**: Stored in thousands (displayed as `x * 1000` VND)
- **Order products format**: `{qty}x {name} - {code}|{price}` (e.g. `1x Pikachu - PC-PO-025|15`)
- **Order identification**: `orderCode` as primary key, `_row` as sheet row fallback
- **Display types**: Normal, Holo, Prize Card, EX, Holo Prize Card, EX Prize Card

## Google Sheets Integration

- Apps Script "Anyone" deployments redirect; POST body is lost on redirect
- **Workaround**: Write operations encode payload as GET query param `?payload=...`
- Stock sheet: products with type/series/price/stock columns
- Business sheet: orders and customers
- Stock adjustments use `updateStock` action (XUẤT/TỒN columns)

## Architecture

- Server-only data access in `src/lib/data.ts` (cannot import in client components)
- Client components use `fetch("/api/...")` to reach server routes
- Rate limiting on public endpoints (10 req/min for orders, 30 req/min for products)
- Image caching uses composite keys `{code}|{type}|{series}` for deduplication
- Cart expires after 7 days via localStorage timestamp check

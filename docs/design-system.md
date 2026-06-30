# V1NCC TCG Design System

## Tokens (CSS custom properties)

### Light mode (`:root`)

| Token | Value | Purpose |
|-------|-------|---------|
| `--background` | `#F4F7FB` | Page background |
| `--bg-surface` | `#FFFFFF` | Card/surface |
| `--bg-surface-alt` | `#EEF2F8` | Alternate surface |
| `--bg-sunken` | `#E6ECF4` | Deep surface |
| `--bg-hover` | `#F0F4FA` | Hover state |
| `--card-bg` | `#FFFFFF` | Product card |
| `--card-shadow` | `rgba(20,30,60,…)` | Subtle cool |
| `--radius-card` | `26px` | ProductCard radius |
| `--radius-lg` | `20px` | Large radius |
| `--radius-xl` | `28px` | Extra large |
| `--radius-2xl` | `32px` | 2x large |
| `--press-depth` | `translateY(1px) scale(0.985)` | Active press |
| `--tilt-max` | `8deg` | 3D tilt cap |
| `--type-tint-alpha` | `0.14` | Pastel alpha |
| `--type-tint-alpha-strong` | `0.22` | Hover pastel |

### Dark mode (`.dark`)

Same token set, with:
- `--background`: `#050816`
- `--type-tint-alpha` uses `--type-tint-alpha-dark` (`0.18`)
- Elevations softened ~15% relative to original

## 18-Type tint map

Each pokemon type sets `--tint` via `[data-type="…"]` selectors using `color-mix()` from the `--type-*` hue in `@theme`:

```
[data-type="fire"]   { --tint: color-mix(in srgb, var(--type-fire)   var(--type-tint-alpha), transparent); }
[data-type="water"]  { --tint: color-mix(in srgb, var(--type-water)  var(--type-tint-alpha), transparent); }
… (all 18 types)
```

Also sets `--tint-strong` (hover state, uses `--type-tint-alpha-strong`).

## Motion menu

| Animation | Source | Reduced motion? |
|-----------|--------|-----------------|
| Route transitions (fade + y) | `template.tsx` via `motion.main` | `duration: 0` |
| CartDrawer open/close | `motion.div` with spring | `duration: 0` |
| Toasts enter/exit | `motion.div` with `AnimatePresence` | `duration: 0` |
| ConfirmDialog backdrop + dialog | `motion.div` with `AnimatePresence` | `duration: 0` |
| NavigationBar active pill | `layoutId` shared-element | N/A (CSS) |
| HotItems 3D tilt | `useCardTilt` hook | Skipped (returns early) |
| RecentlyViewed stagger | `motion.a` with delay cascade | No animation |
| Wishlist heart pop | `AnimatePresence` + spring scale | `duration: 0` |
| Cart icon bounce | `motion.div` key animation | Always plays |

### Hard rule

**Do NOT animate per-item in `ProductGrid`** — the virtualized grid handles hundreds of DOM nodes. All ProductCard visual changes (radius, shadow, tint) come from CSS token inheritance.

## Component variants

| Component | TCG Pocket treatment |
|-----------|---------------------|
| `ProductCard` | `--radius-card`, `data-display-type`, `data-type`, `--press-depth` |
| `CardImage` | `data-type` for tinted placeholder |
| `CartDrawer` | `AnimatePresence` spring, swipe dismiss |
| `NavigationBar` | `layoutId` active pill |
| `MobileNav` | Glass, no motion per-item |
| `FilterBar` | Chips with `--press-depth` |
| `HeroBanner` | CSS animations (in view always) |

## Dark mode contract

1. Dark mode uses its own `.dark` block — do not desaturate.
2. Type-tint alpha is stronger (`0.18` vs `0.14`) because dark backgrounds need more saturation.
3. Elevations use higher opacity but softer easing to read on cosmic background.
4. Never add light-mode-only colors into dark block.

## Data safety

- No motion code touches Google Sheets, image-map, products, or build scripts.
- `imageUtils.ts` is the only data-layer change (Phase 1 fix).
- All visual changes are CSS tokens or motion wrappers.

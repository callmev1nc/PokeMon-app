/**
 * Convert a card image URL to a high-quality render URL.
 * - tcgdex base URLs (assets.tcgdex.net) need /high.webp appended.
 * - pokemontcg.io and other full URLs are used as-is.
 */
export function toRenderUrl(url: string): string {
  if (!url) return url;
  if (url.match(/\/(high|low)\.(webp|png|jpg)$/)) return url;
  if (!isTcgdexUrl(url)) return url;
  return `${url}/high.webp`;
}

/**
 * Convert a card image URL to a tiny low-res placeholder URL.
 * - tcgdex base URLs need /low.webp appended.
 * - pokemontcg.io and other full URLs use the same URL as placeholder fallback.
 */
export function toPlaceholderUrl(url: string): string {
  if (!url) return url;
  if (url.match(/\/(high|low)\.(webp|png|jpg)$/)) return url;
  if (!isTcgdexUrl(url)) return url;
  return `${url}/low.webp`;
}

/** Check if a URL is from the tcgdex CDN (supports quality/format suffixes). */
export function isTcgdexUrl(url: string): boolean {
  return url?.includes("assets.tcgdex.net") || false;
}

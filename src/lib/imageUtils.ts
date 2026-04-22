/**
 * Convert a tcgdex base URL to a high-quality render URL.
 * Base:   https://assets.tcgdex.net/en/sv/sv01/156
 * Render: https://assets.tcgdex.net/en/sv/sv01/156/high.webp
 */
export function toRenderUrl(url: string): string {
  if (!url) return url;
  if (url.match(/\/(high|low)\.(webp|png|jpg)$/)) return url;
  return `${url}/high.webp`;
}

/**
 * Convert a tcgdex base URL to a tiny low-res placeholder URL.
 * Base:       https://assets.tcgdex.net/en/sv/sv01/156
 * Placeholder: https://assets.tcgdex.net/en/sv/sv01/156/low.webp
 */
export function toPlaceholderUrl(url: string): string {
  if (!url) return url;
  if (url.match(/\/(high|low)\.(webp|png|jpg)$/)) return url;
  return `${url}/low.webp`;
}

/** Check if a URL is from the tcgdex CDN (supports quality/format suffixes). */
export function isTcgdexUrl(url: string): boolean {
  return url?.includes("assets.tcgdex.net") || false;
}

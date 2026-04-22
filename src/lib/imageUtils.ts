/**
 * Convert a tcgdex base URL to a render URL with high-quality WebP.
 * Base:   https://assets.tcgdex.net/en/sv/sv01/156
 * Render: https://assets.tcgdex.net/en/sv/sv01/156/high.webp
 */
export function toRenderUrl(url: string): string {
  if (!url) return url;
  if (url.match(/\/(high|low)\.(webp|png|jpg)$/)) return url;
  return `${url}/high.webp`;
}

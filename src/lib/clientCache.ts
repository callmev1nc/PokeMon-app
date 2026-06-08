/**
 * Minimal client-side stale-while-revalidate cache.
 * Returns cached data instantly when fresh, serves stale while refetching in background.
 */

const cache = new Map<string, { data: unknown; timestamp: number }>();
const STALE_TIME = 60_000;      // 1 minute — serve from cache without refetch
const MAX_AGE = 300_000;        // 5 minutes — serve stale + refetch in background

export async function swrFetch<T>(url: string): Promise<T> {
  const cached = cache.get(url);

  // Fresh cache — return immediately
  if (cached && Date.now() - cached.timestamp < STALE_TIME) {
    return cached.data as T;
  }

  // Stale but usable — return stale, refetch in background
  if (cached && Date.now() - cached.timestamp < MAX_AGE) {
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        cache.set(url, { data, timestamp: Date.now() });
      })
      .catch(() => {});
    return cached.data as T;
  }

  // No cache or expired — fetch fresh
  const res = await fetch(url);
  const data = await res.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data as T;
}

/** Clear cache for a specific URL or all cache */
export function clearCache(url?: string) {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  maxEntries?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { maxRequests, windowMs, maxEntries = 500 } = options;
  const entries = new Map<string, { count: number; lastAttempt: number }>();

  return function checkLimit(ip: string): RateLimitResult {
    const now = Date.now();
    const record = entries.get(ip);

    if (record) {
      if (now - record.lastAttempt > windowMs) {
        record.count = 0;
      }
      if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0 };
      }
      record.count++;
      record.lastAttempt = now;
    } else {
      entries.set(ip, { count: 1, lastAttempt: now });
    }

    // Periodic cleanup
    if (entries.size > maxEntries) {
      for (const [key, val] of entries) {
        if (now - val.lastAttempt > windowMs) entries.delete(key);
      }
    }

    const current = entries.get(ip);
    return { allowed: true, remaining: maxRequests - (current?.count ?? 0) };
  };
}

// Edge Runtime compatible session verification (for middleware)
// Uses Web Crypto API instead of Node.js crypto
// Does NOT import adminAccounts.ts (which uses fs/path — not available in Edge)

import type { AdminRole } from "./adminAccounts";

// SESSION_SECRET is resolved lazily (getSecret) rather than at module load, so that
// `next build` does NOT require it. Vercel stores it as a Sensitive (Encrypted) env
// var, which is runtime-only and intentionally unavailable during the build step.
// The production-required check therefore runs on first use (request time), not import.
const DEV_FALLBACK_SECRET = "dev-shared-secret-not-for-production"; // must match src/lib/auth.ts

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET environment variable is required in production.");
  }
  console.warn("WARNING: Using shared dev SESSION_SECRET. Set SESSION_SECRET env var for persistent/secure sessions.");
  return DEV_FALLBACK_SECRET;
}

export const COOKIE_NAME = "admin-session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

async function hmacSign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacVerify(data: string, expected: string): Promise<boolean> {
  const actual = await hmacSign(data);
  if (actual.length !== expected.length) return false;
  const a = new TextEncoder().encode(actual);
  const b = new TextEncoder().encode(expected);
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    const decoded = atob(token);
    const parts = decoded.split(":");
    if (parts.length !== 4) return false;
    const [username, role, timestamp, signature] = parts;

    const age = Date.now() - parseInt(timestamp);
    if (isNaN(age) || age > SESSION_MAX_AGE * 1000) return false;

    return hmacVerify(`${username}:${role}:${timestamp}`, signature);
  } catch {
    return false;
  }
}

export function parseSession(token: string): { username: string; role: AdminRole } | null {
  try {
    const decoded = atob(token);
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;
    const [username, role] = parts;
    return { username, role: role as AdminRole };
  } catch {
    return null;
  }
}

// Edge Runtime compatible session verification (for middleware)
// Uses Web Crypto API instead of Node.js crypto

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "chausieudethuong";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "42ebae182eac29e02cc5f9fdba6fd1d8b809f5f1af7b3c77e5192d3cc031cb8e";
export const COOKIE_NAME = "admin-session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

async function hmacSign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
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
    if (parts.length !== 3) return false;
    const [username, timestamp, signature] = parts;
    if (username !== ADMIN_USERNAME) return false;

    const age = Date.now() - parseInt(timestamp);
    if (isNaN(age) || age > SESSION_MAX_AGE * 1000) return false;

    return hmacVerify(`${username}:${timestamp}`, signature);
  } catch {
    return false;
  }
}

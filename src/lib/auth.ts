import crypto from "crypto";
import { findAdmin, getAdmins, type AdminRole } from "./adminAccounts";

// SESSION_SECRET is resolved lazily (getSecret) rather than at module load, so that
// `next build` does NOT require it. Vercel stores it as a Sensitive (Encrypted) env
// var (runtime-only, not available during the build step). The production-required
// check therefore runs on first use (request time), not at import.
const DEV_FALLBACK_SECRET = "dev-shared-secret-not-for-production"; // must match src/lib/auth-edge.ts

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET environment variable is required in production.");
  }
  console.warn("\x1b[33mWARNING: Using shared dev SESSION_SECRET. Set SESSION_SECRET env var for persistent/secure sessions.\x1b[0m");
  return DEV_FALLBACK_SECRET;
}
const COOKIE_NAME = "admin-session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

export { COOKIE_NAME };

export async function verifyCredentials(
  username: string,
  password: string
): Promise<{ valid: boolean; role?: AdminRole }> {
  const account = await findAdmin(username, password);
  if (!account) return { valid: false };
  return { valid: true, role: account.role };
}

export function createSession(username: string, role: AdminRole): string {
  const payload = `${username}:${role}:${Date.now()}`;
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64");
}

export function verifySession(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const parts = decoded.split(":");
    if (parts.length !== 4) return false;
    const [username, role, timestamp, signature] = parts;

    const admins = getAdmins();
    const account = admins.find((a) => a.username === username);
    if (!account) return false;

    const age = Date.now() - parseInt(timestamp);
    if (isNaN(age) || age > SESSION_MAX_AGE * 1000) return false;

    const hmac = crypto.createHmac("sha256", getSecret());
    hmac.update(`${username}:${role}:${timestamp}`);
    const expected = hmac.digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export function getSessionRole(token: string): AdminRole | null {
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;
    return parts[1] as AdminRole;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(): string {
  return [
    "HttpOnly",
    "Path=/",
    `Max-Age=${SESSION_MAX_AGE}`,
    "SameSite=Strict",
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

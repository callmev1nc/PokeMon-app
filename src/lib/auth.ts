import crypto from "crypto";
import { findAdmin, getAdmins, type AdminRole } from "./adminAccounts";

const SESSION_SECRET =
  process.env.SESSION_SECRET || (() => {
    if (process.env.NODE_ENV === "production") {
      console.error("\x1b[31mSECURITY WARNING: SESSION_SECRET not set! Generating random secret — sessions will not persist across restarts.\x1b[0m");
    } else {
      console.warn("\x1b[33mWARNING: Using auto-generated SESSION_SECRET. Set SESSION_SECRET env var for persistent sessions.\x1b[0m");
    }
    return crypto.randomBytes(32).toString("hex");
  })();
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
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
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

    const hmac = crypto.createHmac("sha256", SESSION_SECRET);
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
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

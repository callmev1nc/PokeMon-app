import bcrypt from "bcryptjs";
import crypto from "crypto";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "chausieudethuong";
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  "$2b$10$E27O4Ky4MYisIMSDAYzYW.e1otEitIBk4X7HGWH7jXlc8bc4kkzH.";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "pokemon-admin-secret-key-2026";
const COOKIE_NAME = "admin-session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

export { COOKIE_NAME };

export async function verifyCredentials(
  username: string,
  password: string
): Promise<boolean> {
  if (username !== ADMIN_USERNAME) return false;
  return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
}

export function createSession(): string {
  const payload = `${ADMIN_USERNAME}:${Date.now()}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64");
}

export function verifySession(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;
    const [username, timestamp, signature] = parts;
    if (username !== ADMIN_USERNAME) return false;

    const age = Date.now() - parseInt(timestamp);
    if (isNaN(age) || age > SESSION_MAX_AGE * 1000) return false;

    const hmac = crypto.createHmac("sha256", SESSION_SECRET);
    hmac.update(`${username}:${timestamp}`);
    const expected = hmac.digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
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

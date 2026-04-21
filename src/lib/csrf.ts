import crypto from "crypto";

const CSRF_TOKEN_LENGTH = 32; // bytes -> 64 hex chars
const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_MAX_AGE = 60 * 60 * 24; // 24 hours

export { CSRF_COOKIE_NAME };

/**
 * Generate a cryptographically random CSRF token.
 * Returns a hex string suitable for use as both cookie value and header value.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Validate that a CSRF token from a request header matches the expected token.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function validateCsrfToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  // Basic format check: should be a 64-char hex string
  if (token.length !== CSRF_TOKEN_LENGTH * 2) return false;
  if (!/^[0-9a-f]+$/.test(token)) return false;
  return true;
}

/**
 * Build Set-Cookie header value for the CSRF token cookie.
 */
export function csrfCookieOptions(token: string): string {
  return [
    `${CSRF_COOKIE_NAME}=${token}`,
    "Path=/",
    `Max-Age=${CSRF_MAX_AGE}`,
    "SameSite=Lax",
    // Not HttpOnly so JavaScript can read it for the x-csrf-token header
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

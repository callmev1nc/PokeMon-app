import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  createSession,
  COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  generateCsrfToken,
  csrfCookieOptions,
} from "@/lib/csrf";
import { loginSchema, validateBody } from "@/lib/schemas";
import { createRateLimiter } from "@/lib/rateLimit";

const rateLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000, maxEntries: 100 });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed } = rateLimiter(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Quá nhiều lần thử. Vui lòng đợi 1 phút." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const parsed = await validateBody(req, loginSchema);
  if ("error" in parsed) return parsed.error;
  const { username, password } = parsed.data;

  const credResult = await verifyCredentials(username, password);
  if (!credResult.valid) {
    return NextResponse.json(
      { error: "Tên đăng nhập hoặc mật khẩu không đúng" },
      { status: 401 }
    );
  }

  const token = createSession(username, credResult.role!);
  const csrfToken = generateCsrfToken();
  const response = NextResponse.json({
    success: true,
    role: credResult.role,
    csrfToken,
  });

  response.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; ${sessionCookieOptions()}`
  );

  response.headers.append(
    "Set-Cookie",
    csrfCookieOptions(csrfToken)
  );

  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/auth-edge";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "on",
};

const ADMIN_HEADERS: Record<string, string> = {
  ...SECURITY_HEADERS,
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAuthRoute = pathname === "/admin/login" || pathname.startsWith("/api/auth/");

  // Allow login page and auth API routes
  if (isAuthRoute) {
    const response = NextResponse.next();
    const headers = isAdminRoute ? ADMIN_HEADERS : SECURITY_HEADERS;
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // Protect /admin routes
  if (isAdminRoute) {
    const token = req.cookies.get(COOKIE_NAME)?.value;

    if (!token || !(await verifySession(token))) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  const headers = isAdminRoute ? ADMIN_HEADERS : SECURITY_HEADERS;
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ["/(.*)"],
};

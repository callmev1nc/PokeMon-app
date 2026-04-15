import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  createSession,
  COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth";

// Simple in-memory rate limiter
const attempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

export async function POST(req: NextRequest) {
  // Rate limit check
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const record = attempts.get(ip);

  if (record) {
    // Reset window if expired
    if (now - record.lastAttempt > WINDOW_MS) {
      record.count = 0;
    }
    if (record.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Quá nhiều lần thử. Vui lòng đợi 1 phút." },
        { status: 429 }
      );
    }
    record.count++;
    record.lastAttempt = now;
  } else {
    attempts.set(ip, { count: 1, lastAttempt: now });
  }

  // Clean old entries periodically
  if (attempts.size > 100) {
    for (const [key, val] of attempts) {
      if (now - val.lastAttempt > WINDOW_MS) attempts.delete(key);
    }
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Vui lòng nhập tên đăng nhập và mật khẩu" },
      { status: 400 }
    );
  }

  const valid = await verifyCredentials(username, password);
  if (!valid) {
    return NextResponse.json(
      { error: "Tên đăng nhập hoặc mật khẩu không đúng" },
      { status: 401 }
    );
  }

  const token = createSession();
  const response = NextResponse.json({ success: true });

  response.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; ${sessionCookieOptions()}`
  );

  return response;
}

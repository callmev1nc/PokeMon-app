import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  createSession,
  COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
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

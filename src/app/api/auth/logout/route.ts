import { NextResponse } from "next/server";
import { COOKIE_NAME as AUTH_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.set(
    "Set-Cookie",
    `${AUTH_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  );
  return response;
}

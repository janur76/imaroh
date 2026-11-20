import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth";

export async function POST() {
  try {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE_NAME, "", {
      ...getSessionCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus sesi." },
      { status: 500 }
    );
  }
}

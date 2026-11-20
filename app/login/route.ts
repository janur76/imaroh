import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  getSessionCookieOptions,
  isAllowedAdminEmail,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; credential?: string };
    let email = (body.email ?? "").trim().toLowerCase();

    // Jika ada Google ID token (credential) dari tombol Google Sign-In, verifikasi ke Google
    if (body.credential) {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.credential)}`,
        { cache: "no-store" }
      );
      if (!verifyRes.ok) {
        return NextResponse.json({ error: "Token Google tidak valid." }, { status: 401 });
      }
      const tokenInfo = (await verifyRes.json()) as {
        email?: string;
        email_verified?: string;
        aud?: string;
      };
      const expectedClientId = process.env.AUTH_GOOGLE_ID;
      if (expectedClientId && tokenInfo.aud && tokenInfo.aud !== expectedClientId) {
        return NextResponse.json({ error: "Client ID Google tidak cocok." }, { status: 401 });
      }
      if (tokenInfo.email_verified !== "true" || !tokenInfo.email) {
        return NextResponse.json({ error: "Email Google belum terverifikasi." }, { status: 401 });
      }
      email = tokenInfo.email.trim().toLowerCase();
    }

    if (!email) {
      return NextResponse.json({ error: "Email pengurus wajib diisi." }, { status: 400 });
    }

    if (!isAllowedAdminEmail(email)) {
      return NextResponse.json(
        { error: "Akun ini tidak terdaftar sebagai pengurus yang diizinkan." },
        { status: 403 }
      );
    }

    const token = createSessionToken(email);
    const response = NextResponse.json({ ok: true, email });
    response.cookies.set(ADMIN_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses autentikasi." },
      { status: 500 }
    );
  }
}

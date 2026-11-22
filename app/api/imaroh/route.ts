import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { IMAROH_APPS_SCRIPT_URL } from "@/lib/api";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";

const ALLOWED_ACTIONS = new Set([
  "tambahKas",
  "editKas",
  "hapusKas",
  "tambahInventaris",
  "editInventaris",
  "hapusInventaris",
  "tambahKajian",
  "editKajian",
  "hapusKajian",
  "updateProfil",
]);

function getSessionSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.APPS_SCRIPT_SECRET ||
    process.env.API_SECRET ||
    process.env.IMAROH_API_SECRET ||
    ""
  ).trim();
}

function extractEmailFromCookieValue(rawCookie: string | undefined): string {
  if (!rawCookie) return "";
  const trimmed = rawCookie.trim();
  if (!trimmed) return "";

  const secret = getSessionSecret();

  // Format 1: payloadBase64.signature (HMAC-SHA256)
  const dotIdx = trimmed.indexOf(".");
  if (dotIdx > 0 && secret) {
    const payloadPart = trimmed.slice(0, dotIdx);
    const sigPart = trimmed.slice(dotIdx + 1);
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payloadPart)
      .digest("base64url");
    const expectedSigHex = crypto
      .createHmac("sha256", secret)
      .update(payloadPart)
      .digest("hex");

    const sigValid =
      sigPart === expectedSig || sigPart.toLowerCase() === expectedSigHex.toLowerCase();

    if (sigValid) {
      try {
        const decoded = Buffer.from(payloadPart, "base64url").toString("utf8");
        if (decoded.includes("@") && !decoded.startsWith("{")) {
          return decoded.trim().toLowerCase();
        }
        const parsed = JSON.parse(decoded) as { email?: unknown; exp?: unknown };
        if (typeof parsed?.exp === "number" && parsed.exp < Date.now()) {
          return "";
        }
        if (typeof parsed?.email === "string" && parsed.email.includes("@")) {
          return parsed.email.trim().toLowerCase();
        }
      } catch {
        // lanjut cek format lain jika bukan JSON base64url
      }
    }
  }

  // Format 2: JSON string langsung jika tidak pakai titik pemisah
  try {
    const parsed = JSON.parse(trimmed) as { email?: unknown };
    if (typeof parsed?.email === "string" && parsed.email.includes("@")) {
      return parsed.email.trim().toLowerCase();
    }
  } catch {
    // bukan JSON langsung
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body?.action || "").trim();

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        { ok: false, error: "Action tidak dikenali atau tidak diizinkan." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const sessionEmail = extractEmailFromCookieValue(sessionCookie);

    const scriptUrl =
      process.env.APPS_SCRIPT_URL ||
      process.env.IMAROH_APPS_SCRIPT_URL ||
      IMAROH_APPS_SCRIPT_URL ||
      "";

    if (!scriptUrl) {
      return NextResponse.json(
        { ok: false, error: "APPS_SCRIPT_URL belum dikonfigurasi." },
        { status: 500 }
      );
    }

    const secret =
      process.env.APPS_SCRIPT_SECRET ||
      process.env.API_SECRET ||
      process.env.IMAROH_API_SECRET ||
      "";

    if (!secret) {
      return NextResponse.json(
        { ok: false, error: "APPS_SCRIPT_SECRET belum dikonfigurasi di environment server." },
        { status: 500 }
      );
    }

    const requestedPencatat =
      typeof body?.pencatat === "string" ? body.pencatat.trim().toLowerCase() : "";
    const resolvedPencatat =
      sessionEmail ||
      (requestedPencatat && requestedPencatat !== "admin dkm" ? requestedPencatat : "Admin DKM");

    const forwardPayload: Record<string, unknown> = {
      ...body,
      action,
      secret,
    };

    if (action === "tambahKas" || action === "editKas") {
      forwardPayload.pencatat = resolvedPencatat;
    }

    const gasResponse = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(forwardPayload),
      redirect: "follow",
      cache: "no-store",
    });

    const rawText = await gasResponse.text();
    let parsed: { status?: string; message?: string; id?: string } | null = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }

    if (!gasResponse.ok) {
      return NextResponse.json(
        { ok: false, error: `Google Apps Script merespons HTTP ${gasResponse.status}.` },
        { status: 502 }
      );
    }

    if (!parsed || parsed.status !== "success") {
      return NextResponse.json(
        {
          ok: false,
          error: parsed?.message || "Google Apps Script menolak atau gagal memproses permintaan.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: parsed.message || "Berhasil disimpan ke Google Sheets.",
      id: parsed.id,
      pencatat: resolvedPencatat,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menghubungi server database.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

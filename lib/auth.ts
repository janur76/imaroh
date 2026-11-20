import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "imaroh_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

export interface AdminSessionPayload {
  email: string;
  exp: number;
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET belum dikonfigurasi dengan aman di environment variables.");
  }
  return secret;
}

export function getAllowedAdminEmails(): string[] {
  const raw = process.env.ALLOWED_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const allowed = getAllowedAdminEmails();
  return allowed.includes(normalized);
}

function sign(dataBase64Url: string): string {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(dataBase64Url)
    .digest("base64url");
}

export function createSessionToken(email: string): string {
  const payload: AdminSessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token?: string | null): AdminSessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;

  try {
    const expectedSig = sign(encoded);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AdminSessionPayload;
    if (!decoded?.email || typeof decoded.exp !== "number") return null;
    if (decoded.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!isAllowedAdminEmail(decoded.email)) return null;

    return decoded;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

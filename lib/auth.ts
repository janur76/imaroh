import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "imaroh_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

export interface AdminSessionPayload {
  email: string;
  exp: number;
}

function getAuthSecretOrNull(): string | null {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return null;
  }
  return secret;
}

function getRequiredAuthSecret(): string {
  const secret = getAuthSecretOrNull();
  if (!secret) {
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

function signWithSecret(dataBase64Url: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(dataBase64Url)
    .digest("base64url");
}

export function createSessionToken(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const secret = getRequiredAuthSecret();
  const payload: AdminSessionPayload = {
    email: normalizedEmail,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signWithSecret(encoded, secret);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token?: string | null): AdminSessionPayload | null {
  if (!token) return null;
  const secret = getAuthSecretOrNull();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;

  try {
    const expectedSig = signWithSecret(encoded, secret);
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSig, "utf8");
    if (sigBuf.length === 0 || sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    const decoded = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AdminSessionPayload;

    const normalizedEmail =
      typeof decoded?.email === "string" ? decoded.email.trim().toLowerCase() : "";
    if (!normalizedEmail || typeof decoded?.exp !== "number" || !Number.isFinite(decoded.exp)) {
      return null;
    }
    if (decoded.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!isAllowedAdminEmail(normalizedEmail)) return null;

    return {
      email: normalizedEmail,
      exp: decoded.exp,
    };
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

"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

function sanitizeNextPath(rawNext: string | null): string {
  if (!rawNext) return "/admin";
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/admin";
  }
  return trimmed.startsWith("/admin") ? trimmed : "/admin";
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const submitAuthPayload = async (payload: { email?: string; credential?: string }) => {
    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Login gagal. Periksa izin akun pengurus.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      console.error("Gagal login:", err);
      setErrorMsg("Terjadi gangguan jaringan saat login.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    const renderGoogleBtn = () => {
      if (!googleButtonRef.current || !window.google?.accounts?.id) return;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response?.credential) {
            void submitAuthPayload({ credential: response.credential });
          } else {
            setErrorMsg("Tidak menerima token kredensial dari Google.");
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 320,
      });
      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      renderGoogleBtn();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", renderGoogleBtn);
      return () => {
        existingScript.removeEventListener("load", renderGoogleBtn);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleBtn;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [googleClientId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg("Masukkan alamat email pengurus yang terdaftar.");
      return;
    }
    await submitAuthPayload({ email: cleanEmail });
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#022c22] text-white flex items-center justify-center p-4 sm:p-6">
      {/* Aksen Gradien Lembut */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -left-24 w-96 h-96 rounded-full bg-emerald-300/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-teal-950/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(167,243,208,0.14),transparent_55%)]"
      />

      {/* Kartu Glassmorphism Login Panel Admin */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/12 backdrop-blur-xl border border-white/25 shadow-[0_24px_60px_rgba(2,44,34,0.55)] p-6 md:p-8 space-y-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-100 bg-white/15 px-3 py-1 rounded-full border border-white/20">
            Autentikasi Pengurus DKM
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-3">
            Login Panel Admin
          </h1>
          <p className="text-xs text-emerald-100/85 mt-1 leading-relaxed">
            Akses khusus email pengurus yang terdaftar pada konfigurasi server{" "}
            <strong className="text-white">imaroh.kalibu.id</strong>.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-300/35 text-rose-100 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Tombol Google Sign-In */}
        {googleClientId && (
          <div className="space-y-3">
            <div className="flex justify-center min-h-[44px] items-center">
              <div ref={googleButtonRef} />
            </div>
            {!googleReady && (
              <p className="text-center text-[11px] text-emerald-100/75">
                Menyiapkan tombol Masuk dengan Google...
              </p>
            )}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-white/15" />
              <span className="px-3 text-[11px] uppercase tracking-wider text-emerald-100/70">
                atau email terdaftar
              </span>
              <div className="flex-grow border-t border-white/15" />
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-50 mb-1">
              Email Pengurus
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pengurus@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 focus:bg-white/20 text-white placeholder:text-emerald-200/60 border border-white/25 focus:border-emerald-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/40 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-emerald-50 text-[#064e3b] font-bold text-sm transition shadow-lg shadow-emerald-950/30 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Memverifikasi Akses..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <div className="pt-4 border-t border-white/15 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-emerald-100/85 hover:text-white font-medium transition cursor-pointer"
          >
            ← Kembali ke Halaman Publik
          </button>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#022c22] flex items-center justify-center text-xs text-emerald-100">
          Memuat halaman login...
        </main>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

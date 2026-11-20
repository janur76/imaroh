"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg("Masukkan alamat email pengurus yang terdaftar.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
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

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#047857] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Autentikasi Pengurus DKM
          </span>
          <h1 className="text-2xl font-extrabold text-[#0b1c30] mt-3">
            Login Panel Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Akses khusus email pengurus yang terdaftar pada konfigurasi server <strong>imaroh.kalibu.id</strong>.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Pengurus
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pengurus@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#064e3b] text-white font-semibold text-sm transition shadow-md disabled:opacity-50"
          >
            {submitting ? "Memverifikasi Akses..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-slate-500 hover:text-slate-800 font-medium"
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
        <main className="min-h-screen bg-[#f8f9ff] flex items-center justify-center text-xs text-slate-500">
          Memuat halaman login...
        </main>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

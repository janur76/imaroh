"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqb8DzZsMu66a0c4LmZEwWYQbKm3Ay1CB6-w6jV7cxUUdIszyZ5wMKx88dhaVVKO8q/exec";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Harap masukkan email dan password pengurus!");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // Ubah mode fetch dari 'no-cors' agar kita bisa membaca respons JSON status dari Apps Script
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8", // Trick menghindari preflight CORS di Apps Script
        },
        body: JSON.stringify({
          action: "login",
          email: email,
          password: password,
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("Login berhasil! Mengarahkan ke Panel Superadmin DKM...");
        localStorage.setItem("imaroh_user", email);
        router.push("/admin");
      } else {
        // Jika gagal (password salah / email tidak terdaftar / tidak aktif)
        setErrorMessage(result.message || "Login gagal! Email atau password salah.");
      }
    } catch (error) {
      console.error("Gagal melakukan login:", error);
      setErrorMessage("Terjadi kesalahan koneksi ke database Google Sheets.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#047857] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Autentikasi DKM
          </span>
          <h1 className="text-2xl font-extrabold text-[#0b1c30] mt-2">Login Pengurus Imaroh</h1>
          <p className="text-xs text-slate-500">
            Masukkan email dan password terdaftar di database Google Sheets untuk mengakses panel admin.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Pengurus / Superadmin</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Contoh: pixelora76@gmail.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#064e3b] text-white font-semibold text-sm transition duration-200 shadow-md disabled:opacity-50"
          >
            {loading ? "Memverifikasi Akun..." : "Masuk ke Panel Admin"}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-xs font-semibold text-slate-500 hover:text-[#047857] transition"
          >
            ← Kembali ke Portal Publik Jamaah
          </button>
        </div>

      </div>
    </main>
  );
}
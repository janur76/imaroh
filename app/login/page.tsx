"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulasi autentikasi superadmin menggunakan email pixelora76@gmail.com atau baitulmuminin.cmr@gmail.com
    setTimeout(() => {
      if (email === "pixelora76@gmail.com" || email === "baitulmuminin.cmr@gmail.com") {
        alert("Login berhasil! Mengalihkan ke Dashboard DKM...");
        router.push("/admin"); // Akan kita buat setelah ini
      } else {
        alert("Email atau password salah. Gunakan email terdaftar.");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#047857] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            DKM Portal Admin
          </span>
          <h1 className="text-2xl font-extrabold text-[#0b1c30] mt-3">
            Masjid Baitul Mu'minin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Silakan masuk untuk mengelola keuangan & inventaris
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Superadmin / Pengurus
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pixelora76@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#047857] hover:bg-[#064e3b] text-white font-semibold rounded-xl text-sm shadow transition duration-200 mt-2"
          >
            {loading ? "Memproses..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/" className="text-xs text-[#047857] hover:underline font-medium">
            &larr; Kembali ke Beranda Publik
          </a>
        </div>

      </div>
    </main>
  );
}
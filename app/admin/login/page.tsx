'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('didikyuliono@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulasi autentikasi / proses login admin
    setTimeout(() => {
      setLoading(false);
      // Arahkan ke dashboard admin setelah sukses
      router.push('/admin'); 
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-900 px-4">
      {/* Kotak Glassmorphism */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl text-white">
        
        {/* Header / Badge */}
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 mb-3">
            AUTENTIKASI DKM
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Login Pengurus Imaroh
          </h1>
          <p className="text-xs text-emerald-200/80 mt-1">
            Masukkan email dan password terdaftar di database Google Sheets untuk mengakses panel admin.
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-emerald-100 mb-1">
              Email Pengurus / Superadmin
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
              placeholder="email@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-emerald-100 mb-1">
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/40 border border-emerald-500/40 text-sm mt-2 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk ke Panel Admin'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-6">
          <a 
            href="/" 
            className="text-xs text-emerald-200 hover:text-white transition-colors underline underline-offset-4"
          >
            ← Kembali ke Portal Publik Jamaah
          </a>
        </div>

      </div>
    </div>
  );
}
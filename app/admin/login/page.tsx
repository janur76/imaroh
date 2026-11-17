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

    setTimeout(() => {
      setLoading(false);
      router.push('/admin'); 
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-emerald-900 via-emerald-600 to-teal-500 px-4">
      
      {/* Kotak Glassmorphism */}
      <div className="w-full max-w-md p-8 rounded-3xl bg-emerald-950/40 backdrop-blur-2xl border border-white/25 shadow-2xl text-white">
        
        {/* Header / Badge */}
        <div className="text-center mb-6">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 mb-3 shadow-inner">
            AUTENTIKASI DKM
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Login Pengurus Imaroh
          </h1>
          <p className="text-xs text-emerald-100/80 mt-1">
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
              className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm shadow-inner"
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
              className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm shadow-inner"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 transition-all shadow-lg shadow-emerald-900/50 border border-emerald-300/40 text-sm mt-2 disabled:opacity-50 font-bold"
          >
            {loading ? 'Memproses...' : 'Masuk ke Panel Admin'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-6">
          <a 
            href="/" 
            className="text-xs text-emerald-100 hover:text-white transition-colors underline underline-offset-4"
          >
            ← Kembali ke Portal Publik Jamaah
          </a>
        </div>

      </div>
    </div>
  );
}
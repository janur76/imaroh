"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchImarohData } from "@/lib/api";

export default function AdminProfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [namaMasjid, setNamaMasjid] = useState("");
  const [alamat, setAlamat] = useState("");
  const [telepon, setTelepon] = useState("");
  const [runningText, setRunningText] = useState("");
  const [qrisUrl, setQrisUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqb8DzZsMu66a0c4LmZEwWYQbKm3Ay1CB6-w6jV7cxUUdIszyZ5wMKx88dhaVVKO8q/exec";

  // Muat data profil saat halaman dibuka
  const loadProfil = async () => {
    try {
      const data = await fetchImarohData("profil");
      if (data && data.profil && data.profil.length > 0) {
        const p = data.profil[0];
        setNamaMasjid(p.nama_masjid || "");
        setAlamat(p.alamat || "");
        setTelepon(p.telepon || "");
        setRunningText(p.running_text || "");
        setQrisUrl(p.qris_url || "");
        setLogoUrl(p.logo_url || "");
      }
    } catch (error) {
      console.error("Gagal memuat profil masjid:", error);
    }
  };

  useEffect(() => {
    loadProfil();
  }, []);

  // Handler khusus untuk upload file lokal dari perangkat (kompresi aman untuk gambar kecil)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 300 * 1024) {
        alert("Ukuran file disarankan di bawah 300KB agar optimal!");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        action: "updateProfil",
        nama_masjid: namaMasjid,
        alamat: alamat,
        telepon: telepon,
        running_text: runningText,
        qris_url: qrisUrl,
        logo_url: logoUrl,
      };

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      alert("Berhasil! Profil, Logo, dan QRIS masjid telah diperbarui ke Google Sheets.");
      
      setTimeout(() => {
        loadProfil();
      }, 1500);
    } catch (error) {
      console.error("Gagal menyimpan profil:", error);
      alert("Terjadi kesalahan saat menyimpan ke database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#047857] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Modul Konfigurasi DKM
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] mt-2">
              Profil & Pengaturan Masjid
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola identitas, logo transparan, QRIS donasi, dan running text beranda.
            </p>
          </div>
          
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition duration-200 shadow-sm"
          >
            ← Kembali ke Dashboard
          </button>
        </div>

        {/* Form Pengaturan Profil */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Resmi Masjid</label>
              <input
                type="text"
                value={namaMasjid}
                onChange={(e) => setNamaMasjid(e.target.value)}
                placeholder="Contoh: Masjid Baitul Mu'minin"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                required
              />
            </div>

            {/* Bagian Upload & Preview Logo Masjid */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">Logo Masjid (PNG Transparan)</label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-300 flex items-center justify-center p-2 shadow-inner overflow-hidden flex-shrink-0">
                  {logoUrl && logoUrl.trim() !== "" ? (
                    <img src={logoUrl} alt="Preview Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-2xl">🕌</span>
                  )}
                </div>
                <div className="space-y-2 w-full">
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) => handleFileUpload(e, setLogoUrl)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#047857] hover:file:bg-emerald-100 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={logoUrl.startsWith("data:") ? "[Gambar Lokal Terunggah]" : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Atau masukkan URL / link gambar langsung di sini..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#047857]"
                  />
                  <p className="text-[11px] text-slate-500">Pilih file langsung dari perangkat atau masukkan tautan URL.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
              <textarea
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                rows={3}
                placeholder="Masukkan alamat lengkap masjid..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / Kontak DKM</label>
                <input
                  type="text"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                />
              </div>

              {/* Bagian Upload & Preview QRIS Donasi */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gambar / QRIS Donasi</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 flex items-center justify-center p-1 overflow-hidden flex-shrink-0 shadow-inner">
                    {qrisUrl && qrisUrl.trim() !== "" ? (
                      <img src={qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-lg">💳</span>
                    )}
                  </div>
                  <div className="w-full space-y-1.5">
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={(e) => handleFileUpload(e, setQrisUrl)}
                      className="w-full text-xs text-slate-500 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={qrisUrl.startsWith("data:") ? "[Gambar QRIS Lokal Terunggah]" : qrisUrl}
                      onChange={(e) => setQrisUrl(e.target.value)}
                      placeholder="Atau URL QRIS..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#047857]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Running Text Beranda (Pesan Berjalan untuk Jamaah)</label>
              <input
                type="text"
                value={runningText}
                onChange={(e) => setRunningText(e.target.value)}
                placeholder="Contoh: Selamat Datang di Masjid, mohon matikan HP saat shalat."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#047857] hover:bg-[#064e3b] text-white font-semibold text-sm transition duration-200 shadow-md disabled:opacity-50"
            >
              {loading ? "Menyimpan ke Sheets..." : "Simpan Perubahan Profil ke Sheets"}
            </button>

          </form>
        </div>

      </div>
    </main>
  );
}
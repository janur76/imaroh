"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchImarohData } from "@/lib/api";

export default function InventarisAdminPage() {
  const router = useRouter();
  const [inventarisList, setInventarisList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State Form Tambah Inventaris
  const [namaBarang, setNamaBarang] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [kondisi, setKondisi] = useState("Baik");
  const [lokasi, setLokasi] = useState("");

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqb8DzZsMu66a0c4LmZEwWYQbKm3Ay1CB6-w6jV7cxUUdIszyZ5wMKx88dhaVVKO8q/exec";

  // Fungsi memuat data inventaris dari Sheets
  const loadInventaris = async () => {
    try {
      const result = await fetchImarohData("all");
      if (result && result.inventaris) {
        setInventarisList(result.inventaris);
      }
    } catch (err) {
      console.error("Gagal memuat data inventaris:", err);
    }
  };

  useEffect(() => {
    loadInventaris();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang || !jumlah || !lokasi) {
      alert("Harap lengkapi semua kolom form inventaris!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        action: "tambahInventaris",
        nama_barang: namaBarang,
        jumlah: Number(jumlah),
        kondisi: kondisi,
        lokasi: lokasi,
      };

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      alert("Berhasil! Data inventaris baru telah dikirim ke Google Sheets.");
      setNamaBarang("");
      setJumlah("");
      setLokasi("");
      setKondisi("Baik");

      setTimeout(() => {
        loadInventaris();
      }, 1500);
    } catch (error) {
      console.error("Gagal menyimpan inventaris:", error);
      alert("Terjadi kesalahan saat menyimpan data inventaris.");
    } finally {
      setLoading(false);
    }
  };

  // Kalkulasi KPI Inventaris (Terpisah & Spesifik per Tab)
  const totalJenisBarang = inventarisList.length;
  const totalUnitFisik = inventarisList.reduce((acc, item) => acc + Number(item.jumlah || 0), 0);
  const totalPerbaikan = inventarisList.filter((item) => String(item.kondisi).toLowerCase().includes("perbaikan") || String(item.kondisi).toLowerCase().includes("rusak")).length;

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Bar Admin Inventaris */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#047857] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Modul Aset & Inventaris DKM
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] mt-2">
              Manajemen Inventaris Masjid
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola aset fisik, kondisi barang, dan lokasi penyimpanan dari database Google Sheets.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition duration-200 shadow-sm"
            >
              ← Kembali ke Dashboard Keuangan
            </button>
          </div>
        </div>

        {/* KPI Cards khusus Klaster Inventaris (Terpisah dari Keuangan) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#064e3b] to-[#003527] text-white p-6 rounded-2xl shadow-md">
            <span className="text-xs text-[#b0f0d6] uppercase tracking-wider font-semibold">Total Jenis Barang</span>
            <h3 className="text-3xl font-extrabold mt-2">{totalJenisBarang} Item</h3>
            <p className="text-xs text-[#b0f0d6] mt-1">Jenis aset terdaftar di database</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Unit Fisik</span>
            <h3 className="text-3xl font-extrabold text-[#047857] mt-2">{totalUnitFisik} Unit</h3>
            <p className="text-xs text-slate-500 mt-1">Akumulasi jumlah seluruh barang</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Perlu Perbaikan / Perhatian</span>
            <h3 className={`text-3xl font-extrabold mt-2 ${totalPerbaikan > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {totalPerbaikan} Item
            </h3>
            <p className="text-xs text-slate-500 mt-1">Barang dengan status pemeliharaan</p>
          </div>
        </div>

        {/* Form & Tabel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Form Tambah Inventaris */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-1">
            <h2 className="font-bold text-lg text-[#0b1c30] mb-4">Tambah Barang Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Barang / Aset</label>
                <input
                  type="text"
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  placeholder="Contoh: AC Standing 5 PK"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Unit</label>
                <input
                  type="number"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  placeholder="Contoh: 2"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi Fisik</label>
                <select
                  value={kondisi}
                  onChange={(e) => setKondisi(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                >
                  <option value="Baik">Baik (Normal)</option>
                  <option value="Perbaikan">Perbaikan (Maintenance)</option>
                  <option value="Rusak">Rusak (Tidak Berfungsi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Penyimpanan / Ruangan</label>
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Contoh: Ruang Shalat Utama"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#064e3b] text-white font-semibold text-sm transition duration-200 shadow-md disabled:opacity-50"
              >
                {loading ? "Menyimpan ke Sheets..." : "Simpan Aset ke Sheets"}
              </button>
            </form>
          </div>

          {/* Tabel Daftar Inventaris */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-[#0b1c30]">Daftar Aset & Inventaris Masjid</h2>
              <button
                onClick={loadInventaris}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition duration-200 border border-slate-200"
              >
                Sinkronisasi Data
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">ID Barang</th>
                    <th className="p-3">Nama Barang</th>
                    <th className="p-3 text-center">Jumlah</th>
                    <th className="p-3">Kondisi</th>
                    <th className="p-3">Lokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventarisList.length > 0 ? (
                    inventarisList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-semibold text-slate-700">{item.id_barang || "-"}</td>
                        <td className="p-3 font-medium text-slate-800">{item.nama_barang || "-"}</td>
                        <td className="p-3 text-center font-bold text-slate-800">{item.jumlah || 0}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                            String(item.kondisi).toLowerCase().includes("baik") 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {item.kondisi || "Baik"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{item.lokasi || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Memuat data inventaris dari Google Sheets...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
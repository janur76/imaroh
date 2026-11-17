"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchImarohData } from "@/lib/api";

export default function KajianAdminPage() {
  const router = useRouter();
  const [kajianList, setKajianList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State Form Tambah Kajian
  const [tanggal, setTanggal] = useState("");
  const [waktu, setWaktu] = useState("");
  const [tema, setTema] = useState("");
  const [pemateri, setPemateri] = useState("");
  const [tempat, setTempat] = useState("");

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqb8DzZsMu66a0c4LmZEwWYQbKm3Ay1CB6-w6jV7cxUUdIszyZ5wMKx88dhaVVKO8q/exec";

  const loadKajian = async () => {
    try {
      const result = await fetchImarohData("kajian");
      if (result && result.kajian) {
        setKajianList(result.kajian);
      }
    } catch (err) {
      console.error("Gagal memuat data kajian:", err);
    }
  };

  useEffect(() => {
    loadKajian();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !waktu || !tema || !pemateri) {
      alert("Harap lengkapi kolom utama kajian!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        action: "tambahKajian",
        tanggal: tanggal,
        waktu: waktu,
        tema: tema,
        pemateri: pemateri,
        tempat: tempat || "Ruang Shalat Utama",
      };

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      alert("Berhasil! Jadwal kajian baru telah dikirim ke Google Sheets.");
      setTanggal("");
      setWaktu("");
      setTema("");
      setPemateri("");
      setTempat("");

      setTimeout(() => {
        loadKajian();
      }, 1500);
    } catch (error) {
      console.error("Gagal menyimpan kajian:", error);
      alert("Terjadi kesalahan saat menyimpan jadwal kajian.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#047857] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Modul Dakwah & Kajian DKM
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] mt-2">
              Manajemen Jadwal Kajian & Agenda
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola jadwal kajian rutin, pemateri, dan tempat kegiatan dari database Google Sheets.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition duration-200 shadow-sm"
            >
              ← Kembali ke Dashboard
            </button>
          </div>
        </div>

        {/* Form & Tabel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Form Tambah Kajian */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-1">
            <h2 className="font-bold text-lg text-[#0b1c30] mb-4">Tambah Agenda Kajian</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu / Jam</label>
                <input
                  type="text"
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                  placeholder="Contoh: Ba'da Maghrib - Isya"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tema / Judul Kajian</label>
                <input
                  type="text"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Contoh: Fiqih Muamalah Kontemporer"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pemateri / Ustadz</label>
                <input
                  type="text"
                  value={pemateri}
                  onChange={(e) => setPemateri(e.target.value)}
                  placeholder="Contoh: Ustadz Dr. Abdullah Karim"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat / Lokasi</label>
                <input
                  type="text"
                  value={tempat}
                  onChange={(e) => setTempat(e.target.value)}
                  placeholder="Contoh: Ruang Shalat Utama"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#064e3b] text-white font-semibold text-sm transition duration-200 shadow-md disabled:opacity-50"
              >
                {loading ? "Menyimpan ke Sheets..." : "Simpan Agenda ke Sheets"}
              </button>
            </form>
          </div>

          {/* Tabel Daftar Kajian */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-[#0b1c30]">Daftar Agenda Kajian Masjid</h2>
              <button
                onClick={loadKajian}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition duration-200 border border-slate-200"
              >
                Sinkronisasi Data
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">ID Kajian</th>
                    <th className="p-3">Tanggal & Waktu</th>
                    <th className="p-3">Tema & Pemateri</th>
                    <th className="p-3">Tempat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kajianList.length > 0 ? (
                    kajianList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-semibold text-slate-700">{item.id_kajian || "-"}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{item.tanggal ? String(item.tanggal).split("T")[0] : "-"}</div>
                          <div className="text-slate-500 text-[11px]">{item.waktu || "-"}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.tema || "-"}</div>
                          <div className="text-emerald-700 font-medium text-[11px] mt-0.5">{item.pemateri || "-"}</div>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{item.tempat || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        Memuat data jadwal kajian dari Google Sheets...
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
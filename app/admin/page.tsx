"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchImarohData } from "@/lib/api";

interface Transaction {
  id_transaksi?: string;
  tanggal?: string;
  keterangan?: string;
  jenis?: string;
  nominal?: number | string;
  [key: string]: any;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [jenis, setJenis] = useState("masuk");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [transaksiList, setTransaksiList] = useState<Transaction[]>([]);
  
  // State untuk Filter & Pencarian
  const [filterBulan, setFilterBulan] = useState("semua");
  const [filterJenis, setFilterJenis] = useState("semua");

  // State untuk Modal Edit Transaksi
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [kpi, setKpi] = useState({
    saldoAkhir: 0,
    kasMasuk: 0,
    kasKeluar: 0,
  });

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqb8DzZsMu66a0c4LmZEwWYQbKm3Ay1CB6-w6jV7cxUUdIszyZ5wMKx88dhaVVKO8q/exec";
  const GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/1v4ckXNCDzC749ecoLLaaAch4Fbfw7bWr6tirfYgYMfw/edit?gid=501383615#gid=501383615";

  // Fungsi untuk memuat data transaksi dari Sheets
  const loadDataKas = async () => {
    try {
      const result = await fetchImarohData("all");
      if (result && result.kas) {
        // Ambil data asli dari Google Sheets tanpa membalik urutan (agar indeks baris/ID konsisten)
        const rawData = result.kas;
        
        const formattedData = rawData.map((item: any, index: number) => {
          const currentId = item.id_transaksi || item.id;
          if (currentId && String(currentId).startsWith("TRX-")) {
            return { ...item, id_transaksi: currentId };
          }
          
          const dateStr = item.tanggal ? String(item.tanggal).split("T")[0] : "2026-11-01";
          const [y, m] = dateStr.split("-");
          const ym = y && m ? `${y}${m}` : "202611";
          const paddedIdx = String(index + 1).padStart(3, "0");

          return {
            ...item,
            id_transaksi: currentId || `TRX-${ym}-${paddedIdx}`
          };
        });

        // Urutkan dari yang terbaru untuk ditampilkan di tabel
        const sortedData = [...formattedData].reverse();
        setTransaksiList(sortedData);

        let totalMasuk = 0;
        let totalKeluar = 0;

        formattedData.forEach((item: any) => {
          const nominalVal = Number(item.nominal || 0);
          const jenisStr = String(item.jenis || "").toLowerCase();
          
          if (jenisStr.includes("masuk")) {
            totalMasuk += nominalVal;
          } else if (jenisStr.includes("keluar")) {
            totalKeluar += nominalVal;
          }
        });

        setKpi({
          kasMasuk: totalMasuk,
          kasKeluar: totalKeluar,
          saldoAkhir: totalMasuk - totalKeluar,
        });
      }
    } catch (err) {
      console.error("Gagal memuat data kas:", err);
    }
  };

  useEffect(() => {
    loadDataKas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || !keterangan) {
      alert("Harap isi nominal dan keterangan transaksi!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        action: "tambahKas",
        jenis: jenis,
        nominal: Number(nominal),
        keterangan: keterangan,
        tanggal: new Date().toISOString().split("T")[0],
      };

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      alert("Berhasil! Data transaksi kas telah dikirim ke Google Sheets.");
      setNominal("");
      setKeterangan("");
      setTimeout(() => loadDataKas(), 1500);
    } catch (error) {
      console.error("Gagal menyimpan transaksi:", error);
      alert("Terjadi kesalahan saat menyimpan ke database.");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Edit Transaksi (Anti Duplikat - Memanggil action "editKas")
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    setSavingEdit(true);
    try {
      const payload = {
        action: "editKas",
        id_transaksi: editingTx.id_transaksi,
        tanggal: editingTx.tanggal ? String(editingTx.tanggal).split("T")[0] : "",
        keterangan: editingTx.keterangan,
        jenis: editingTx.jenis,
        nominal: Number(editingTx.nominal),
      };

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      alert("Perubahan transaksi berhasil disimpan permanen ke Google Sheets!");
      setEditingTx(null);
      setTimeout(() => loadDataKas(), 1500);
    } catch (error) {
      console.error("Gagal memperbarui transaksi:", error);
      alert("Terjadi kesalahan saat memperbarui data ke database.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Fungsi Hapus Transaksi Kas
  const handleDelete = async (id_transaksi: string) => {
    if (!confirm(`Yakin ingin menghapus transaksi dengan ID ${id_transaksi}?`)) return;

    try {
      const payload = {
        action: "hapusKas",
        id_transaksi: id_transaksi,
      };

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      alert("Transaksi kas berhasil dihapus dari database!");
      setTimeout(() => loadDataKas(), 1500);
    } catch (error) {
      console.error("Gagal menghapus transaksi:", error);
      alert("Terjadi kesalahan saat menghapus data.");
    }
  };

  // Logika Filter Data Transaksi
  const filteredTransaksi = transaksiList.filter((item) => {
    const tanggalItem = item.tanggal ? String(item.tanggal).split("T")[0] : "";
    const bulanItem = tanggalItem.slice(0, 7);
    const jenisItem = String(item.jenis || "").toLowerCase();

    const matchBulan = filterBulan === "semua" || bulanItem === filterBulan;

    let matchJenis = true;
    if (filterJenis === "masuk") {
      matchJenis = jenisItem.includes("masuk");
    } else if (filterJenis === "keluar") {
      matchJenis = jenisItem.includes("keluar");
    }

    return matchBulan && matchJenis;
  });

  const totalNominalFilter = filteredTransaksi.reduce((acc, item) => acc + Number(item.nominal || 0), 0);

  const daftarBulanUnik = Array.from(
    new Set(
      transaksiList
        .map((item) => (item.tanggal ? String(item.tanggal).split("T")[0].slice(0, 7) : ""))
        .filter((b) => b !== "")
    )
  ).sort().reverse();

  const handleCetakLaporan = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Bar Admin */}
        <div className="no-print bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#047857] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Panel Superadmin DKM
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] mt-2">
              Dashboard Keuangan & Masjid Digital
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={GOOGLE_SHEETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm"
            >
              📊 Buka Sheets
            </a>
            <button
              onClick={() => router.push("/admin/inventaris")}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#047857] border border-emerald-200 text-xs font-semibold"
            >
              📦 Inventaris
            </button>
            <button
              onClick={() => router.push("/admin/kajian")}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#047857] border border-emerald-200 text-xs font-semibold"
            >
              📅 Kajian
            </button>
            <button
              onClick={() => router.push("/admin/profil")}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#047857] border border-emerald-200 text-xs font-semibold"
            >
              ⚙️ Profil
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#064e3b] to-[#003527] text-white p-6 rounded-2xl shadow-md">
            <span className="text-xs text-[#b0f0d6] uppercase font-semibold">Total Saldo Kas</span>
            <h3 className="text-3xl font-extrabold mt-2">Rp {kpi.saldoAkhir.toLocaleString("id-ID")}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Kas Masuk</span>
            <h3 className="text-3xl font-extrabold text-[#047857] mt-2">Rp {kpi.kasMasuk.toLocaleString("id-ID")}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Kas Keluar</span>
            <h3 className="text-3xl font-extrabold text-rose-600 mt-2">Rp {kpi.kasKeluar.toLocaleString("id-ID")}</h3>
          </div>
        </div>

        {/* Form & Status Grid */}
        <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-lg text-[#0b1c30] mb-4">Catat Transaksi Kas Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Transaksi</label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  <option value="masuk">Kas Masuk (Infak / Donasi)</option>
                  <option value="keluar">Kas Keluar (Operasional / Belanja)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Uraian</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Infak Jumat"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#047857] hover:bg-[#064e3b] text-white font-semibold text-sm transition shadow-md disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan ke Database Sheets"}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-lg text-[#0b1c30]">Status Koneksi Database</h2>
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Endpoint Web App:</span>
                  <span className="text-[#047857] font-semibold">connected (/exec)</span>
                </div>
              </div>
            </div>
            <button
              onClick={loadDataKas}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition border border-slate-200"
            >
              Sinkronisasi Ulang Data Sheets
            </button>
          </div>
        </div>

        {/* Tabel Riwayat Mutasi Kas (LENGKAP TOMBOL EDIT & HAPUS) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="font-bold text-lg text-[#0b1c30]">Riwayat Mutasi & Laporan Kas</h2>
              <p className="text-xs text-slate-500">Filter transaksi berdasarkan bulan dan jenis pengeluaran/pemasukan.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="semua">Semua Bulan</option>
                {daftarBulanUnik.map((bulan) => (
                  <option key={bulan} value={bulan}>Bulan: {bulan}</option>
                ))}
              </select>

              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="semua">Semua Jenis</option>
                <option value="masuk">Masuk Saja</option>
                <option value="keluar">Keluar Saja</option>
              </select>

              <button
                onClick={handleCetakLaporan}
                className="px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#064e3b] text-white text-xs font-semibold shadow-sm"
              >
                🖨️ Cetak Laporan
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">ID Transaksi</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3 text-right">Nominal (Rp)</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransaksi.length > 0 ? (
                  filteredTransaksi.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-semibold text-emerald-700 whitespace-nowrap">{item.id_transaksi || "-"}</td>
                      <td className="p-3 whitespace-nowrap">{item.tanggal ? String(item.tanggal).split("T")[0] : "-"}</td>
                      <td className="p-3 font-medium text-slate-800">{item.keterangan || "-"}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                          String(item.jenis).toLowerCase().includes("masuk") ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {item.jenis || "Masuk"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800 whitespace-nowrap">
                        Rp {Number(item.nominal || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 text-center space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setEditingTx(item)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id_transaksi || "")}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada data transaksi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL EDIT */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-800">
            <h3 className="text-lg font-bold text-[#0b1c30] mb-1">Edit Transaksi</h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">ID: {editingTx.id_transaksi}</p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
                <input 
                  type="date" 
                  value={editingTx.tanggal ? String(editingTx.tanggal).split("T")[0] : ""}
                  onChange={(e) => setEditingTx({...editingTx, tanggal: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Keterangan</label>
                <input 
                  type="text" 
                  value={editingTx.keterangan || ""}
                  onChange={(e) => setEditingTx({...editingTx, keterangan: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jenis</label>
                  <select 
                    value={editingTx.jenis || "masuk"}
                    onChange={(e) => setEditingTx({...editingTx, jenis: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="masuk">Masuk</option>
                    <option value="keluar">Keluar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                  <input 
                    type="number" 
                    value={editingTx.nominal || 0}
                    onChange={(e) => setEditingTx({...editingTx, nominal: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

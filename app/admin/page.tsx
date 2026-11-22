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

interface ProfilInfo {
  nama_masjid?: string;
  alamat?: string;
  logo_url?: string;
}

interface PrintMeta {
  code: string;
  stamp: string;
}

async function postImarohAction(payload: Record<string, unknown>) {
  const res = await fetch("/api/imaroh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    message?: string;
    id?: string;
  };

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Gagal menyimpan perubahan ke Google Sheets.");
  }

  return data;
}

function formatPeriodeLabel(bulan: string): string {
  if (!bulan || bulan === "semua") return "Semua Bulan";
  return bulan;
}

function formatKategoriLabel(jenis: string): string {
  if (!jenis || jenis === "semua") return "Semua Jenis (Masuk & Keluar)";
  if (jenis === "masuk") return "Masuk Saja";
  if (jenis === "keluar") return "Keluar Saja";
  return jenis;
}

function createPrintStamp(): PrintMeta {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const code = `MBM-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const stamp = now.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { code, stamp };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [jenis, setJenis] = useState("masuk");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [transaksiList, setTransaksiList] = useState<Transaction[]>([]);
  const [profil, setProfil] = useState<ProfilInfo>({
    nama_masjid: "Masjid Baitul Mu'minin",
    alamat: "Perum Citra Mandiri Regency, Sidoarjo",
    logo_url: "/logo_mbm.png",
  });
  const [printMeta, setPrintMeta] = useState<PrintMeta>({
    code: "MBM-REPORT",
    stamp: "",
  });

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

  const GOOGLE_SHEETS_URL =
    "https://docs.google.com/spreadsheets/d/1v4ckXNCDzC749ecoLLaaAch4Fbfw7bWr6tirfYgYMfw/edit?gid=501383615#gid=501383615";

  // Fungsi untuk memuat data transaksi & profil dari Sheets
  const loadDataKas = async () => {
    try {
      setLoadingData(true);
      const result: any = await fetchImarohData("all");
      if (result) {
        const rawProfil = Array.isArray(result.profil) ? result.profil[0] : result.profil;
        if (rawProfil && typeof rawProfil === "object") {
          setProfil({
            nama_masjid: String(rawProfil.nama_masjid || "Masjid Baitul Mu'minin").trim(),
            alamat: String(rawProfil.alamat || "Perum Citra Mandiri Regency, Sidoarjo").trim(),
            logo_url: String(rawProfil.logo_url || "/logo_mbm.png").trim() || "/logo_mbm.png",
          });
        }

        if (Array.isArray(result.kas)) {
          const rawData = result.kas;

          const formattedData = rawData.map((item: any, index: number) => {
            const originalId = item.id_transaksi || item.id;

            if (originalId) {
              return { ...item, id_transaksi: originalId };
            }

            const dateStr = item.tanggal ? String(item.tanggal).split("T")[0] : "2026-11-01";
            const [y, m] = dateStr.split("-");
            const ym = y && m ? `${y}${m}` : "202611";
            const jenisStr = String(item.jenis || "").toLowerCase();
            const prefix = jenisStr.includes("keluar") ? "OUT-" : "IN-";
            const paddedIdx = String(index + 1).padStart(3, "0");

            return {
              ...item,
              id_transaksi: `${prefix}${ym}-${paddedIdx}`,
            };
          });

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
      }
    } catch (err) {
      console.error("Gagal memuat data kas:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    setPrintMeta(createPrintStamp());
    loadDataKas();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Gagal logout:", err);
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nilaiNominal = Number(nominal);
    const ket = keterangan.trim();

    if (!ket || !Number.isFinite(nilaiNominal) || nilaiNominal <= 0) {
      alert("Isi keterangan dan nominal yang lebih besar dari 0.");
      return;
    }

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";

    const tanggal = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;

    setLoading(true);
    try {
      const res = await postImarohAction({
        action: "tambahKas",
        jenis,
        nominal: nilaiNominal,
        keterangan: ket,
        tanggal,
      });

      alert(res.message || "Transaksi kas berhasil disimpan ke Google Sheets.");
      setNominal("");
      setKeterangan("");
      await loadDataKas();
    } catch (error) {
      console.error("Gagal mengirim transaksi:", error);
      alert(error instanceof Error ? error.message : "Gagal menyimpan transaksi.");
    } finally {
      setLoading(false);
    }
  };

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

      const res = await postImarohAction(payload);
      alert(res.message || "Transaksi kas berhasil diperbarui.");
      setEditingTx(null);
      await loadDataKas();
    } catch (error) {
      console.error("Gagal memperbarui transaksi:", error);
      alert(error instanceof Error ? error.message : "Gagal memperbarui transaksi.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id_transaksi: string) => {
    if (!confirm(`Yakin ingin menghapus transaksi dengan ID ${id_transaksi}?`)) return;

    try {
      const res = await postImarohAction({
        action: "hapusKas",
        id_transaksi,
      });

      alert(res.message || "Transaksi kas berhasil dihapus.");
      await loadDataKas();
    } catch (error) {
      console.error("Gagal menghapus transaksi:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus transaksi.");
    }
  };

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

  const totalNominalFilter = filteredTransaksi.reduce(
    (acc, item) => acc + Number(item.nominal || 0),
    0
  );

  const totalMasukFilter = filteredTransaksi.reduce((acc, item) => {
    const j = String(item.jenis || "").toLowerCase();
    return j.includes("masuk") ? acc + Number(item.nominal || 0) : acc;
  }, 0);

  const totalKeluarFilter = filteredTransaksi.reduce((acc, item) => {
    const j = String(item.jenis || "").toLowerCase();
    return j.includes("keluar") ? acc + Number(item.nominal || 0) : acc;
  }, 0);

  const daftarBulanUnik = Array.from(
    new Set(
      transaksiList
        .map((item) => (item.tanggal ? String(item.tanggal).split("T")[0].slice(0, 7) : ""))
        .filter((b) => b !== "")
    )
  )
    .sort()
    .reverse();

  const handleCetakLaporan = () => {
    const freshStamp = createPrintStamp();
    setPrintMeta(freshStamp);

    const originalTitle = document.title;
    document.title = freshStamp.code;

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };

    window.addEventListener("afterprint", restoreTitle);

    setTimeout(() => {
      window.print();
      // Fallback jika event afterprint tidak dipicu pada beberapa browser
      setTimeout(restoreTitle, 1500);
    }, 50);
  };

  const namaMasjidJudul = (profil.nama_masjid || "MASJID BAITUL MU'MININ").toUpperCase();
  const alamatMasjid = profil.alamat || "Perum Citra Mandiri Regency, Sidoarjo";
  const logoMasjid = profil.logo_url || "/logo_mbm.png";

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto space-y-6 print:max-w-full print:space-y-3">
        {/* Top Bar Admin */}
        <div className="print:hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
              type="button"
              onClick={() => router.push("/admin/inventaris")}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#047857] border border-emerald-200 text-xs font-semibold"
            >
              📦 Inventaris
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/kajian")}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#047857] border border-emerald-200 text-xs font-semibold"
            >
              📅 Kajian
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/profil")}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#047857] border border-emerald-200 text-xs font-semibold"
            >
              ⚙️ Profil
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#064e3b] to-[#003527] text-white p-6 rounded-2xl shadow-md">
            <span className="text-xs text-[#b0f0d6] uppercase font-semibold">Total Saldo Kas</span>
            <h3 className="text-3xl font-extrabold mt-2">
              {loadingData ? "Memuat..." : `Rp ${kpi.saldoAkhir.toLocaleString("id-ID")}`}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Kas Masuk</span>
            <h3 className="text-3xl font-extrabold text-[#047857] mt-2">
              {loadingData ? "Memuat..." : `Rp ${kpi.kasMasuk.toLocaleString("id-ID")}`}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Kas Keluar</span>
            <h3 className="text-3xl font-extrabold text-rose-600 mt-2">
              {loadingData ? "Memuat..." : `Rp ${kpi.kasKeluar.toLocaleString("id-ID")}`}
            </h3>
          </div>
        </div>

        {/* Form & Status Grid */}
        <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-lg text-[#0b1c30] mb-4">Catat Transaksi Kas Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Transaksi
                </label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal (Rp)
                </label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Uraian
                </label>
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
                  <span className="text-slate-600 font-medium">Proxy & Web App:</span>
                  <span className="text-[#047857] font-semibold">connected (/api/imaroh)</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={loadDataKas}
              disabled={loadingData}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition border border-slate-200 disabled:opacity-50"
            >
              {loadingData ? "Menyinkronkan..." : "Sinkronisasi Ulang Data Sheets"}
            </button>
          </div>
        </div>

        {/* Tabel Riwayat Mutasi Kas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 print:p-0 print:border-0 print:shadow-none print:bg-white">
          {/* Kop Cetak A4 (Logo Kiri Atas + Judul + Alamat + Periode/Kategori) */}
          <div className="hidden print:block space-y-2 mb-3">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{printMeta.stamp}</span>
              <span className="font-mono">{printMeta.code}</span>
            </div>

            <div className="flex items-center gap-3 pb-2.5 border-b border-slate-300">
              <img
                src={logoMasjid}
                alt="Logo Masjid"
                className="w-11 h-11 object-contain shrink-0"
              />
              <div className="flex-1 text-center pr-8">
                <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
                  LAPORAN KEUANGAN KAS {namaMasjidJudul}
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">{alamatMasjid}</p>
              </div>
            </div>

            <div className="py-1.5 text-center text-xs text-slate-700 border-b-2 border-slate-800">
              <span>
                Periode Bulan: <strong>{formatPeriodeLabel(filterBulan)}</strong>
              </span>
              <span className="mx-3">&bull;</span>
              <span>
                Kategori: <strong>{formatKategoriLabel(filterJenis)}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="font-bold text-lg text-[#0b1c30]">Riwayat Mutasi & Laporan Kas</h2>
              <p className="print:hidden text-xs text-slate-500">
                Filter transaksi berdasarkan bulan dan jenis pengeluaran/pemasukan.
              </p>
            </div>

            <div className="print:hidden flex flex-wrap items-center gap-3">
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700"
              >
                <option value="semua">Semua Bulan</option>
                {daftarBulanUnik.map((bulan) => (
                  <option key={bulan} value={bulan}>
                    Bulan: {bulan}
                  </option>
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
                type="button"
                onClick={handleCetakLaporan}
                className="px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#064e3b] text-white text-xs font-semibold shadow-sm"
              >
                🖨️ Cetak Laporan
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-start gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs print:bg-white">
            <span className="text-slate-600 font-medium">
              Menampilkan <strong className="text-slate-900">{filteredTransaksi.length}</strong> transaksi
            </span>
            <div className="text-right space-y-1">
              <div className="text-slate-600 font-medium">
                Total Nominal Filter:{" "}
                <strong className="text-[#047857]">
                  Rp {totalNominalFilter.toLocaleString("id-ID")}
                </strong>
              </div>
              {filterJenis === "semua" && (
                <div className="flex flex-wrap justify-end gap-x-4 gap-y-0.5 text-[11px] text-slate-600">
                  <span>
                    Total Masuk:{" "}
                    <strong className="text-[#047857]">
                      Rp {totalMasukFilter.toLocaleString("id-ID")}
                    </strong>
                  </span>
                  <span>
                    Total Keluar:{" "}
                    <strong className="text-rose-600">
                      Rp {totalKeluarFilter.toLocaleString("id-ID")}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 print:bg-white">
                <tr>
                  <th className="p-3">ID Transaksi</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3 text-right">Nominal (Rp)</th>
                  <th className="print:hidden p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingData ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Memuat data transaksi dari Google Sheets...
                    </td>
                  </tr>
                ) : filteredTransaksi.length > 0 ? (
                  filteredTransaksi.map((item, idx) => (
                    <tr
                      key={`${item.id_transaksi || "tx"}-${idx}`}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="p-3 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                        {item.id_transaksi || "-"}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {item.tanggal ? String(item.tanggal).split("T")[0] : "-"}
                      </td>
                      <td className="p-3 font-medium text-slate-800">{item.keterangan || "-"}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                            String(item.jenis).toLowerCase().includes("masuk")
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {item.jenis || "Masuk"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800 whitespace-nowrap">
                        Rp {Number(item.nominal || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="print:hidden p-3 text-center space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingTx(item)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
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
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-800">
            <h3 className="text-lg font-bold text-[#0b1c30] mb-1">Edit Transaksi</h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">ID: {editingTx.id_transaksi}</p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={editingTx.tanggal ? String(editingTx.tanggal).split("T")[0] : ""}
                  onChange={(e) => setEditingTx({ ...editingTx, tanggal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Keterangan</label>
                <input
                  type="text"
                  value={editingTx.keterangan || ""}
                  onChange={(e) => setEditingTx({ ...editingTx, keterangan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jenis</label>
                  <select
                    value={editingTx.jenis || "masuk"}
                    onChange={(e) => setEditingTx({ ...editingTx, jenis: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="masuk">Masuk</option>
                    <option value="keluar">Keluar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    value={editingTx.nominal || 0}
                    onChange={(e) =>
                      setEditingTx({ ...editingTx, nominal: Number(e.target.value) })
                    }
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

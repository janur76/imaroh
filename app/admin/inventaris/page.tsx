"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchImarohData } from "@/lib/api";

interface InventarisItem {
  id_barang?: string;
  nama_barang?: string;
  jumlah?: number | string;
  kondisi?: string;
  lokasi?: string;
  [key: string]: any;
}

type JenisBarangOption = {
  label: string;
  prefix: "MBM-EL-" | "MBM-IB-" | "MBM-FN-" | "MBM-OP-" | "MBM-LN-";
  contoh: string;
};

const JENIS_BARANG_OPTIONS: JenisBarangOption[] = [
  { label: "Elektronik", prefix: "MBM-EL-", contoh: "MBM-EL-001" },
  { label: "Perlengkapan Ibadah", prefix: "MBM-IB-", contoh: "MBM-IB-001" },
  { label: "Furnitur & Mebel", prefix: "MBM-FN-", contoh: "MBM-FN-001" },
  { label: "Kebersihan & Operasional", prefix: "MBM-OP-", contoh: "MBM-OP-001" },
  { label: "Inventaris Lainnya", prefix: "MBM-LN-", contoh: "MBM-LN-001" },
];

const DEFAULT_LOKASI_SARAN = [
  "Ruang Utama Masjid",
  "Ruang Shalat Utama",
  "Ruang Sound System",
  "Ruang Operator Masjid",
  "Gudang",
  "Kantor Takmir",
];

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
    throw new Error(data.error || "Gagal menyimpan perubahan inventaris ke Google Sheets.");
  }

  return data;
}

export default function AdminInventaris() {
  const router = useRouter();
  const [inventarisList, setInventarisList] = useState<InventarisItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Form input tambah barang baru
  const [jenisBarang, setJenisBarang] = useState<string>("Elektronik");
  const [namaBarang, setNamaBarang] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [kondisi, setKondisi] = useState("Baik");
  const [lokasi, setLokasi] = useState("Ruang Utama Masjid");

  // Filter daftar inventaris (ID Barang, Kondisi, Lokasi)
  const [filterId, setFilterId] = useState("");
  const [filterPrefix, setFilterPrefix] = useState("ALL");
  const [filterKondisi, setFilterKondisi] = useState("ALL");
  const [filterLokasi, setFilterLokasi] = useState("ALL");

  // State Modal Edit
  const [editingItem, setEditingItem] = useState<InventarisItem | null>(null);

  const selectedJenisObj = useMemo(
    () =>
      JENIS_BARANG_OPTIONS.find((opt) => opt.label === jenisBarang) ||
      JENIS_BARANG_OPTIONS[0],
    [jenisBarang]
  );

  const loadDataInventaris = async () => {
    try {
      setLoading(true);
      const result = await fetchImarohData("inventaris");
      if (result && result.inventaris) {
        setInventarisList(result.inventaris);
      }
    } catch (err) {
      console.error("Gagal memuat inventaris:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataInventaris();
  }, []);

  // Daftar opsi lokasi unik dari data yang ada (untuk filter)
  const lokasiOptions = useMemo(() => {
    const setLok = new Set<string>();
    inventarisList.forEach((item) => {
      const lok = String(item.lokasi || "").trim();
      if (lok) setLok.add(lok);
    });
    return Array.from(setLok).sort((a, b) => a.localeCompare(b, "id"));
  }, [inventarisList]);

  // Daftar saran lokasi untuk input tambah/edit (gabungan data existing + saran umum)
  const lokasiSaranInput = useMemo(() => {
    const setSaran = new Set<string>(DEFAULT_LOKASI_SARAN);
    lokasiOptions.forEach((lok) => setSaran.add(lok));
    return Array.from(setSaran);
  }, [lokasiOptions]);

  // Daftar opsi kondisi unik (gabungan bawaan + data yang ada)
  const kondisiOptions = useMemo(() => {
    const base = ["Baik", "Kurang Baik", "Perbaikan", "Rusak"];
    const setKon = new Set<string>(base);
    inventarisList.forEach((item) => {
      const kon = String(item.kondisi || "").trim();
      if (kon) setKon.add(kon);
    });
    return Array.from(setKon);
  }, [inventarisList]);

  // Hasil penyaringan daftar inventaris
  const filteredInventaris = useMemo(() => {
    const qId = filterId.trim().toLowerCase();
    return inventarisList.filter((item) => {
      const idVal = String(item.id_barang || "").trim();
      const idLower = idVal.toLowerCase();
      const namaLower = String(item.nama_barang || "").toLowerCase();
      const konVal = String(item.kondisi || "").trim();
      const lokVal = String(item.lokasi || "").trim();

      if (filterPrefix !== "ALL" && !idVal.startsWith(filterPrefix)) {
        return false;
      }

      if (qId && !idLower.includes(qId) && !namaLower.includes(qId)) {
        return false;
      }

      if (filterKondisi !== "ALL" && konVal !== filterKondisi) {
        return false;
      }

      if (filterLokasi !== "ALL" && lokVal !== filterLokasi) {
        return false;
      }

      return true;
    });
  }, [inventarisList, filterId, filterPrefix, filterKondisi, filterLokasi]);

  const hasActiveFilter =
    filterId.trim() !== "" ||
    filterPrefix !== "ALL" ||
    filterKondisi !== "ALL" ||
    filterLokasi !== "ALL";

  const resetFilters = () => {
    setFilterId("");
    setFilterPrefix("ALL");
    setFilterKondisi("ALL");
    setFilterLokasi("ALL");
  };

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

  const handleTambah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang || !jumlah) {
      alert("Harap isi nama barang dan jumlah!");
      return;
    }

    setLoading(true);
    try {
      const res = await postImarohAction({
        action: "tambahInventaris",
        jenis_barang: jenisBarang,
        nama_barang: namaBarang,
        jumlah: Number(jumlah),
        kondisi: kondisi,
        lokasi: lokasi.trim() || "Ruang Utama Masjid",
      });

      alert(
        res.message ||
          `Barang inventaris berhasil ditambahkan${res.id ? ` (ID: ${res.id})` : ""}.`
      );
      setNamaBarang("");
      setJumlah("");
      await loadDataInventaris();
    } catch (error) {
      console.error("Gagal menambah inventaris:", error);
      alert(error instanceof Error ? error.message : "Gagal menambah inventaris.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSavingEdit(true);
    try {
      const res = await postImarohAction({
        action: "editInventaris",
        id_barang: editingItem.id_barang,
        nama_barang: editingItem.nama_barang,
        jumlah: Number(editingItem.jumlah),
        kondisi: editingItem.kondisi,
        lokasi: String(editingItem.lokasi || "").trim() || "Ruang Utama Masjid",
      });

      alert(res.message || "Barang inventaris berhasil diperbarui.");
      setEditingItem(null);
      await loadDataInventaris();
    } catch (error) {
      console.error("Gagal mengupdate inventaris:", error);
      alert(error instanceof Error ? error.message : "Gagal mengupdate inventaris.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id_barang: string) => {
    if (!confirm(`Yakin ingin menghapus barang dengan ID ${id_barang}?`)) return;

    try {
      const res = await postImarohAction({
        action: "hapusInventaris",
        id_barang: id_barang,
      });

      alert(res.message || "Barang inventaris berhasil dihapus.");
      await loadDataInventaris();
    } catch (error) {
      console.error("Gagal menghapus inventaris:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus inventaris.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8">
      <datalist id="lokasi-inventaris-saran">
        {lokasiSaranInput.map((lok) => (
          <option key={lok} value={lok} />
        ))}
      </datalist>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Modul Inventaris Masjid
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] mt-2">
              Kelola Aset & Inventaris
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              ← Kembali ke Dashboard Kas
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Form Tambah & Ringkasan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-lg text-[#0b1c30] mb-4">Tambah Barang Inventaris</h2>
            <form onSubmit={handleTambah} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Barang
                </label>
                <select
                  value={jenisBarang}
                  onChange={(e) => setJenisBarang(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {JENIS_BARANG_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.label}>
                      {opt.label} ({opt.prefix.slice(0, -1)})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Format ID otomatis:{" "}
                  <span className="font-mono font-semibold text-emerald-700">
                    {selectedJenisObj.contoh}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  placeholder="Contoh: AC Daikin 2PK"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min={0}
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                    placeholder="1"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi</label>
                  <select
                    value={kondisi}
                    onChange={(e) => setKondisi(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Kurang Baik">Kurang Baik</option>
                    <option value="Perbaikan">Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi Penyimpanan
                </label>
                <input
                  type="text"
                  list="lokasi-inventaris-saran"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Ketik lokasi baru atau pilih saran di bawah"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {lokasiSaranInput.map((lok) => {
                    const active = lokasi.trim().toLowerCase() === lok.toLowerCase();
                    return (
                      <button
                        key={lok}
                        type="button"
                        onClick={() => setLokasi(lok)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition border ${
                          active
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200"
                        }`}
                      >
                        {lok}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-md disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Tambah ke Inventaris"}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-lg text-[#0b1c30]">Informasi Aset</h2>
              <p className="text-xs text-slate-500 mt-1">
                Total jenis barang terdaftar di database:
              </p>
              <div className="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 font-semibold uppercase">
                    Total Jenis Barang
                  </span>
                  <h3 className="text-3xl font-extrabold text-emerald-700 mt-1">
                    {inventarisList.length} Item
                  </h3>
                </div>
                <span className="text-3xl">📦</span>
              </div>
            </div>
            <button
              type="button"
              onClick={loadDataInventaris}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition border border-slate-200"
            >
              🔄 Sinkronisasi Ulang Data
            </button>
          </div>
        </div>

        {/* Tabel Inventaris + Filter */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-lg text-[#0b1c30]">Daftar Inventaris Masjid</h2>
              <p className="text-xs text-slate-500">
                Menampilkan {filteredInventaris.length} dari {inventarisList.length} barang
              </p>
            </div>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                ✕ Reset Filter
              </button>
            )}
          </div>

          {/* Bar Filter: ID Barang, Kondisi, Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Cari ID / Nama Barang
              </label>
              <input
                type="text"
                value={filterId}
                onChange={(e) => setFilterId(e.target.value)}
                placeholder="Contoh: MBM-EL-001 atau AC"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Kategori ID Barang
              </label>
              <select
                value={filterPrefix}
                onChange={(e) => setFilterPrefix(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="ALL">Semua ID Barang</option>
                {JENIS_BARANG_OPTIONS.map((opt) => (
                  <option key={opt.prefix} value={opt.prefix}>
                    {opt.prefix.slice(0, -1)} — {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Filter Kondisi
              </label>
              <select
                value={filterKondisi}
                onChange={(e) => setFilterKondisi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="ALL">Semua Kondisi</option>
                {kondisiOptions.map((kon) => (
                  <option key={kon} value={kon}>
                    {kon}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Filter Lokasi
              </label>
              <select
                value={filterLokasi}
                onChange={(e) => setFilterLokasi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="ALL">Semua Lokasi</option>
                {lokasiOptions.map((lok) => (
                  <option key={lok} value={lok}>
                    {lok}
                  </option>
                ))}
              </select>
            </div>
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
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventaris.length > 0 ? (
                  filteredInventaris.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                        {item.id_barang || "-"}
                      </td>
                      <td className="p-3 font-medium text-slate-900">{item.nama_barang || "-"}</td>
                      <td className="p-3 text-center font-bold text-slate-800">
                        {item.jumlah || 1}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                            item.kondisi === "Baik"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.kondisi || "Baik"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{item.lokasi || "-"}</td>
                      <td className="p-3 text-center space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id_barang || "")}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {inventarisList.length === 0
                        ? "Belum ada data inventaris yang tercatat."
                        : "Tidak ada barang inventaris yang cocok dengan filter yang dipilih."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL EDIT INVENTARIS */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-800">
            <h3 className="text-lg font-bold text-[#0b1c30] mb-1">Edit Inventaris</h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">ID: {editingItem.id_barang}</p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={editingItem.nama_barang || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, nama_barang: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min={0}
                    value={editingItem.jumlah || 1}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, jumlah: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Kondisi</label>
                  <select
                    value={editingItem.kondisi || "Baik"}
                    onChange={(e) => setEditingItem({ ...editingItem, kondisi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Kurang Baik">Kurang Baik</option>
                    <option value="Perbaikan">Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Lokasi</label>
                <input
                  type="text"
                  list="lokasi-inventaris-saran"
                  value={editingItem.lokasi || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, lokasi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md disabled:opacity-50"
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

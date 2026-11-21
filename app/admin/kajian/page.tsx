"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchImarohData } from "@/lib/api";

interface KajianItem {
  id_kajian?: string;
  tanggal?: string;
  waktu?: string;
  tema?: string;
  pemateri?: string;
  tempat?: string;
  [key: string]: any;
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
    throw new Error(data.error || "Gagal menyimpan jadwal kajian ke Google Sheets.");
  }

  return data;
}

export default function KajianAdminPage() {
  const router = useRouter();
  const [kajianList, setKajianList] = useState<KajianItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // State Form Tambah Kajian
  const [tanggal, setTanggal] = useState("");
  const [waktu, setWaktu] = useState("");
  const [tema, setTema] = useState("");
  const [pemateri, setPemateri] = useState("");
  const [tempat, setTempat] = useState("");

  // State Modal Edit Kajian
  const [editingItem, setEditingItem] = useState<KajianItem | null>(null);

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
    if (!tanggal || !tema || !pemateri) {
      alert("Harap isi tanggal, tema, dan pemateri kajian!");
      return;
    }

    setLoading(true);
    try {
      const res = await postImarohAction({
        action: "tambahKajian",
        tanggal: tanggal,
        waktu: waktu || "Ba'da Isya'",
        tema: tema,
        pemateri: pemateri,
        tempat: tempat || "Masjid Baitul Mu'minin",
      });

      alert(res.message || "Jadwal kajian berhasil ditambahkan ke Google Sheets.");
      setTanggal("");
      setWaktu("");
      setTema("");
      setPemateri("");
      setTempat("");

      await loadKajian();
    } catch (error) {
      console.error("Gagal menyimpan kajian:", error);
      alert(error instanceof Error ? error.message : "Gagal menyimpan jadwal kajian.");
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
        action: "editKajian",
        id_kajian: editingItem.id_kajian,
        tanggal: editingItem.tanggal ? String(editingItem.tanggal).split("T")[0] : "",
        waktu: editingItem.waktu,
        tema: editingItem.tema,
        pemateri: editingItem.pemateri,
        tempat: editingItem.tempat,
      });

      alert(res.message || "Jadwal kajian berhasil diperbarui.");
      setEditingItem(null);
      await loadKajian();
    } catch (error) {
      console.error("Gagal memperbarui kajian:", error);
      alert(error instanceof Error ? error.message : "Gagal memperbarui jadwal kajian.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id_kajian: string) => {
    if (!confirm(`Yakin ingin menghapus jadwal kajian dengan ID ${id_kajian}?`)) return;

    try {
      const res = await postImarohAction({
        action: "hapusKajian",
        id_kajian: id_kajian,
      });

      alert(res.message || "Jadwal kajian berhasil dihapus.");
      await loadKajian();
    } catch (error) {
      console.error("Gagal menghapus kajian:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus jadwal kajian.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Modul Kajian & Kegiatan
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] mt-2">
              Kelola Jadwal Kajian Masjid
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
            <h2 className="font-bold text-lg text-[#0b1c30] mb-4">Tambah Jadwal Kajian Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu / Pukul
                  </label>
                  <input
                    type="text"
                    value={waktu}
                    onChange={(e) => setWaktu(e.target.value)}
                    placeholder="Ba'da Maghrib"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tema Kajian
                </label>
                <input
                  type="text"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Contoh: Fiqih Ibadah Sehari-hari"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pemateri / Ustadz
                  </label>
                  <input
                    type="text"
                    value={pemateri}
                    onChange={(e) => setPemateri(e.target.value)}
                    placeholder="Ustadz Dr. ..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat</label>
                  <input
                    type="text"
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value)}
                    placeholder="Ruang Utama Masjid"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-md disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Jadwal Kajian"}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-lg text-[#0b1c30]">Informasi Kajian</h2>
              <p className="text-xs text-slate-500 mt-1">
                Total jadwal kajian tercatat di database:
              </p>
              <div className="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 font-semibold uppercase">
                    Total Jadwal
                  </span>
                  <h3 className="text-3xl font-extrabold text-emerald-700 mt-1">
                    {kajianList.length} Agenda
                  </h3>
                </div>
                <span className="text-3xl">📅</span>
              </div>
            </div>
            <button
              type="button"
              onClick={loadKajian}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition border border-slate-200"
            >
              🔄 Sinkronisasi Ulang Data
            </button>
          </div>
        </div>

        {/* Tabel Kajian */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="font-bold text-lg text-[#0b1c30]">Daftar Agenda Kajian</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">ID Kajian</th>
                  <th className="p-3">Tanggal & Waktu</th>
                  <th className="p-3">Tema Kajian</th>
                  <th className="p-3">Pemateri</th>
                  <th className="p-3">Tempat</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kajianList.length > 0 ? (
                  kajianList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                        {item.id_kajian || "-"}
                      </td>
                      <td className="p-3 whitespace-nowrap font-medium text-slate-800">
                        {item.tanggal ? String(item.tanggal).split("T")[0] : "-"} <br />
                        <span className="text-[10px] text-slate-500">{item.waktu || "-"}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{item.tema || "-"}</td>
                      <td className="p-3 font-medium text-slate-700">{item.pemateri || "-"}</td>
                      <td className="p-3 text-slate-600">{item.tempat || "-"}</td>
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
                          onClick={() => handleDelete(item.id_kajian || "")}
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
                      Belum ada jadwal kajian yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL EDIT KAJIAN */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-800">
            <h3 className="text-lg font-bold text-[#0b1c30] mb-1">Edit Jadwal Kajian</h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">ID: {editingItem.id_kajian}</p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={editingItem.tanggal ? String(editingItem.tanggal).split("T")[0] : ""}
                    onChange={(e) => setEditingItem({ ...editingItem, tanggal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Waktu</label>
                  <input
                    type="text"
                    value={editingItem.waktu || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, waktu: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tema Kajian
                </label>
                <input
                  type="text"
                  value={editingItem.tema || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, tema: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pemateri</label>
                  <input
                    type="text"
                    value={editingItem.pemateri || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, pemateri: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tempat</label>
                  <input
                    type="text"
                    value={editingItem.tempat || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, tempat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
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

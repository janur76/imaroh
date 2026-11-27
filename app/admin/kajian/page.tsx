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
  foto_url?: string;
  [key: string]: any;
}

function extractDriveFileId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const filePathMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (filePathMatch?.[1]) return filePathMatch[1];

  const dPathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dPathMatch?.[1] && trimmed.includes("drive.google.com")) return dPathMatch[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (
    idParamMatch?.[1] &&
    (trimmed.includes("drive.google.com") || trimmed.includes("googleusercontent.com"))
  ) {
    return idParamMatch[1];
  }

  const lhMatch = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lhMatch?.[1]) return lhMatch[1];

  return null;
}

function normalizeDriveImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

function normalizeMultiFotoInput(rawInput: string): string {
  const parts = rawInput
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeDriveImageUrl);

  return parts.join("\n");
}

function parsePreviewPhotos(rawInput?: string): string[] {
  if (!rawInput) return [];
  return rawInput
    .split(/[\n,]+/)
    .map((item) => normalizeDriveImageUrl(item))
    .filter(Boolean);
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
  const [refreshing, setRefreshing] = useState(false);

  // Mode Edit (null = mode Tambah Jadwal Kajian Baru)
  const [editingId, setEditingId] = useState<string | null>(null);

  // State Form Tambah / Edit Kajian
  const [tanggal, setTanggal] = useState("");
  const [waktu, setWaktu] = useState("");
  const [tema, setTema] = useState("");
  const [pemateri, setPemateri] = useState("");
  const [tempat, setTempat] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  const loadKajian = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const result = await fetchImarohData("kajian");
      if (result && result.kajian) {
        setKajianList(result.kajian);
      }
    } catch (err) {
      console.error("Gagal memuat data kajian:", err);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadKajian();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTanggal("");
    setWaktu("");
    setTema("");
    setPemateri("");
    setTempat("");
    setFotoUrl("");
  };

  const handleStartEdit = (item: KajianItem) => {
    setEditingId(item.id_kajian || "");
    setTanggal(item.tanggal ? String(item.tanggal).split("T")[0] : "");
    setWaktu(item.waktu || "");
    setTema(item.tema || "");
    setPemateri(item.pemateri || "");
    setTempat(item.tempat || "");
    setFotoUrl(item.foto_url ? normalizeMultiFotoInput(item.foto_url) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !tema || !pemateri) {
      alert("Harap isi tanggal, tema, dan pemateri kajian!");
      return;
    }

    setLoading(true);
    try {
      const formattedFoto = normalizeMultiFotoInput(fotoUrl);
      const isEditing = Boolean(editingId);

      const res = await postImarohAction(
        isEditing
          ? {
              action: "editKajian",
              id_kajian: editingId,
              tanggal,
              waktu: waktu || "Ba'da Isya'",
              tema,
              pemateri,
              tempat: tempat || "Masjid Baitul Mu'minin",
              foto_url: formattedFoto,
            }
          : {
              action: "tambahKajian",
              tanggal,
              waktu: waktu || "Ba'da Isya'",
              tema,
              pemateri,
              tempat: tempat || "Masjid Baitul Mu'minin",
              foto_url: formattedFoto,
            }
      );

      alert(
        res.message ||
          (isEditing
            ? "Jadwal kajian berhasil diperbarui."
            : "Jadwal kajian berhasil ditambahkan ke Google Sheets.")
      );
      resetForm();
      await loadKajian();
    } catch (error) {
      console.error("Gagal menyimpan kajian:", error);
      alert(error instanceof Error ? error.message : "Gagal menyimpan jadwal kajian.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id_kajian: string) => {
    if (!confirm(`Yakin ingin menghapus jadwal kajian dengan ID ${id_kajian}?`)) return;

    try {
      const res = await postImarohAction({
        action: "hapusKajian",
        id_kajian,
      });

      if (editingId === id_kajian) {
        resetForm();
      }
      alert(res.message || "Jadwal kajian berhasil dihapus.");
      await loadKajian();
    } catch (error) {
      console.error("Gagal menghapus kajian:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus jadwal kajian.");
    }
  };

  const previewPhotos = parsePreviewPhotos(fotoUrl);

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Modul Kajian &amp; Dokumentasi
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] mt-2">
              Kelola Jadwal &amp; Dokumentasi Kajian
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Catatan kajian rutin beserta dokumentasi foto kegiatan dari Google Drive.
            </p>
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

        {/* Kartu Form Tambah / Edit Kajian */}
        <div className="bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-bold text-lg text-[#0b1c30]">
                {editingId ? `Edit Jadwal Kajian (${editingId})` : "Tambah Jadwal Kajian Baru"}
              </h2>
              <p className="text-xs text-slate-500">
                Isi jadwal kajian dan tempel link foto dokumentasi Google Drive bila tersedia.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal *
                </label>
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
                  placeholder="Ba'da Subuh Setiap Sabtu"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tema Kajian *
              </label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Contoh: Kajian Kitab Nashoihud Diniyah"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pemateri / Ustadz *
                </label>
                <input
                  type="text"
                  value={pemateri}
                  onChange={(e) => setPemateri(e.target.value)}
                  placeholder="Ustadz Habib Al Amin, S.Th.I.M.Sy"
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
                  placeholder="Ruang Shalat Dalam Masjid"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link Foto Google Drive (Opsional, Bisa &gt; 1 Foto)
              </label>
              <textarea
                rows={3}
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                onBlur={() => setFotoUrl((prev) => normalizeMultiFotoInput(prev))}
                placeholder="Tempel link foto Google Drive (pisah Enter atau koma untuk beberapa foto)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Link Google Drive otomatis dikonversi ke format gambar langsung saat disimpan.
              </p>
            </div>

            {previewPhotos.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-700">
                  Pratinjau Foto Terdeteksi ({previewPhotos.length}):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {previewPhotos.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="h-24 rounded-xl bg-white border border-slate-200 overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Pratinjau foto kajian ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading}
                className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-md disabled:opacity-50"
              >
                {loading
                  ? "Menyimpan..."
                  : editingId
                  ? "Simpan Perubahan"
                  : "Simpan Jadwal Kajian"}
              </button>
            </div>
          </form>
        </div>

        {/* Daftar Agenda Kajian */}
        <div className="bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-lg text-[#0b1c30]">
                Daftar Agenda Kajian ({kajianList.length})
              </h2>
              <p className="text-xs text-slate-500">
                Kelola jadwal kajian dan jumlah foto dokumentasi yang tampil di halaman publik.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadKajian(true)}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 disabled:opacity-50"
            >
              {refreshing ? "Menyinkronkan..." : "Refresh Data"}
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {kajianList.length > 0 ? (
              kajianList.map((item, idx) => {
                const fotoCount = parsePreviewPhotos(item.foto_url).length;
                const tglStr = item.tanggal ? String(item.tanggal).split("T")[0] : "-";

                return (
                  <div
                    key={item.id_kajian || idx}
                    className="py-4 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          {item.id_kajian || "-"}
                        </span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {tglStr}
                        </span>
                        <span className="text-slate-500">{item.waktu || "-"}</span>
                        {fotoCount > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {fotoCount} Foto
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {item.tema || "-"}
                      </h3>

                      <p className="text-xs text-slate-600">
                        Pemateri: <span className="font-semibold">{item.pemateri || "-"}</span>
                        {item.tempat ? ` • ${item.tempat}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id_kajian || "")}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-xs text-slate-400">
                Belum ada jadwal kajian yang tercatat.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

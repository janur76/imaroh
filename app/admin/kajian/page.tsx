"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchImarohData, mutateImarohData } from "@/lib/api";

interface KajianItem {
  id_kajian: string;
  tanggal: string;
  waktu: string;
  tema: string;
  pemateri: string;
  tempat: string;
  foto_url?: string;
  deskripsi?: string;
}

function normalizeGoogleDriveImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  const filePathMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (filePathMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${filePathMatch[1]}`;
  }

  const dPathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dPathMatch?.[1] && trimmed.includes("drive.google.com")) {
    return `https://lh3.googleusercontent.com/d/${dPathMatch[1]}`;
  }

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (
    idParamMatch?.[1] &&
    (trimmed.includes("drive.google.com") || trimmed.includes("googleusercontent.com"))
  ) {
    return `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
  }

  return trimmed;
}

function parseFotoUrls(raw?: string): string[] {
  if (!raw) return [];
  return String(raw)
    .split(/[\n,]+/)
    .map((item) => normalizeGoogleDriveImageUrl(item))
    .filter(Boolean);
}

export default function AdminKajianPage() {
  const router = useRouter();
  const [kajianList, setKajianList] = useState<KajianItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split("T")[0]);
  const [waktu, setWaktu] = useState("Ba'da Subuh (04.30 – Syuruq)");
  const [tema, setTema] = useState("");
  const [pemateri, setPemateri] = useState("");
  const [tempat, setTempat] = useState("Masjid Baitul Mu'minin");
  const [deskripsi, setDeskripsi] = useState("");
  const [fotoInput, setFotoInput] = useState("");

  const loadKajian = async () => {
    setLoading(true);
    try {
      const data = await fetchImarohData("kajian");
      if (data?.kajian) {
        setKajianList(data.kajian);
      }
    } catch (error) {
      console.error("Gagal memuat jadwal kajian:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKajian();
  }, []);

  const previewPhotos = useMemo(() => parseFotoUrls(fotoInput), [fotoInput]);

  const resetForm = () => {
    setEditingId(null);
    setTanggal(new Date().toISOString().split("T")[0]);
    setWaktu("Ba'da Subuh (04.30 – Syuruq)");
    setTema("");
    setPemateri("");
    setTempat("Masjid Baitul Mu'minin");
    setDeskripsi("");
    setFotoInput("");
  };

  const handleEdit = (item: KajianItem) => {
    setEditingId(item.id_kajian);
    setTanggal(item.tanggal ? String(item.tanggal).split("T")[0] : "");
    setWaktu(item.waktu || "");
    setTema(item.tema || "");
    setPemateri(item.pemateri || "");
    setTempat(item.tempat || "");
    setDeskripsi(item.deskripsi || "");
    setFotoInput(
      parseFotoUrls(item.foto_url).join("\n")
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim() || !pemateri.trim()) {
      alert("Tema kajian dan nama pemateri wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const normalizedFotos = parseFotoUrls(fotoInput).join("\n");
      const payload = {
        tanggal,
        waktu: waktu.trim(),
        tema: tema.trim(),
        pemateri: pemateri.trim(),
        tempat: tempat.trim(),
        deskripsi: deskripsi.trim(),
        foto_url: normalizedFotos,
      };

      const res = editingId
        ? await mutateImarohData("editKajian", { id_kajian: editingId, ...payload })
        : await mutateImarohData("tambahKajian", payload);

      if (res?.status === "success") {
        alert(
          editingId
            ? "Jadwal & dokumentasi kajian berhasil diperbarui!"
            : "Jadwal & dokumentasi kajian berhasil ditambahkan!"
        );
        resetForm();
        await loadKajian();
      } else {
        alert("Gagal menyimpan kajian: " + (res?.message || "Terjadi kesalahan."));
      }
    } catch (error) {
      console.error("Error simpan kajian:", error);
      alert("Gagal menghubungi server saat menyimpan kajian.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: KajianItem) => {
    if (!confirm(`Hapus agenda kajian "${item.tema}" (${item.id_kajian})?`)) return;
    try {
      const res = await mutateImarohData("hapusKajian", { id_kajian: item.id_kajian });
      if (res?.status === "success") {
        if (editingId === item.id_kajian) resetForm();
        await loadKajian();
      } else {
        alert("Gagal menghapus kajian: " + (res?.message || "Terjadi kesalahan."));
      }
    } catch (error) {
      console.error("Error hapus kajian:", error);
      alert("Gagal menghapus data kajian.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/admin/login");
  };

  return (
    <main className="min-h-screen bg-[#f4f7f6] text-[#0b1c30] py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Admin Kajian */}
        <header className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Modul Kajian &amp; Dokumentasi
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0b1c30] mt-1.5">
              Kelola Jadwal &amp; Dokumentasi Kajian
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Catatan kajian rutin beserta deskripsi materi dan dokumentasi foto kegiatan dari Google Drive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              ← Kembali ke Dashboard Kas
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Form Tambah / Edit Kajian */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-extrabold text-[#0b1c30]">
                {editingId ? `Edit Jadwal Kajian (${editingId})` : "Tambah Jadwal Kajian Baru"}
              </h2>
              <p className="text-xs text-slate-500">
                Isi jadwal kajian, penjelasan singkat materi, dan tempel link foto dokumentasi Google Drive bila tersedia.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal *</label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Waktu / Pukul</label>
                <input
                  type="text"
                  placeholder="Contoh: Ba'da Subuh (04.30 – Syuruq)"
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tema Kajian *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Kajian Kitab Nashoihud Diniyah"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pemateri / Ustadz *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ust. Habib Al Amin, S.Th.I.M.Sy"
                  value={pemateri}
                  onChange={(e) => setPemateri(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tempat</label>
                <input
                  type="text"
                  placeholder="Masjid Baitul Mu'minin"
                  value={tempat}
                  onChange={(e) => setTempat(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi / Penjelasan Singkat Isi Kajian (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan ringkasan bab, kitab, atau pokok bahasan yang disampaikan pada sesi kajian ini..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link Foto Google Drive (Opsional, Bisa &gt; 1 Foto)
              </label>
              <textarea
                rows={3}
                placeholder={
                  "Tempel 1 link foto per baris (pastikan akses file Drive: Anyone with the link / Siapa saja yang memiliki link):\nhttps://drive.google.com/file/d/1ABC.../view?usp=sharing"
                }
                value={fotoInput}
                onChange={(e) => setFotoInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Link Google Drive otomatis dikonversi ke format gambar langsung saat disimpan.
              </p>
            </div>

            {previewPhotos.length > 0 && (
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Pratinjau Foto Terdeteksi ({previewPhotos.length}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {previewPhotos.map((url, i) => (
                    <div
                      key={`${url}-${i}`}
                      className="h-24 rounded-xl bg-white border border-slate-200 overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Pratinjau foto ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold shadow-sm transition"
              >
                {saving
                  ? "Menyimpan..."
                  : editingId
                  ? "Simpan Perubahan"
                  : "Simpan Jadwal Kajian"}
              </button>
            </div>
          </form>
        </section>

        {/* Daftar Agenda Kajian */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#0b1c30]">
                Daftar Agenda Kajian ({kajianList.length})
              </h2>
              <p className="text-xs text-slate-500">
                Kelola jadwal kajian, deskripsi materi, dan jumlah foto dokumentasi yang tampil di halaman publik.
              </p>
            </div>
            <button
              type="button"
              onClick={loadKajian}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              Refresh Data
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 text-center py-8">Memuat daftar kajian...</p>
          ) : kajianList.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              Belum ada data jadwal kajian.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {kajianList.map((item) => {
                const fotos = parseFotoUrls(item.foto_url);
                return (
                  <div
                    key={item.id_kajian}
                    className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {item.id_kajian}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {item.tanggal ? String(item.tanggal).split("T")[0] : "-"}
                        </span>
                        <span className="text-[11px] text-slate-400">• {item.waktu}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            fotos.length > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {fotos.length} Foto
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900">{item.tema}</h3>
                      <p className="text-xs text-slate-600">
                        Pemateri: <span className="font-semibold">{item.pemateri}</span> •{" "}
                        {item.tempat}
                      </p>
                      {item.deskripsi && (
                        <p className="text-xs text-slate-500 line-clamp-2 pt-0.5">
                          {item.deskripsi}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

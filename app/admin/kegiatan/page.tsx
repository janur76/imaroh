"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type BeritaItem = {
  id: string;
  judul: string;
  status: string;
  ringkasan: string;
  foto_url: string | null;
  petugas: string | null;
  tampil_publik: boolean;
  tanggal_update: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const STATUS_OPTIONS = ["Sedang Berjalan", "Tahap Penyelesaian", "Selesai"];

const emptyForm = {
  id: "",
  judul: "",
  status: "Sedang Berjalan",
  tanggal_update: new Date().toISOString().slice(0, 10),
  petugas: "",
  foto_url: "",
  ringkasan: "",
  tampil_publik: true,
};

function extractDriveFileId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const filePathMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (filePathMatch?.[1]) return filePathMatch[1];

  const dPathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dPathMatch?.[1] && trimmed.includes("drive.google.com")) return dPathMatch[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch?.[1] && trimmed.includes("drive.google.com")) return idParamMatch[1];

  return null;
}

function normalizeDriveImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
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

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Terjadi kesalahan";
}

export default function AdminKegiatanPage() {
  const [list, setList] = useState<BeritaItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "ok" | "err"; teks: string } | null>(null);

  const fetchAll = useCallback(async () => {
    if (!supabase) {
      setPesan({
        tipe: "err",
        teks: "Konfigurasi NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum terpasang.",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("imaroh_berita_kegiatan")
      .select("id, judul, status, ringkasan, foto_url, petugas, tampil_publik, tanggal_update")
      .order("tanggal_update", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setPesan({ tipe: "err", teks: "Gagal memuat daftar kegiatan: " + error.message });
    } else {
      setList(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function mulaiEdit(item: BeritaItem) {
    setPesan(null);
    setForm({
      id: item.id,
      judul: item.judul,
      status: item.status || "Sedang Berjalan",
      tanggal_update: item.tanggal_update || new Date().toISOString().slice(0, 10),
      petugas: item.petugas || "",
      foto_url: item.foto_url ? normalizeMultiFotoInput(item.foto_url) : "",
      ringkasan: item.ringkasan,
      tampil_publik: Boolean(item.tampil_publik),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      tanggal_update: new Date().toISOString().slice(0, 10),
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setPesan({ tipe: "err", teks: "Koneksi Supabase belum terkonfigurasi." });
      return;
    }

    if (!form.judul.trim() || !form.ringkasan.trim()) {
      setPesan({ tipe: "err", teks: "Judul dan ringkasan kegiatan wajib diisi." });
      return;
    }

    setSaving(true);
    setPesan(null);

    const formattedFotoUrl = normalizeMultiFotoInput(form.foto_url);

    const payload = {
      judul: form.judul.trim(),
      status: form.status,
      tanggal_update: form.tanggal_update,
      petugas: form.petugas.trim() || "Takmir Masjid",
      foto_url: formattedFotoUrl || null,
      ringkasan: form.ringkasan.trim(),
      tampil_publik: form.tampil_publik,
      updated_at: new Date().toISOString(),
    };

    try {
      if (form.id) {
        const { error } = await supabase
          .from("imaroh_berita_kegiatan")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
        setPesan({ tipe: "ok", teks: "Kabar kegiatan berhasil diperbarui." });
      } else {
        const { error } = await supabase.from("imaroh_berita_kegiatan").insert([payload]);
        if (error) throw error;
        setPesan({ tipe: "ok", teks: "Kabar kegiatan baru berhasil disimpan." });
      }

      resetForm();
      await fetchAll();
    } catch (err) {
      setPesan({ tipe: "err", teks: "Gagal menyimpan: " + getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function togglePublik(item: BeritaItem) {
    if (!supabase) return;
    const { error } = await supabase
      .from("imaroh_berita_kegiatan")
      .update({ tampil_publik: !item.tampil_publik, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      setPesan({ tipe: "err", teks: "Gagal mengubah status tayang: " + error.message });
      return;
    }

    setList((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, tampil_publik: !row.tampil_publik } : row
      )
    );
  }

  async function handleHapus(id: string, judul: string) {
    if (!supabase) return;
    const yakin = window.confirm(`Hapus kabar kegiatan "${judul}"?`);
    if (!yakin) return;

    const { error } = await supabase.from("imaroh_berita_kegiatan").delete().eq("id", id);
    if (error) {
      setPesan({ tipe: "err", teks: "Gagal menghapus: " + error.message });
    } else {
      setPesan({ tipe: "ok", teks: "Kabar kegiatan dihapus." });
      if (form.id === id) resetForm();
      setList((prev) => prev.filter((row) => row.id !== id));
    }
  }

  const previewPhotos = form.foto_url
    .split(/[\n,]+/)
    .map((u) => normalizeDriveImageUrl(u))
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Panel Takmir • Baitul Mu&apos;minin News
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              Kelola Kabar &amp; Progres Kegiatan Masjid
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Catat aktivitas lapangan singkat (misal pasang paving, cat tembok, kerja bakti) agar cepat tampil di portal publik.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              ← Kembali ke Admin
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
            >
              Lihat Portal Publik
            </Link>
          </div>
        </div>

        {/* Notifikasi */}
        {pesan && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold border ${
              pesan.tipe === "ok"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}
          >
            {pesan.teks}
          </div>
        )}

        {/* Form Tambah / Edit */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              {form.id ? "Edit Kabar Kegiatan" : "+ Tambah Kabar Kegiatan Baru"}
            </h2>
            {form.id && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Kegiatan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pemasangan Paving Halaman Samping"
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-600"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Update
              </label>
              <input
                type="date"
                value={form.tanggal_update}
                onChange={(e) => setForm({ ...form, tanggal_update: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Petugas / Takmir
              </label>
              <input
                type="text"
                placeholder="Contoh: Pak Hadi / Sie Sarpras"
                value={form.petugas}
                onChange={(e) => setForm({ ...form, petugas: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link Foto Google Drive (Opsional, Bisa &gt; 1 Foto)
              </label>
              <textarea
                rows={2}
                placeholder={"Tempel link Google Drive (bisa lebih dari 1, pisahkan Enter atau koma)"}
                value={form.foto_url}
                onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
                onBlur={() =>
                  setForm((prev) => ({
                    ...prev,
                    foto_url: normalizeMultiFotoInput(prev.foto_url),
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Link Google Drive otomatis dikonversi ke format gambar langsung saat disimpan.
              </p>
            </div>
          </div>

          {previewPhotos.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-[11px] font-bold text-slate-600">
                Pratinjau Foto Terdeteksi ({previewPhotos.length}):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {previewPhotos.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="h-24 rounded-xl bg-white border border-slate-200 overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`Pratinjau ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ringkasan Singkat Progres *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Contoh: Perataan pasir urug dan pemasangan paving blok sisi utara sudah mencapai ±60%, dilanjutkan perapian tepi."
              value={form.ringkasan}
              onChange={(e) => setForm({ ...form, ringkasan: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.tampil_publik}
                onChange={(e) => setForm({ ...form, tampil_publik: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Tampilkan di halaman publik (Baitul Mu&apos;minin News)
            </label>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-extrabold shadow-sm transition"
            >
              {saving ? "Menyimpan..." : form.id ? "Simpan Perubahan" : "Publikasikan Kabar"}
            </button>
          </div>
        </form>

        {/* Daftar Kabar Tersimpan */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Daftar Kabar Kegiatan ({list.length})
            </h2>
            <button
              type="button"
              onClick={fetchAll}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Refresh Data
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">Memuat data...</p>
          ) : list.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada data kegiatan. Silakan tambah lewat form di atas.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {list.map((item) => {
                const fotoCount = (item.foto_url || "")
                  .split(/[\n,]+/)
                  .map((s) => s.trim())
                  .filter(Boolean).length;

                return (
                  <div
                    key={item.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">
                          {item.tanggal_update}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.status}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            item.tampil_publik
                              ? "bg-sky-50 text-sky-800 border-sky-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {item.tampil_publik ? "Tayang di Publik" : "Disembunyikan"}
                        </span>
                        {fotoCount > 0 && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            {fotoCount} Foto
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900">{item.judul}</h3>
                      <p className="text-xs text-slate-600">{item.ringkasan}</p>
                      <p className="text-[11px] text-slate-400">Petugas: {item.petugas || "-"}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => togglePublik(item)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                      >
                        {item.tampil_publik ? "Sembunyikan" : "Tayangkan"}
                      </button>
                      <button
                        type="button"
                        onClick={() => mulaiEdit(item)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHapus(item.id, item.judul)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-800 hover:bg-rose-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
```[cite: 17]

---

### 2. `components/BaitulMumininNewsSection.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type BeritaItem = {
  id: string;
  judul: string;
  status: string;
  ringkasan: string;
  foto_url: string | null;
  petugas: string | null;
  tampil_publik: boolean;
  tanggal_update: string;
};

type LightboxState = {
  url: string;
  judul: string;
} | null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function extractDriveFileId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const filePathMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (filePathMatch?.[1]) return filePathMatch[1];

  const dPathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dPathMatch?.[1] && trimmed.includes("drive.google.com")) return dPathMatch[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch?.[1] && trimmed.includes("drive.google.com")) return idParamMatch[1];

  return null;
}

function normalizeDriveImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  return trimmed;
}

function parsePhotoUrls(fotoUrl: string | null): string[] {
  if (!fotoUrl) return [];
  return fotoUrl
    .split(/[\n,]+/)
    .map((entry) => normalizeDriveImageUrl(entry))
    .filter(Boolean);
}

function statusBadgeStyle(status: string) {
  const s = String(status || "").toLowerCase();
  if (s.includes("selesai")) {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }
  if (s.includes("penyelesaian") || s.includes("hampir")) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  return "bg-emerald-50 text-emerald-800 border-emerald-200";
}

export default function BaitulMumininNewsSection() {
  const [items, setItems] = useState<BeritaItem[]>([]);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadNews() {
      if (!supabase) {
        if (active) setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("imaroh_berita_kegiatan")
          .select("id, judul, status, ringkasan, foto_url, petugas, tampil_publik, tanggal_update")
          .eq("tampil_publik", true)
          .order("tanggal_update", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(6);

        if (!error && active && data) {
          setItems(data);
        }
      } catch (err) {
        console.error("Gagal memuat Baitul Mu'minin News:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNews();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="baitul-muminin-news" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-8 rounded-full bg-emerald-600" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Kabar Kegiatan &amp; Perawatan Masjid
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b1c30]">
              Baitul Mu&apos;minin News
            </h2>
          </div>
        </div>
        <span className="self-start sm:self-auto text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          Update Lapangan Takmir
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-40 rounded-3xl bg-white border border-slate-200/80 animate-pulse p-5"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 text-center text-xs text-slate-500">
          Belum ada kabar kegiatan terbaru yang dipublikasikan takmir.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const validPhotos = parsePhotoUrls(item.foto_url).filter(
              (url, idx) => !brokenImages[`${item.id}-${idx}`]
            );

            return (
              <article
                key={item.id}
                className="rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {validPhotos.length === 1 && (
                    <button
                      type="button"
                      onClick={() => setLightbox({ url: validPhotos[0], judul: item.judul })}
                      className="w-full h-44 bg-slate-100 overflow-hidden border-b border-slate-100 block text-left"
                    >
                      <img
                        src={validPhotos[0]}
                        alt={item.judul}
                        className="w-full h-full object-cover hover:scale-[1.02] transition"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [`${item.id}-0`]: true }))
                        }
                      />
                    </button>
                  )}

                  {validPhotos.length > 1 && (
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 border-b border-slate-100 p-1">
                      {validPhotos.slice(0, 4).map((url, idx) => {
                        const isFourthWithMore = idx === 3 && validPhotos.length > 4;

                        return (
                          <button
                            key={`${item.id}-foto-${idx}`}
                            type="button"
                            onClick={() => setLightbox({ url, judul: item.judul })}
                            className="relative h-28 bg-white rounded-xl overflow-hidden block text-left"
                          >
                            <img
                              src={url}
                              alt={`${item.judul} - foto ${idx + 1}`}
                              className="w-full h-full object-cover hover:scale-[1.03] transition"
                              onError={() =>
                                setBrokenImages((prev) => ({
                                  ...prev,
                                  [`${item.id}-${idx}`]: true,
                                }))
                              }
                            />
                            {isFourthWithMore && (
                              <span className="absolute inset-0 bg-slate-900/60 text-white text-xs font-extrabold flex items-center justify-center">
                                +{validPhotos.length - 3} Foto
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadgeStyle(
                          item.status
                        )}`}
                      >
                        {item.status || "Sedang Berjalan"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.tanggal_update}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {item.judul}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {item.ringkasan}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Petugas: <strong className="text-slate-700">{item.petugas || "Takmir"}</strong>
                  </span>
                  <span className="text-emerald-700 font-semibold">Baitul Mu&apos;minin News</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-900 truncate">{lightbox.judul}</h3>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                ✕ Tutup
              </button>
            </div>
            <div className="rounded-2xl bg-slate-100 overflow-hidden max-h-[70vh] flex items-center justify-center">
              <img
                src={lightbox.url}
                alt={lightbox.judul}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

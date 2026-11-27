"use client";

import { useEffect, useState, FormEvent } from "react";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function AdminKegiatanPage() {
  const [list, setList] = useState<BeritaItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "ok" | "err"; teks: string } | null>(null);

  async function fetchAll() {
    setLoading(true);
    const { data, error } = await supabase
      .from("berita_kegiatan")
      .select("id, judul, status, ringkasan, foto_url, petugas, tampil_publik, tanggal_update")
      .order("tanggal_update", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setPesan({ tipe: "err", teks: "Gagal memuat daftar kegiatan: " + error.message });
    } else {
      setList(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function mulaiEdit(item: BeritaItem) {
    setPesan(null);
    setForm({
      id: item.id,
      judul: item.judul,
      status: item.status || "Sedang Berjalan",
      tanggal_update: item.tanggal_update || new Date().toISOString().slice(0, 10),
      petugas: item.petugas || "",
      foto_url: item.foto_url || "",
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
    if (!form.judul.trim() || !form.ringkasan.trim()) {
      setPesan({ tipe: "err", teks: "Judul dan ringkasan kegiatan wajib diisi." });
      return;
    }

    setSaving(true);
    setPesan(null);

    const payload = {
      judul: form.judul.trim(),
      status: form.status,
      tanggal_update: form.tanggal_update,
      petugas: form.petugas.trim() || "Takmir Masjid",
      foto_url: form.foto_url.trim() || null,
      ringkasan: form.ringkasan.trim(),
      tampil_publik: form.tampil_publik,
      updated_at: new Date().toISOString(),
    };

    try {
      if (form.id) {
        const { error } = await supabase
          .from("berita_kegiatan")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
        setPesan({ tipe: "ok", teks: "Kabar kegiatan berhasil diperbarui." });
      } else {
        const { error } = await supabase.from("berita_kegiatan").insert([payload]);
        if (error) throw error;
        setPesan({ tipe: "ok", teks: "Kabar kegiatan baru berhasil disimpan." });
      }

      resetForm();
      await fetchAll();
    } catch (err: any) {
      setPesan({ tipe: "err", teks: "Gagal menyimpan: " + (err?.message || "Terjadi kesalahan") });
    } finally {
      setSaving(false);
    }
  }

  async function togglePublik(item: BeritaItem) {
    const { error } = await supabase
      .from("berita_kegiatan")
      .update({ tampil_publik: !item.tampil_publik, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (!error) {
      setList((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, tampil_publik: !row.tampil_publik } : row
        )
      );
    }
  }

  async function handleHapus(id: string, judul: string) {
    const yakin = window.confirm(`Hapus kabar kegiatan "${judul}"?`);
    if (!yakin) return;

    const { error } = await supabase.from("berita_kegiatan").delete().eq("id", id);
    if (error) {
      setPesan({ tipe: "err", teks: "Gagal menghapus: " + error.message });
    } else {
      setPesan({ tipe: "ok", teks: "Kabar kegiatan dihapus." });
      if (form.id === id) resetForm();
      setList((prev) => prev.filter((row) => row.id !== id));
    }
  }

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
                Link Foto Dokumentasi (Opsional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={form.foto_url}
                onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

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
              {list.map((item) => (
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
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

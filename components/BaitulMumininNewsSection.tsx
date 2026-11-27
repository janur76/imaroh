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

function buildPhotoCandidates(rawUrl: string): string[] {
  const trimmed = rawUrl.trim();
  if (!trimmed) return [];

  const fileId = extractDriveFileId(trimmed);
  if (!fileId) {
    return [trimmed];
  }

  const primary = `https://lh3.googleusercontent.com/d/${fileId}`;
  const thumb = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  const ucView = `https://drive.google.com/uc?export=view&id=${fileId}`;

  return Array.from(new Set([primary, thumb, ucView, trimmed]));
}

function parsePhotoGroups(fotoUrl: string | null): string[][] {
  if (!fotoUrl) return [];
  return fotoUrl
    .split(/[\n,]+/)
    .map((entry) => buildPhotoCandidates(entry))
    .filter((candidates) => candidates.length > 0);
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
  const [candidateIndexMap, setCandidateIndexMap] = useState<Record<string, number>>({});
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
            const groups = parsePhotoGroups(item.foto_url);
            const activePhotos = groups
              .map((candidates, idx) => {
                const key = `${item.id}-${idx}`;
                const currentIdx = candidateIndexMap[key] ?? 0;
                if (currentIdx >= candidates.length) return null;
                return { key, url: candidates[currentIdx], totalCandidates: candidates.length };
              })
              .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

            const handleImageError = (key: string, totalCandidates: number) => {
              setCandidateIndexMap((prev) => {
                const nextIdx = (prev[key] ?? 0) + 1;
                if (nextIdx > totalCandidates) return prev;
                return { ...prev, [key]: nextIdx };
              });
            };

            return (
              <article
                key={item.id}
                className="rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {activePhotos.length === 1 && (
                    <button
                      type="button"
                      onClick={() => setLightbox({ url: activePhotos[0].url, judul: item.judul })}
                      className="w-full h-44 bg-slate-100 overflow-hidden border-b border-slate-100 block text-left"
                    >
                      <img
                        src={activePhotos[0].url}
                        alt={item.judul}
                        className="w-full h-full object-cover hover:scale-[1.02] transition"
                        onError={() =>
                          handleImageError(activePhotos[0].key, activePhotos[0].totalCandidates)
                        }
                      />
                    </button>
                  )}

                  {activePhotos.length > 1 && (
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 border-b border-slate-100 p-1">
                      {activePhotos.slice(0, 4).map((photo, idx) => {
                        const isFourthWithMore = idx === 3 && activePhotos.length > 4;

                        return (
                          <button
                            key={photo.key}
                            type="button"
                            onClick={() => setLightbox({ url: photo.url, judul: item.judul })}
                            className="relative h-28 bg-white rounded-xl overflow-hidden block text-left"
                          >
                            <img
                              src={photo.url}
                              alt={`${item.judul} - foto ${idx + 1}`}
                              className="w-full h-full object-cover hover:scale-[1.03] transition"
                              onError={() =>
                                handleImageError(photo.key, photo.totalCandidates)
                              }
                            />
                            {isFourthWithMore && (
                              <span className="absolute inset-0 bg-slate-900/60 text-white text-xs font-extrabold flex items-center justify-center">
                                +{activePhotos.length - 3} Foto
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

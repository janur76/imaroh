"use client";

import { useState } from "react";
import Link from "next/link";

export interface SyiarItem {
  id: string;
  badge: string;
  judul: string;
  ringkasan: string;
  posterUrl: string;
  href: string;
  galeriFoto?: string[];
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

function normalizeGaleriList(galeriFoto?: string[]): string[][] {
  if (!galeriFoto || galeriFoto.length === 0) return [];
  return galeriFoto
    .flatMap((entry) => String(entry || "").split(/[\n,]+/))
    .map((url) => buildPhotoCandidates(url))
    .filter((candidates) => candidates.length > 0);
}

const DEFAULT_SYIAR_ITEMS: SyiarItem[] = [
  {
    id: "kajian-rutin",
    badge: "Kajian Rutin",
    judul: "Kajian Rutin Kitab Nashoihud Diniyah",
    ringkasan:
      "Setiap hari Sabtu ba'da Subuh (04.30 – Syuruq) bersama Ust. Habib Al Amin, S.Th.I.M.Sy di Masjid Baitul Mu'minin.",
    posterUrl: "/kajian-rutin.jpg",
    href: "/syiar/kajian-rutin",
    galeriFoto: [],
  },
  {
    id: "tabungan-qurban",
    badge: "Syiar Qurban",
    judul: "Ayoo Menabung Qurban Baitul Mu'minin",
    ringkasan:
      "Program tabungan & angsuran Qurban Paket Sapi dan Kambing untuk persiapan ibadah Qurban lebih awal dan terencana.",
    posterUrl: "/tabungan-qurban.jpg",
    href: "/syiar/tabungan-qurban",
  },
];

interface SyiarMasjidSectionProps {
  items?: SyiarItem[];
  namaMasjid?: string;
}

export default function SyiarMasjidSection({
  items = DEFAULT_SYIAR_ITEMS,
  namaMasjid = "Masjid Baitul Mu'minin",
}: SyiarMasjidSectionProps) {
  const [selectedItem, setSelectedItem] = useState<SyiarItem | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; judul: string } | null>(null);
  const [candidateIndexMap, setCandidateIndexMap] = useState<Record<string, number>>({});

  if (!items || items.length === 0) return null;

  const handleImageError = (key: string, totalCandidates: number) => {
    setCandidateIndexMap((prev) => {
      const nextIdx = (prev[key] ?? 0) + 1;
      if (nextIdx > totalCandidates) return prev;
      return { ...prev, [key]: nextIdx };
    });
  };

  const activeGaleriGroups = normalizeGaleriList(selectedItem?.galeriFoto);
  const activeGaleriPhotos = activeGaleriGroups
    .map((candidates, idx) => {
      const key = `${selectedItem?.id || "galeri"}-${idx}`;
      const currentIdx = candidateIndexMap[key] ?? 0;
      if (currentIdx >= candidates.length) return null;
      return {
        key,
        url: candidates[currentIdx],
        totalCandidates: candidates.length,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <section
      aria-labelledby="syiar-masjid-heading"
      className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full">
            Syiar &amp; Informasi Masjid
          </span>
          <h2
            id="syiar-masjid-heading"
            className="text-xl md:text-2xl font-extrabold text-[#0b1c30] mt-2"
          >
            Papan Informasi &amp; Program {namaMasjid}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Informasi kegiatan kajian, program syiar, dan pengumuman resmi untuk jamaah.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => {
          const fotoCount = normalizeGaleriList(item.galeriFoto).length;

          return (
            <article
              key={item.id}
              className="group rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
            >
              <button
                type="button"
                onClick={() => setSelectedItem(item)}
                className="block relative aspect-[3/4] w-full bg-slate-100 overflow-hidden border-b border-slate-200/80 text-left"
              >
                <img
                  src={item.posterUrl}
                  alt={item.judul}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top group-hover:scale-[1.015] transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0b1c30]/85 text-white backdrop-blur-xs">
                  {item.badge}
                </span>
                {fotoCount > 0 && (
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600/95 text-white shadow-xs">
                    📷 {fotoCount} Foto Kegiatan
                  </span>
                )}
              </button>

              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-base md:text-lg font-bold text-[#0b1c30] leading-snug">
                    {item.judul}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    {item.ringkasan}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs"
                  >
                    <span>Lihat Detail &amp; Foto</span>
                    <span aria-hidden="true">→</span>
                  </button>

                  {item.href && (
                    <Link
                      href={item.href}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      Halaman Info
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal Detail & Dokumentasi Foto Kegiatan Kajian */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {selectedItem.badge}
                </span>
                <h3 className="text-lg font-extrabold text-[#0b1c30] mt-1.5">
                  {selectedItem.judul}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 shrink-0"
              >
                ✕ Tutup
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {selectedItem.ringkasan}
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Dokumentasi Kegiatan ({activeGaleriPhotos.length} Foto)
                </h4>
                {activeGaleriPhotos.length > 0 && (
                  <span className="text-[11px] text-slate-400">
                    Klik foto untuk memperbesar
                  </span>
                )}
              </div>

              {activeGaleriPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activeGaleriPhotos.map((photo, idx) => (
                    <button
                      key={photo.key}
                      type="button"
                      onClick={() =>
                        setZoomedPhoto({
                          url: photo.url,
                          judul: `${selectedItem.judul} - Foto ${idx + 1}`,
                        })
                      }
                      className="h-32 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden block text-left group/img"
                    >
                      <img
                        src={photo.url}
                        alt={`${selectedItem.judul} - dokumentasi ${idx + 1}`}
                        className="w-full h-full object-cover group-hover/img:scale-[1.03] transition"
                        onError={() => handleImageError(photo.key, photo.totalCandidates)}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 text-center text-xs text-slate-500">
                  Belum ada foto dokumentasi kegiatan yang dilampirkan untuk agenda ini.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              {selectedItem.href ? (
                <Link
                  href={selectedItem.href}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Buka halaman informasi lengkap →
                </Link>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Foto Dokumentasi */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomedPhoto(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-extrabold text-slate-900 truncate">
                {zoomedPhoto.judul}
              </h4>
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                ✕ Tutup
              </button>
            </div>
            <div className="rounded-2xl bg-slate-100 overflow-hidden max-h-[70vh] flex items-center justify-center">
              <img
                src={zoomedPhoto.url}
                alt={zoomedPhoto.judul}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

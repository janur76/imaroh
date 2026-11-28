"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchImarohData } from "@/lib/api";
import SyiarMasjidSection, { SyiarItem } from "@/components/SyiarMasjidSection";
import PhbiSection from "@/components/home/PhbiSection";
import BaitulMumininNewsSection from "@/components/BaitulMumininNewsSection";

type FilterMutasi = "semua" | "masuk" | "keluar" | "qris" | "phbi";

interface KajianRecord {
  id_kajian?: string;
  tanggal?: string;
  waktu?: string;
  tema?: string;
  pemateri?: string;
  tempat?: string;
  foto_url?: string;
  [key: string]: any;
}

function resolveHeaderDanAlamat(rawNama?: string, rawAlamat?: string) {
  const cleanNama = String(rawNama || "Masjid Baitul Mu'minin").trim();
  const cleanAlamat = String(rawAlamat || "").trim();

  const marker = "Citra Mandiri Regency";
  const idx = cleanNama.toLowerCase().indexOf(marker.toLowerCase());
  if (idx > 0 && !cleanAlamat) {
    const namaSaja = cleanNama.slice(0, idx).trim();
    const lokasiSaja = cleanNama.slice(idx).trim();
    if (namaSaja && lokasiSaja) {
      return {
        nama: namaSaja,
        lokasi: lokasiSaja,
        alamatLengkap: lokasiSaja,
      };
    }
  }

  if (cleanAlamat) {
    const firstSegment = cleanAlamat.split(",")[0]?.trim() || "";
    return {
      nama: cleanNama,
      lokasi: firstSegment,
      alamatLengkap: cleanAlamat,
    };
  }

  return {
    nama: cleanNama,
    lokasi: "",
    alamatLengkap: "Perum Citra Mandiri Regency, Sidoarjo",
  };
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

function splitRawFotoUrls(item?: KajianRecord): string[] {
  if (!item) return [];
  const raw = String(item?.foto_url || item?.foto || item?.dokumentasi_url || "").trim();
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseKajianFotoList(kajianList: KajianRecord[]): string[] {
  if (!Array.isArray(kajianList) || kajianList.length === 0) return [];
  const collected: string[] = [];

  kajianList.forEach((item) => {
    splitRawFotoUrls(item).forEach((url) => {
      if (!collected.includes(url)) collected.push(url);
    });
  });

  return collected;
}

export default function PublicPortal() {
  const router = useRouter();
  const [profil, setProfil] = useState<any>({});
  const [kasList, setKasList] = useState<any[]>([]);
  const [inventarisList, setInventarisList] = useState<any[]>([]);
  const [kajianList, setKajianList] = useState<KajianRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMutasi, setFilterMutasi] = useState<FilterMutasi>("semua");

  // Modal Detail Agenda Kajian & Lightbox Foto
  const [selectedKajian, setSelectedKajian] = useState<KajianRecord | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; judul: string } | null>(null);
  const [photoFallbackIdx, setPhotoFallbackIdx] = useState<Record<string, number>>({});

  const loadPublicData = async () => {
    try {
      const data = await fetchImarohData("all");
      if (data) {
        if (data.profil && data.profil.length > 0) {
          setProfil(data.profil[0]);
        }
        if (data.kas) {
          // Tampilkan data terbaru lebih dulu tanpa mengubah ID dari database.
          setKasList([...data.kas].reverse());
        }
        if (data.inventaris) {
          setInventarisList(data.inventaris);
        }
        if (data.kajian) {
          setKajianList(data.kajian);
        }
      }
    } catch (error) {
      console.error("Gagal memuat data portal:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicData();
  }, []);

  let totalMasuk = 0;
  let totalKeluar = 0;
  kasList.forEach((item) => {
    const nom = Number(item.nominal || 0);
    const jns = String(item.jenis || "").toLowerCase();
    if (jns.includes("masuk")) totalMasuk += nom;
    if (jns.includes("keluar")) totalKeluar += nom;
  });
  const saldoBersih = totalMasuk - totalKeluar;

  const filteredKasList = kasList.filter((item) => {
    const jns = String(item.jenis || "").toLowerCase();
    const ket = String(item.keterangan || "").toLowerCase();

    if (filterMutasi === "masuk") return jns.includes("masuk");
    if (filterMutasi === "keluar") return jns.includes("keluar");
    if (filterMutasi === "qris") return ket.includes("[qris]") || ket.includes("qris");
    if (filterMutasi === "phbi") return ket.includes("[phbi") || ket.includes("phbi");
    return true;
  });

  const {
    nama: namaMasjidHeader,
    lokasi: lokasiMasjidHeader,
    alamatLengkap: alamatMasjidLengkap,
  } = resolveHeaderDanAlamat(profil.nama_masjid, profil.alamat);

  const syiarItemsWithPhotos = useMemo<SyiarItem[]>(() => {
    const fotoKajian = parseKajianFotoList(kajianList);
    return [
      {
        id: "kajian-rutin",
        badge: "Kajian Rutin",
        judul: "Kajian Rutin Kitab Nashoihud Diniyah",
        ringkasan:
          "Setiap hari Sabtu ba'da Subuh (04.30 – Syuruq) bersama Ust. Habib Al Amin, S.Th.I.M.Sy di Masjid Baitul Mu'minin.",
        posterUrl: "/kajian-rutin.jpg",
        href: "/syiar/kajian-rutin",
        galeriFoto: fotoKajian,
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
  }, [kajianList]);

  const handleKajianPhotoError = (key: string, totalCandidates: number) => {
    setPhotoFallbackIdx((prev) => {
      const next = (prev[key] ?? 0) + 1;
      if (next > totalCandidates) return prev;
      return { ...prev, [key]: next };
    });
  };

  const selectedKajianPhotos = useMemo(() => {
    if (!selectedKajian) return [];
    const rawUrls = splitRawFotoUrls(selectedKajian);
    const baseKey = selectedKajian.id_kajian || selectedKajian.tema || "kajian";

    return rawUrls
      .map((rawUrl, idx) => {
        const candidates = buildPhotoCandidates(rawUrl);
        const key = `${baseKey}-${idx}`;
        const currentIdx = photoFallbackIdx[key] ?? 0;
        if (currentIdx >= candidates.length) return null;
        return {
          key,
          url: candidates[currentIdx],
          totalCandidates: candidates.length,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [selectedKajian, photoFallbackIdx]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0fdf4] via-[#f8f9ff] to-[#f0fdf4] text-[#0b1c30]">
      {/* Top Navbar Publik */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-4 md:px-8 py-3 md:py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            {profil.logo_url ? (
              <img
                src={profil.logo_url}
                alt="Logo Masjid"
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain shrink-0"
              />
            ) : (
              <span className="text-2xl sm:text-3xl leading-none shrink-0">🕌</span>
            )}
            <div className="min-w-0">
              <span className="inline-block text-[9px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-[#047857] uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 truncate max-w-full">
                Portal Resmi Masjid Digital
              </span>
              <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-[#0b1c30] mt-0.5 leading-tight truncate">
                {namaMasjidHeader}
              </h1>
              {lokasiMasjidHeader && (
                <p className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight mt-0.5 truncate">
                  {lokasiMasjidHeader}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin/login")}
            className="px-3 py-2 sm:px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#047857] border border-emerald-200 text-[11px] sm:text-xs font-bold transition duration-200 shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>🔐</span>
            <span className="sm:hidden">Login Admin</span>
            <span className="hidden sm:inline">Login Takmir / Admin</span>
          </button>
        </div>
      </header>

      {/* Running Text Berjalan Rapat & Mulus */}
      {profil.running_text && (
        <div className="bg-[#064e3b] text-emerald-50 text-xs py-2.5 px-4 overflow-hidden relative shadow-inner">
          <style jsx>{`
            @keyframes ticker {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .ticker-wrap {
              display: flex;
              width: max-content;
              animation: ticker 25s linear infinite;
            }
            .ticker-wrap:hover {
              animation-play-state: paused;
            }
          `}</style>

          <div className="ticker-wrap font-medium">
            {/* Blok Teks Pertama */}
            <div className="flex items-center shrink-0">
              <span>📢 {profil.running_text}</span>
              <span className="mx-8">&bull;</span>
              <span>📍 {alamatMasjidLengkap}</span>
              <span className="mx-8">&bull;</span>
              <span>🕌 Selamat Datang di Portal Resmi Masjid Digital Baitul Mu&apos;minin</span>
              <span className="mx-8">&bull;</span>
            </div>
            {/* Blok Teks Kedua (Duplikat persis untuk sambungan mulus) */}
            <div className="flex items-center shrink-0" aria-hidden="true">
              <span>📢 {profil.running_text}</span>
              <span className="mx-8">&bull;</span>
              <span>📍 {alamatMasjidLengkap}</span>
              <span className="mx-8">&bull;</span>
              <span>🕌 Selamat Datang di Portal Resmi Masjid Digital Baitul Mu&apos;minin</span>
              <span className="mx-8">&bull;</span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section & Ringkasan Saldo */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div className="bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#022c22] text-white p-8 md:p-10 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-3">
              <span className="text-xs uppercase tracking-widest font-semibold text-emerald-200 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                Transparansi Keuangan Umat
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Akuntabilitas &amp; Keterbukaan Kas Masjid
              </h2>
              <p className="text-sm text-emerald-100/90 max-w-xl">
                Seluruh catatan infak, donasi jamaah, dan alokasi belanja operasional dikelola secara
                transparan dan dapat dipantau langsung oleh masyarakat secara real-time.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center shadow-lg">
              <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">
                Saldo Kas Bersih Saat Ini
              </span>
              <h3 className="text-3xl md:text-4xl font-black mt-2 text-white">
                {loading ? "Memuat..." : `Rp ${saldoBersih.toLocaleString("id-ID")}`}
              </h3>
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between gap-2 text-xs">
                <span className="text-[#7dd3fc] font-semibold">
                  Masuk: Rp {totalMasuk.toLocaleString("id-ID")}
                </span>
                <span className="text-[#ff7a45] font-semibold">
                  Keluar: Rp {totalKeluar.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Mutasi Kas Publik & Sidebar */}
        <div id="mutasi" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-lg text-[#0b1c30]">Mutasi Kas Terbaru</h3>
                <p className="text-xs text-slate-500">
                  Daftar transaksi kas masuk dan keluar masjid.
                </p>
              </div>
              <span className="self-start sm:self-auto text-xs font-semibold text-[#047857] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                {filteredKasList.length} Transaksi Ditampilkan
              </span>
            </div>

            {/* Filter Cepat Mutasi */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "semua", label: "Semua" },
                  { id: "masuk", label: "Kas Masuk" },
                  { id: "keluar", label: "Kas Keluar" },
                  { id: "qris", label: "[QRIS]" },
                  { id: "phbi", label: "[PHBI]" },
                ] as { id: FilterMutasi; label: string }[]
              ).map((tab) => {
                const active = filterMutasi === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterMutasi(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      active
                        ? "bg-[#047857] text-white border-[#047857] shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 whitespace-nowrap">ID Transaksi</th>
                    <th className="p-3 whitespace-nowrap">Tanggal</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3 whitespace-nowrap">Jenis</th>
                    <th className="p-3 text-right whitespace-nowrap">Nominal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Memuat data mutasi kas...
                      </td>
                    </tr>
                  ) : filteredKasList.length > 0 ? (
                    filteredKasList.slice(0, 20).map((item, idx) => (
                      <tr key={item.id_transaksi || item.id || idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 whitespace-nowrap font-mono font-semibold text-emerald-700">
                          {item.id_transaksi || item.id || "-"}
                        </td>
                        <td className="p-3 whitespace-nowrap font-medium text-slate-700">
                          {item.tanggal ? String(item.tanggal).split("T")[0] : "-"}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {item.keterangan || "-"}
                        </td>
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
                        <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          Rp {Number(item.nominal || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Belum ada data kas yang sesuai dengan filter ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar Samping (QRIS & Kajian) */}
          <div className="space-y-6">
            <div id="qris" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center space-y-3">
              <h3 className="font-extrabold text-sm text-[#0b1c30]">💳 QRIS Donasi / Infak</h3>

              {/* Blok Identitas Merchant QRIS */}
              <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 px-3.5 py-3 text-center space-y-1">
                <p className="font-serif text-sm sm:text-base font-bold tracking-wide text-slate-900 uppercase">
                  MASJID BAITUL MUMININ
                </p>
                <div className="space-y-0.5 text-[11px] font-medium text-slate-600 tabular-nums">
                  <p>NMID : ID1025406969317</p>
                  <p>TID</p>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-500">
                Scan QRIS di bawah ini untuk menyalurkan infak atau donasi ke masjid secara nontunai.
              </p>

              <div className="w-48 h-48 mx-auto bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center p-2 overflow-hidden shadow-inner">
                {profil.qris_url ? (
                  <img
                    src={profil.qris_url}
                    alt="QRIS Donasi Masjid Baitul Muminin"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-slate-400 p-4">
                    QRIS belum diatur oleh admin di menu Profil.
                  </div>
                )}
              </div>

              {/* Catatan Singkat Transparansi Rekap QRIS */}
              <p className="text-[11px] leading-relaxed text-slate-500 bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 text-left">
                Pencatatan infak QRIS dilakukan berkala sesuai mutasi/rekap yang terverifikasi takmir
                dengan label <span className="font-mono font-semibold text-emerald-800">[QRIS]</span>,
                tanggal/periode rekap, dan nominal di tabel mutasi kas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-extrabold text-base text-[#0b1c30] flex items-center gap-2">
                  <span>📅</span> Agenda &amp; Jadwal Kajian
                </h3>
                {kajianList.length > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {kajianList.length} Agenda
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {loading ? (
                  <p className="text-xs text-slate-400 text-center py-4">Memuat jadwal kajian...</p>
                ) : kajianList.length > 0 ? (
                  kajianList.slice(0, 4).map((kajian, idx) => {
                    const fotoCount = splitRawFotoUrls(kajian).length;
                    const tglStr = kajian.tanggal ? String(kajian.tanggal).split("T")[0] : "Segera";

                    return (
                      <div
                        key={kajian.id_kajian || idx}
                        className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="text-[10px] font-bold text-[#047857] uppercase bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                            {tglStr} • {kajian.waktu || "Ba'da Isya"}
                          </span>
                          {fotoCount > 0 && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                              {fotoCount} Foto
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 leading-snug">
                          {kajian.tema || "Kajian Rutin"}
                        </h4>

                        <p className="text-[11px] text-slate-600">
                          Pemateri:{" "}
                          <span className="font-semibold">{kajian.pemateri || "Ustadz"}</span>
                        </p>

                        {kajian.tempat && (
                          <p className="text-[11px] text-slate-500">
                            Tempat: {kajian.tempat}
                          </p>
                        )}

                        <div className="pt-1 flex items-center justify-between border-t border-emerald-100/80">
                          <span className="text-[10px] font-mono text-slate-400">
                            {kajian.id_kajian || ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedKajian(kajian)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#047857] hover:bg-emerald-700 text-white text-[11px] font-semibold transition"
                          >
                            <span>Lihat Detail</span>
                            <span aria-hidden="true">→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada jadwal kajian.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Baitul Mu'minin News */}
        <BaitulMumininNewsSection />

        {/* Section PHBI Terdekat (Isra Mi'raj 1448 H) */}
        <PhbiSection />

        {/* Section Syiar & Informasi Masjid */}
        <SyiarMasjidSection
          items={syiarItemsWithPhotos}
          namaMasjid={profil.nama_masjid || "Masjid Baitul Mu'minin"}
        />
      </div>

      {/* Modal Detail Agenda & Dokumentasi Foto Kajian */}
      {selectedKajian && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedKajian(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {selectedKajian.tanggal
                      ? String(selectedKajian.tanggal).split("T")[0]
                      : "Agenda Kajian"}
                  </span>
                  {selectedKajian.waktu && (
                    <span className="inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {selectedKajian.waktu}
                    </span>
                  )}
                  {selectedKajian.id_kajian && (
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {selectedKajian.id_kajian}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-[#0b1c30] mt-2">
                  {selectedKajian.tema || "Kajian Rutin"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKajian(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 shrink-0"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Pemateri / Ustadz
                </span>
                <span className="font-bold text-slate-800">
                  {selectedKajian.pemateri || "Ustadz"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Tempat Pelaksanaan
                </span>
                <span className="font-semibold text-slate-800">
                  {selectedKajian.tempat || "Masjid Baitul Mu'minin"}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Dokumentasi Kegiatan ({selectedKajianPhotos.length} Foto)
                </h4>
                {selectedKajianPhotos.length > 0 && (
                  <span className="text-[11px] text-slate-400">
                    Klik foto untuk memperbesar
                  </span>
                )}
              </div>

              {selectedKajianPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedKajianPhotos.map((photo, idx) => (
                    <button
                      key={photo.key}
                      type="button"
                      onClick={() =>
                        setZoomedPhoto({
                          url: photo.url,
                          judul: `${selectedKajian.tema || "Dokumentasi Kajian"} - Foto ${idx + 1}`,
                        })
                      }
                      className="h-32 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden block text-left group/img"
                    >
                      <img
                        src={photo.url}
                        alt={`${selectedKajian.tema || "Kajian"} - dokumentasi ${idx + 1}`}
                        className="w-full h-full object-cover group-hover/img:scale-[1.03] transition"
                        onError={() => handleKajianPhotoError(photo.key, photo.totalCandidates)}
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

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedKajian(null)}
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

      {/* Footer Publik */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>
          © 2026 {profil.nama_masjid || "Masjid Baitul Mu'minin"} • Powered by Imaroh SaaS (Kalibu ID)
        </p>
      </footer>
    </main>
  );
}

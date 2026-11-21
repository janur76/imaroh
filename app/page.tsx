"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchImarohData } from "@/lib/api";

interface KasItem {
  id_transaksi?: string;
  tanggal?: string;
  keterangan?: string;
  jenis?: string;
  nominal?: number | string;
}

interface KajianItem {
  id_kajian?: string;
  tanggal?: string;
  waktu?: string;
  tema?: string;
  pemateri?: string;
  tempat?: string;
}

interface InventarisItem {
  id_barang?: string;
  nama_barang?: string;
  jumlah?: number | string;
  kondisi?: string;
  lokasi?: string;
}

interface ProfilMasjid {
  nama_masjid?: string;
  alamat?: string;
  telepon?: string;
  running_text?: string;
  qris_url?: string;
  logo_url?: string;
}

function safeText(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s || fallback;
}

function isValidImage(src: unknown): boolean {
  const s = safeText(src);
  if (!s) return false;
  return (
    s.startsWith("https://") ||
    s.startsWith("http://") ||
    s.startsWith("/") ||
    s.startsWith("data:image/")
  );
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [kasList, setKasList] = useState<KasItem[]>([]);
  const [kajianList, setKajianList] = useState<KajianItem[]>([]);
  const [inventarisList, setInventarisList] = useState<InventarisItem[]>([]);
  const [profil, setProfil] = useState<ProfilMasjid>({
    nama_masjid: "Masjid Baitul Mu'minin",
    alamat: "Perumahan Citra Mandiri Regency, Urangagung, Kec. Sidoarjo, Kab. Sidoarjo",
    telepon: "",
    running_text: "Selamat Datang di Portal Resmi Masjid Digital Baitul Mu'minin.",
    logo_url: "/logo_mbm.png",
    qris_url: "/qris_mbm.jpeg",
  });

  useEffect(() => {
    let active = true;
    const loadAll = async () => {
      try {
        setLoading(true);
        const res = await fetchImarohData("all");
        if (!active || !res) return;

        if (Array.isArray(res.kas)) {
          setKasList([...res.kas].reverse());
        }
        if (Array.isArray(res.kajian)) {
          setKajianList(res.kajian);
        }
        if (Array.isArray(res.inventaris)) {
          setInventarisList(res.inventaris);
        }

        const rawProfil = Array.isArray(res.profil) ? res.profil[0] : res.profil;
        if (rawProfil && typeof rawProfil === "object") {
          setProfil((prev) => ({
            nama_masjid: safeText(rawProfil.nama_masjid, prev.nama_masjid),
            alamat: safeText(rawProfil.alamat, prev.alamat),
            telepon: safeText(rawProfil.telepon, prev.telepon),
            running_text: safeText(rawProfil.running_text, prev.running_text),
            logo_url: isValidImage(rawProfil.logo_url)
              ? safeText(rawProfil.logo_url)
              : prev.logo_url,
            qris_url: isValidImage(rawProfil.qris_url)
              ? safeText(rawProfil.qris_url)
              : prev.qris_url,
          }));
        }
      } catch (err) {
        console.error("Gagal memuat data beranda:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAll();
    return () => {
      active = false;
    };
  }, []);

  let totalMasuk = 0;
  let totalKeluar = 0;
  kasList.forEach((item) => {
    const val = Number(item.nominal || 0);
    const jenisStr = String(item.jenis || "").toLowerCase();
    if (jenisStr.includes("masuk")) totalMasuk += val;
    else if (jenisStr.includes("keluar")) totalKeluar += val;
  });
  const saldoAkhir = totalMasuk - totalKeluar;

  const logoSrc = isValidImage(profil.logo_url) ? safeText(profil.logo_url) : "/logo_mbm.png";
  const qrisSrc = isValidImage(profil.qris_url) ? safeText(profil.qris_url) : "/qris_mbm.jpeg";

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col">
      {/* HEADER PUBLIK RESPONSIF & ESTETIK */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo + Identitas Masjid */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
              <img
                src={logoSrc}
                alt={safeText(profil.nama_masjid, "Logo Masjid")}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#047857] truncate">
                Portal Resmi Masjid Digital
              </p>
              <h1 className="text-sm sm:text-lg font-extrabold text-[#0b1c30] leading-snug line-clamp-2">
                {safeText(profil.nama_masjid, "Masjid Baitul Mu'minin")}
              </h1>
            </div>
          </div>

          {/* Tombol Login Admin 1 Baris Rapi */}
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#065f46] border border-emerald-200/90 text-xs font-bold whitespace-nowrap shrink-0 transition shadow-2xs"
          >
            <span aria-hidden="true">🔐</span>
            <span className="sm:hidden">Login Admin</span>
            <span className="hidden sm:inline">Login Takmir / Admin</span>
          </Link>
        </div>

        {/* Running Text Bar */}
        <div className="bg-[#065f46] text-emerald-50 border-t border-emerald-800/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3 overflow-hidden">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-md shrink-0">
              Info DKM
            </span>
            <p className="text-xs font-medium truncate">
              {safeText(
                profil.running_text,
                "Selamat Datang di Portal Resmi Masjid Digital Baitul Mu'minin."
              )}
            </p>
          </div>
        </div>
      </header>

      {/* KONTEN UTAMA BERANDA */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#065f46] via-[#047857] to-[#064e3b] text-white p-6 sm:p-8 shadow-lg space-y-6">
          <div className="space-y-2.5">
            <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-white/15 text-emerald-100 px-3 py-1 rounded-full">
              Transparansi Keuangan Umat
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight">
              Akuntabilitas &amp; Keterbukaan Kas Masjid
            </h2>
            <p className="text-xs sm:text-sm text-emerald-50/90 max-w-2xl leading-relaxed">
              Seluruh catatan infak, donasi jamaah, dan alokasi belanja operasional dikelola secara
              transparan dan dapat dipantau langsung oleh masyarakat secara{" "}
              <em className="italic font-semibold">real-time</em>.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 p-5 sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
              Saldo Kas Bersih Saat Ini
            </p>
            <p className="text-3xl sm:text-4xl font-black mt-1.5 tracking-tight">
              {loading ? "Memuat..." : `Rp ${saldoAkhir.toLocaleString("id-ID")}`}
            </p>
            <div className="mt-3 pt-3 border-t border-white/15 flex flex-wrap gap-x-6 gap-y-1 text-xs sm:text-sm text-emerald-100 font-medium">
              <span>Masuk: Rp {totalMasuk.toLocaleString("id-ID")}</span>
              <span>Keluar: Rp {totalKeluar.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-extrabold text-[#0b1c30]">Mutasi Kas Terbaru</h3>
            <span className="text-xs font-semibold text-slate-500">{kasList.length} Transaksi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3">Jenis</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Memuat mutasi kas...
                    </td>
                  </tr>
                ) : kasList.length > 0 ? (
                  kasList.slice(0, 10).map((row, idx) => {
                    const isMasuk = String(row.jenis || "").toLowerCase().includes("masuk");
                    return (
                      <tr key={`${row.id_transaksi || "kas"}-${idx}`} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 whitespace-nowrap text-xs">
                          {row.tanggal ? String(row.tanggal).split("T")[0] : "-"}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {safeText(row.keterangan, "-")}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              isMasuk
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {safeText(row.jenis, "Masuk")}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                          Rp {Number(row.nominal || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Belum ada mutasi kas tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-[#0b1c30]">Jadwal Kajian Mendatang</h3>
            {kajianList.length > 0 ? (
              <ul className="divide-y divide-slate-100 text-xs sm:text-sm">
                {kajianList.slice(0, 5).map((k, idx) => (
                  <li key={`${k.id_kajian || "kajian"}-${idx}`} className="py-3 space-y-0.5">
                    <p className="font-bold text-slate-900">{safeText(k.tema, "-")}</p>
                    <p className="text-xs text-emerald-700 font-semibold">
                      {k.tanggal ? String(k.tanggal).split("T")[0] : "-"} •{" "}
                      {safeText(k.waktu, "Ba'da Maghrib")}
                    </p>
                    <p className="text-xs text-slate-500">
                      Pemateri: {safeText(k.pemateri, "-")} • {safeText(k.tempat, "Ruang Utama")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 py-4">Belum ada jadwal kajian terbaru.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-[#0b1c30]">Inventaris &amp; QRIS Donasi</h3>
            <p className="text-xs text-slate-500">
              Total aset tercatat: <strong className="text-slate-800">{inventarisList.length}</strong>{" "}
              jenis barang.
            </p>
            {qrisSrc && (
              <div className="pt-2 flex items-center gap-4">
                <img
                  src={qrisSrc}
                  alt="QRIS Donasi Masjid"
                  className="w-24 h-24 rounded-xl border border-slate-200 object-contain p-1 bg-white shrink-0"
                />
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">Scan QRIS Donasi / Infak</p>
                  <p className="text-slate-500 leading-relaxed">{safeText(profil.alamat)}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

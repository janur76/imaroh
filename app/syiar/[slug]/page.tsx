import { Suspense } from "react";
import Link from "next/link";

interface InfoUtamaItem {
  label: string;
  nilai: string;
}

interface PaketQurbanItem {
  kode: string;
  judul: string;
  nominal: string;
  keterangan: string;
}

interface KontakWaItem {
  nama: string;
  nomorTampil: string;
  waLink: string;
}

interface SyiarDetailData {
  slug: string;
  badge: string;
  judul: string;
  subjudul: string;
  posterUrl: string;
  dalil: {
    teks: string;
    sumber: string;
  };
  deskripsi: string;
  infoUtama: InfoUtamaItem[];
  paketList: PaketQurbanItem[];
  kontakWa: KontakWaItem[];
}

const SYIAR_DATABASE: Record<string, SyiarDetailData> = {
  "kajian-rutin": {
    slug: "kajian-rutin",
    badge: "Kajian Rutin",
    judul: "Kajian Rutin Kitab Nashoihud Diniyah",
    subjudul: "Masjid Baitul Mu'minin • Perumahan Citra Mandiri Regency",
    posterUrl: "/kajian-rutin.jpg",
    dalil: {
      teks: "“Siapa yang menempuh jalan untuk mencari ilmu, maka Allah akan mudahkan baginya jalan menuju surga.”",
      sumber: "HR. Muslim, no. 2699",
    },
    deskripsi:
      "Kajian rutin pekanan pembahasan Kitab Nashoihud Diniyah yang terbuka untuk seluruh jamaah Masjid Baitul Mu'minin dan warga sekitar Citra Mandiri Regency.",
    infoUtama: [
      { label: "Kitab Kajian", nilai: "Nashoihud Diniyah" },
      { label: "Pemateri", nilai: "Ust. Habib Al Amin, S.Th.I.M.Sy" },
      { label: "Hari / Waktu", nilai: "Setiap hari Sabtu, ba'da Subuh" },
      { label: "Pukul", nilai: "04.30 WIB – Syuruq" },
      { label: "Lokasi", nilai: "Masjid Baitul Mu'minin, Citra Mandiri Regency" },
    ],
    paketList: [],
    kontakWa: [
      {
        nama: "Takmir / Informasi Kajian",
        nomorTampil: "0856-4561-8290",
        waLink:
          "https://wa.me/6285645618290?text=Assalamu'alaikum%2C%20saya%20ingin%20bertanya%20informasi%20Kajian%20Rutin%20Kitab%20Nashoihud%20Diniyah%20di%20Masjid%20Baitul%20Mu'minin.",
      },
    ],
  },
  "tabungan-qurban": {
    slug: "tabungan-qurban",
    badge: "Syiar Qurban",
    judul: "Ayoo Menabung Qurban Baitul Mu'minin",
    subjudul: "Persiapkan Ibadah Qurban Anda Lebih Awal & Mudah",
    posterUrl: "/tabungan-qurban.jpg",
    dalil: {
      teks: "“Maka laksanakanlah shalat karena Tuhanmu, dan berkurbanlah.”",
      sumber: "Q.S. Al-Kautsar: 2",
    },
    deskripsi:
      "Program tabungan dan angsuran Qurban yang dikelola Takmir Masjid Baitul Mu'minin untuk memudahkan jamaah merencanakan ibadah Qurban secara ringan dan terstruktur. Seluruh paket sudah termasuk biaya operasional.",
    infoUtama: [
      { label: "Penyelenggara", nilai: "Takmir Masjid Baitul Mu'minin" },
      { label: "Biaya Operasional", nilai: "Sudah termasuk dalam seluruh paket" },
      { label: "Instagram Resmi", nilai: "@baitulmuminin" },
    ],
    paketList: [
      {
        kode: "PAKET A (SAPI)",
        judul: "Sapi Kolektif 7 Orang (Program 10 Bulan)",
        nominal: "Rp 350.000 / bulan",
        keterangan:
          "Angsuran per orang selama 10 bulan (1 Sapi untuk 7 orang). Biaya operasional sudah termasuk.",
      },
      {
        kode: "PAKET B (SAPI • 2 TAHUN)",
        judul: "Sapi Kelompok 14 Orang (Program 22 Bulan)",
        nominal: "Rp 150.000 / bulan",
        keterangan:
          "Angsuran per orang selama 22 bulan (1 Sapi untuk 7 orang per tahun pelaksanaan). Biaya operasional sudah termasuk.",
      },
      {
        kode: "PAKET C (KAMBING)",
        judul: "Domba / Kambing Mandiri (Program 10 Bulan)",
        nominal: "Rp 350.000 / bulan",
        keterangan:
          "Angsuran per orang selama 10 bulan (1 Domba/Kambing untuk 1 orang). Biaya operasional sudah termasuk.",
      },
    ],
    kontakWa: [
      {
        nama: "Panitia Qurban (Huda)",
        nomorTampil: "0856 4561 8290",
        waLink:
          "https://wa.me/6285645618290?text=Assalamu'alaikum%20Mas%20Huda%2C%20saya%20ingin%20mendaftar%20/%20tanya%20program%20Tabungan%20Qurban%20Masjid%20Baitul%20Mu'minin.",
      },
      {
        nama: "Panitia Qurban (Sarwanto)",
        nomorTampil: "0878 6694 4929",
        waLink:
          "https://wa.me/6287866944929?text=Assalamu'alaikum%20Mas%20Sarwanto%2C%20saya%20ingin%20mendaftar%20/%20tanya%20program%20Tabungan%20Qurban%20Masjid%20Baitul%20Mu'minin.",
      },
    ],
  },
};

async function SyiarDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = SYIAR_DATABASE[slug];

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f8f9ff] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
            Informasi Tidak Ditemukan
          </span>
          <h1 className="text-xl font-extrabold text-[#0b1c30]">
            Halaman Syiar Belum Tersedia
          </h1>
          <p className="text-xs text-slate-500">
            Program atau informasi yang Anda cari tidak ditemukan atau sudah diperbarui.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
          >
            <span>← Kembali ke Portal Utama</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0fdf4] via-[#f8f9ff] to-[#f0fdf4] text-[#0b1c30]">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-4 md:px-8 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#047857] hover:text-emerald-800 transition"
          >
            <span aria-hidden="true">←</span>
            <span>Kembali ke Portal Masjid</span>
          </Link>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full">
            {data.badge}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-white rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-sm">
            <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70">
              <img
                src={data.posterUrl}
                alt={data.judul}
                className="w-full h-auto object-contain"
              />
            </div>
            <p className="text-[11px] text-center text-slate-400 mt-3">
              Poster Resmi Takmir Masjid Baitul Mu&apos;minin
            </p>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
              <div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  {data.badge}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#0b1c30] mt-2 leading-tight">
                  {data.judul}
                </h1>
                <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">
                  {data.subjudul}
                </p>
              </div>

              <blockquote className="rounded-2xl bg-emerald-50/70 border border-emerald-200/70 p-4 space-y-1">
                <p className="text-xs md:text-sm italic font-medium text-[#064e3b] leading-relaxed">
                  {data.dalil.teks}
                </p>
                <footer className="text-[11px] font-bold text-[#047857]">
                  ({data.dalil.sumber})
                </footer>
              </blockquote>

              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                {data.deskripsi}
              </p>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <dl className="divide-y divide-slate-100 text-xs md:text-sm">
                  {data.infoUtama.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-4 py-3 bg-white even:bg-slate-50/60"
                    >
                      <dt className="font-semibold text-slate-500">{row.label}</dt>
                      <dd className="sm:col-span-2 font-bold text-[#0b1c30]">{row.nilai}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {data.paketList.length > 0 && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-extrabold text-[#0b1c30]">
                  Pilihan Paket Tabungan Qurban
                </h2>
                <div className="space-y-3">
                  {data.paketList.map((paket) => (
                    <div
                      key={paket.kode}
                      className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                          {paket.kode}
                        </span>
                        <span className="text-sm md:text-base font-black text-[#047857]">
                          {paket.nominal}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#0b1c30] pt-1">
                        {paket.judul}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {paket.keterangan}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-base md:text-lg font-extrabold text-[#0b1c30]">
                  Informasi &amp; Pendaftaran via WhatsApp
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik tombol di bawah untuk langsung terhubung dengan pengurus Takmir / Panitia.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.kontakWa.map((kontak) => (
                  <a
                    key={kontak.nomorTampil}
                    href={kontak.waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                  >
                    <div>
                      <p className="text-[11px] font-medium text-emerald-100">
                        {kontak.nama}
                      </p>
                      <p className="text-sm font-extrabold tracking-wide mt-0.5">
                        {kontak.nomorTampil}
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-white/15 px-3 py-1.5 rounded-xl whitespace-nowrap">
                      Chat WA →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>© 2026 Masjid Baitul Mu&apos;minin • Powered by Imaroh SaaS (Kalibu ID)</p>
      </footer>
    </main>
  );
}

export default function SyiarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f8f9ff] flex items-center justify-center px-4">
          <p className="text-xs font-semibold text-slate-500">
            Memuat informasi syiar masjid...
          </p>
        </main>
      }
    >
      <SyiarDetailContent params={params} />
    </Suspense>
  );
}

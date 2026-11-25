import Image from 'next/image';
import Link from 'next/link';

export default function PhbiSection() {
  return (
    <section id="phbi" className="py-12 md:py-16 bg-slate-50/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-8 rounded-full bg-emerald-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Syiar Masjid Baitul Mu&apos;minin
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Agenda PHBI Terdekat
              </h2>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            27 Rajab 1448 H • Januari 2027
          </span>
        </div>

        {/* Konten Utama: Poster Vertikal Utuh + Kartu Informasi */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Poster phbi_isra.jpg (9:16 Utuh Tanpa Crop) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[360px] rounded-3xl overflow-hidden border border-slate-200 bg-[#0d2f45] shadow-md">
              <div className="relative w-full aspect-[9/16]">
                <Image
                  src="/images/phbi_isra.jpg"
                  alt="Poster Peringatan Isra Mi'raj 27 Rajab 1448 Hijriah Masjid Baitul Mu'minin Citra Mandiri Regency"
                  fill
                  sizes="(max-width: 1024px) 100vw, 360px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Kolom Detail Agenda, Ajakan & Pencatatan Keuangan */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  Isra Mi&apos;raj 1448 H
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  Citra Mandiri Regency
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                Peringatan Isra Mi&apos;raj Nabi Muhammad SAW
              </h3>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Mari hadiri dan syiarkan peringatan Isra Mi&apos;raj 27 Rajab 1448 H (Januari 2027) bersama jamaah Masjid Baitul Mu&apos;minin Citra Mandiri Regency. Semoga di hari yang penuh hikmah ini kita selalu dirahmati dan selalu berada dalam lindungan-Nya.
              </p>

              {/* Info Ringkas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Perkiraan Waktu
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    Januari 2027 (27 Rajab 1448 H)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Jadwal rinci mengikuti penetapan takmir
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Lokasi &amp; Kreasi Syiar
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    Masjid Baitul Mu&apos;minin
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Citra Mandiri Regency • Baitul Mu&apos;minin Young
                  </p>
                </div>
              </div>

              {/* Catatan Alur Kas PHBI */}
              <div className="rounded-2xl bg-emerald-50/80 border border-emerald-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Transparansi Dana &amp; Pembiayaan PHBI
                </p>
                <p className="text-xs sm:text-sm text-emerald-900/90 leading-relaxed">
                  Seluruh pemasukan dan pembiayaan acara dicatat pada mutasi kas dengan label{' '}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs border border-emerald-200 text-emerald-950">
                    [PHBI - Isra Mi&apos;raj]
                  </code>{' '}
                  agar saldo kas operasional utama tetap bersih dan mudah ditelusuri.
                </p>
              </div>
            </div>

            {/* Tombol Navigasi ke Section yang Sudah Ada */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <Link
                href="#qris"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
              >
                Info Infak / Donasi
              </Link>
              <Link
                href="#mutasi"
                className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Lihat Mutasi Kas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


"use client";

import Link from "next/link";

export interface SyiarItem {
  id: string;
  badge: string;
  judul: string;
  ringkasan: string;
  posterUrl: string;
  href: string;
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
  if (!items || items.length === 0) return null;

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
        {items.map((item) => (
          <article
            key={item.id}
            className="group rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
          >
            <Link
              href={item.href}
              className="block relative aspect-[3/4] w-full bg-slate-100 overflow-hidden border-b border-slate-200/80"
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
            </Link>

            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-base md:text-lg font-bold text-[#0b1c30] leading-snug">
                  {item.judul}
                </h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  {item.ringkasan}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200/70">
                <span className="text-[11px] font-medium text-slate-400">
                  Halaman khusus info lengkap
                </span>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs"
                >
                  <span>Lihat Detail</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

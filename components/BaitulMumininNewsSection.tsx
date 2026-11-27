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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadNews() {
      try {
        const { data, error } = await supabase
          .from("berita_kegiatan")
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
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div>
                {item.foto_url && (
                  <div className="w-full h-44 bg-slate-100 overflow-hidden border-b border-slate-100">
                    <img
                      src={item.foto_url}
                      alt={item.judul}
                      className="w-full h-full object-cover"
                    />
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
          ))}
        </div>
      )}
    </section>
  );
}

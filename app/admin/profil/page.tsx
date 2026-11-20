"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchImarohData, IMAROH_APPS_SCRIPT_URL } from "@/lib/api";

function isValidImageSrc(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (
    trimmed === "[URL]" ||
    trimmed === "[Gambar QRIS Lokal Terunggah]" ||
    trimmed === "[Gambar Lokal Terunggah]"
  ) {
    return false;
  }
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:image/")
  );
}

async function compressImageFile(
  file: File,
  options: { maxSize: number; preferPng?: boolean; maxChars?: number }
): Promise<string> {
  const { maxSize, preferPng = false, maxChars = 46000 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format gambar tidak valid."));
      img.onload = () => {
        const renderToDataUrl = (targetMax: number, mime: string, quality?: number) => {
          let { width, height } = img;
          if (width > targetMax || height > targetMax) {
            if (width >= height) {
              height = Math.round((height * targetMax) / width);
              width = targetMax;
            } else {
              width = Math.round((width * targetMax) / height);
              height = targetMax;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("Canvas tidak tersedia.");
          }

          if (mime === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return quality !== undefined
            ? canvas.toDataURL(mime, quality)
            : canvas.toDataURL(mime);
        };

        try {
          if (preferPng && file.type === "image/png") {
            const pngResult = renderToDataUrl(maxSize, "image/png");
            if (pngResult.length <= maxChars) {
              resolve(pngResult);
              return;
            }
          }

          const sizes = [maxSize, 420, 340, 280];
          const qualities = [0.75, 0.6, 0.48];

          for (const sz of sizes) {
            for (const q of qualities) {
              const candidate = renderToDataUrl(sz, "image/jpeg", q);
              if (candidate.length <= maxChars) {
                resolve(candidate);
                return;
              }
            }
          }

          const fallback = renderToDataUrl(260, "image/jpeg", 0.45);
          resolve(fallback);
        } catch (err) {
          reject(err);
        }
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminProfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [namaMasjid, setNamaMasjid] = useState("");
  const [alamat, setAlamat] = useState("");
  const [telepon, setTelepon] = useState("");
  const [runningText, setRunningText] = useState("");
  const [qrisUrl, setQrisUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Muat data profil saat halaman dibuka
  const loadProfil = async () => {
    try {
      const data = await fetchImarohData("profil");
      if (data && data.profil && data.profil.length > 0) {
        const p = data.profil[0];
        const rawLogo = String(p.logo_url || "").trim();
        const rawQris = String(p.qris_url || "").trim();

        setNamaMasjid(p.nama_masjid || "");
        setAlamat(p.alamat || "");
        setTelepon(p.telepon || "");
        setRunningText(p.running_text || "");
        setLogoUrl(isValidImageSrc(rawLogo) ? rawLogo : "");
        setQrisUrl(isValidImageSrc(rawQris) ? rawQris : "");
      }
    } catch (error) {
      console.error("Gagal memuat profil masjid:", error);
    }
  };

  useEffect(() => {
    loadProfil();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Gagal logout:", err);
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  // Handler khusus untuk upload file lokal dari perangkat dengan kompresi adaptif
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    options: { maxSize: number; preferPng?: boolean; label: string }
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert(`Ukuran file ${options.label} maksimal 4MB.`);
      e.target.value = "";
      return;
    }

    try {
      const compressedDataUrl = await compressImageFile(file, {
        maxSize: options.maxSize,
        preferPng: options.preferPng,
        maxChars: 46000,
      });

      if (compressedDataUrl.length > 48500) {
        alert(
          `Data ${options.label} masih terlalu padat untuk sel Google Sheets. ` +
            "Sebaiknya masukkan URL gambar langsung (https://...)."
        );
        e.target.value = "";
        return;
      }

      setter(compressedDataUrl);
    } catch (error) {
      console.error(`Gagal memproses ${options.label}:`, error);
      alert(`Gagal memproses gambar ${options.label}. Pastikan file PNG/JPG valid.`);
    } finally {
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanLogo = isValidImageSrc(logoUrl) ? logoUrl.trim() : "";
    const cleanQris = isValidImageSrc(qrisUrl) ? qrisUrl.trim() : "";

    try {
      const payload = {
        action: "updateProfil",
        nama_masjid: namaMasjid.trim(),
        alamat: alamat.trim(),
        telepon: telepon.trim(),
        running_text: runningText.trim(),
        qris_url: cleanQris,
        logo_url: cleanLogo,
      };

      await fetch(IMAROH_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
        body: JSON.stringify(payload),
      });

      alert(
        "Permintaan pembaruan profil dikirim, tetapi hasil penyimpanan belum dapat diverifikasi. " +
          "Periksa Google Sheets dan tekan F5 setelah beberapa detik untuk memastikan logo & QRIS tersimpan."
      );

      setTimeout(() => {
        loadProfil();
      }, 2000);
    } catch (error) {
      console.error("Gagal menyimpan profil:", error);
      alert(
        "Permintaan gagal atau hasilnya tidak diketahui. " +
          "Periksa Google Sheets sebelum mencoba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  const logoPreviewValid = isValidImageSrc(logoUrl);
  const qrisPreviewValid = isValidImageSrc(qrisUrl);

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#047857] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Modul Konfigurasi DKM
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] mt-2">
              Profil & Pengaturan Masjid
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola identitas, logo transparan, QRIS donasi, dan running text beranda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition duration-200 shadow-sm"
            >
              ← Kembali ke Dashboard
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition duration-200 shadow-sm"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Form Pengaturan Profil */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Resmi Masjid
              </label>
              <input
                type="text"
                value={namaMasjid}
                onChange={(e) => setNamaMasjid(e.target.value)}
                placeholder="Contoh: Masjid Baitul Mu'minin"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                required
              />
            </div>

            {/* Bagian Upload & Preview Logo Masjid */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Logo Masjid (PNG Transparan)
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Hapus Logo
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-300 flex items-center justify-center p-2 shadow-inner overflow-hidden flex-shrink-0">
                  {logoPreviewValid ? (
                    <img
                      src={logoUrl}
                      alt="Preview Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-2xl">🕌</span>
                  )}
                </div>
                <div className="space-y-2 w-full">
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) =>
                      handleFileUpload(e, setLogoUrl, {
                        maxSize: 320,
                        preferPng: true,
                        label: "Logo Masjid",
                      })
                    }
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#047857] hover:file:bg-emerald-100 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={logoUrl.startsWith("data:") ? "[Gambar Lokal Terunggah]" : logoUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== "[Gambar Lokal Terunggah]") {
                        setLogoUrl(val);
                      }
                    }}
                    placeholder="Atau masukkan URL / link gambar langsung (https://...)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#047857]"
                  />
                  <p className="text-[11px] text-slate-500">
                    Pilih file langsung dari perangkat (otomatis dikompresi) atau masukkan tautan URL.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lengkap
              </label>
              <textarea
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                rows={3}
                placeholder="Masukkan alamat lengkap masjid..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Telepon / Kontak DKM
                </label>
                <input
                  type="text"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
                />
              </div>

              {/* Bagian Upload & Preview QRIS Donasi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Gambar / QRIS Donasi
                  </label>
                  {qrisUrl && (
                    <button
                      type="button"
                      onClick={() => setQrisUrl("")}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Hapus QRIS
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 flex items-center justify-center p-1 overflow-hidden flex-shrink-0 shadow-inner">
                    {qrisPreviewValid ? (
                      <img src={qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-lg">💳</span>
                    )}
                  </div>
                  <div className="w-full space-y-1.5">
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={(e) =>
                        handleFileUpload(e, setQrisUrl, {
                          maxSize: 480,
                          preferPng: false,
                          label: "QRIS Donasi",
                        })
                      }
                      className="w-full text-xs text-slate-500 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={qrisUrl.startsWith("data:") ? "[Gambar QRIS Lokal Terunggah]" : qrisUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "[Gambar QRIS Lokal Terunggah]") {
                          setQrisUrl(val);
                        }
                      }}
                      placeholder="Atau URL QRIS (https://...)..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#047857]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Running Text Beranda (Pesan Berjalan untuk Jamaah)
              </label>
              <input
                type="text"
                value={runningText}
                onChange={(e) => setRunningText(e.target.value)}
                placeholder="Contoh: Selamat Datang di Masjid, mohon matikan HP saat shalat."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#047857] hover:bg-[#064e3b] text-white font-semibold text-sm transition duration-200 shadow-md disabled:opacity-50"
            >
              {loading ? "Menyimpan ke Sheets..." : "Simpan Perubahan Profil ke Sheets"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

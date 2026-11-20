// --- LIB API UNTUK IMAROH KALIBU ---

export const IMAROH_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwcbB0bdYWA2VKPAssCQvoIl5gCV3ZjTO3qodOMCXZ5tJ_-vZ7H0H6gjVhxBnZskb4b/exec";

export interface ImarohApiResponse {
  status?: string;
  kas?: any[];
  inventaris?: any[];
  kajian?: any[];
  profil?: any[];
  [key: string]: any;
}

export async function fetchImarohData(action = "all"): Promise<ImarohApiResponse> {
  try {
    const safeAction = encodeURIComponent(String(action || "all").trim() || "all");
    const targetUrl = `${IMAROH_APPS_SCRIPT_URL}?action=${safeAction}`;

    const res = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return {
      ...data,
      kas: Array.isArray(data?.kas) ? data.kas : [],
      inventaris: Array.isArray(data?.inventaris) ? data.inventaris : [],
      kajian: Array.isArray(data?.kajian) ? data.kajian : [],
      profil: Array.isArray(data?.profil) ? data.profil : [],
    };
  } catch (error) {
    console.error("Gagal mengambil data dari Google Sheets:", error);
    // Kembalikan struktur kosong agar halaman tidak crash / blank
    return {
      status: "error",
      kas: [],
      inventaris: [],
      kajian: [],
      profil: [],
    };
  }
}

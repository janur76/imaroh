// --- LIB API UNTUK IMAROH KALIBU ---

// Ganti URL di bawah ini dengan URL Web App Google Apps Script terbaru milikmu yang berakhiran /exec
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwcbB0bdYWA2VKPAssCQvoIl5gCV3ZjTO3qodOMCXZ5tJ_-vZ7H0H6gjVhxBnZskb4b/exec";

export async function fetchImarohData(action = "all") {
  try {
    const targetUrl = `${APPS_SCRIPT_URL}?action=${action}`;
    
    const res = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Gagal mengambil data dari Google Sheets:", error);
    // Kembalikan struktur kosong agar halaman tidak crash / blank
    return {
      status: "error",
      kas: [],
      inventaris: [],
      kajian: [],
      profil: []
    };
  }
}

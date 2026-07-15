// frontend/src/utils/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  let token = '';

  // 1. AMAN: Safe parsing localStorage agar tidak crash jika data korup
  if (typeof window !== 'undefined') {
    const userStorage = localStorage.getItem('userInfo');
    if (userStorage) {
      try {
        const userInfo = JSON.parse(userStorage);
        token = userInfo.token;
      } catch (e) {
        console.error("Data login korup, membersihkan localStorage...", e);
        localStorage.removeItem('userInfo');
      }
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // 2. PENANGANAN 401 (Unauthorized): Token kadaluwarsa/tidak valid
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userInfo');
        window.location.href = '/login'; // Redirect paksa ke login
      }
      throw new Error('Sesi berakhir, silakan login kembali.');
    }

    // 3. Menangani JSON Parsing jika response kosong
    const data = await response.json().catch(() => ({}));

    // 4. Menangani Error dari Backend (Status 4xx/5xx)
    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}: Terjadi kesalahan`);
    }

    return data;

  } catch (error: any) {
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      console.error("Backend tidak merespons. Pastikan server 5000 menyala.");
      throw new Error("Gagal terhubung ke server (Backend mati atau CORS).");
    }
    throw error;
  }
};
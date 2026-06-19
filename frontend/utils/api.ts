// frontend/src/utils/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Centralized API Caller.
 * Berfungsi untuk menangani request ke Backend dan menyisipkan JWT Token
 * dari localStorage (jika ada) ke dalam Authorization header.
 */
export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  let token = '';
  
  // Memastikan localStorage diakses hanya dari sisi client (browser)
  if (typeof window !== 'undefined') {
    const userStorage = localStorage.getItem('userInfo');
    if (userStorage) {
      const userInfo = JSON.parse(userStorage);
      token = userInfo.token;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Terjadi kesalahan pada server');
  }

  return data;
};
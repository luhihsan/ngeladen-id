// frontend/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/utils/api';

export default function DashboardPage() {
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  
  // State untuk form masukan
  const [suggestion, setSuggestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const storedData = localStorage.getItem('userInfo');
    if (storedData) {
      setUser(JSON.parse(storedData));
    }
  }, []);

  // Handler untuk submit form saran
  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;
    
    setIsSubmitting(true);
    setSubmitMessage({ text: '', type: '' });

    try {
      await fetchAPI('/suggestions', {
        method: 'POST',
        body: JSON.stringify({ content: suggestion, isAnonymous }),
      });
      
      setSubmitMessage({ text: 'Terima kasih! Aspirasi Anda berhasil dikirim ke Ketua.', type: 'success' });
      setSuggestion(''); // Kosongkan form setelah sukses
      setIsAnonymous(false);
      
      // Hilangkan pesan sukses setelah 5 detik
      setTimeout(() => setSubmitMessage({ text: '', type: '' }), 5000);
    } catch (err: any) {
      setSubmitMessage({ text: err.message || 'Gagal mengirim aspirasi.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-indigo-100 to-cyan-50 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Selamat datang, <span className="text-indigo-600">{user?.fullName || 'Pengguna'}</span>! 👋
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl text-lg">
            Anda masuk sebagai <strong className="text-slate-700 font-semibold">{user?.role}</strong>. Gunakan menu di samping untuk mengelola kegiatan organisasi.
          </p>
        </div>
      </div>

      {/* Grid Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Statistik (Lebar 2/3 di layar besar) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Anggota</p>
                <p className="text-2xl font-bold text-slate-900">--</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Agenda Bulan Ini</p>
                <p className="text-2xl font-bold text-slate-900">--</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Kotak Aspirasi Anggota */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Kirim Aspirasi / Masukan
            </h3>
            <p className="text-xs text-slate-500 mt-1">Pesan akan dikirim langsung ke Ketua</p>
          </div>
          
          <form onSubmit={handleSuggestionSubmit} className="p-5 flex-1 flex flex-col">
            <textarea
              required
              rows={4}
              placeholder="Tuliskan saran, kritik, atau ide kegiatan di sini..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none mb-4 flex-1"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
            />

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="anonymous"
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <label htmlFor="anonymous" className="text-sm font-medium text-slate-700 cursor-pointer">
                Kirim sebagai Anonim
              </label>
            </div>

            {submitMessage.text && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${
                submitMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {submitMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !suggestion.trim()}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Sekarang'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
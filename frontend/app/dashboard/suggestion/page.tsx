// frontend/app/dashboard/masukan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';

interface Suggestion {
  _id: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  user?: {
    fullName: string;
    role: string;
  };
}

export default function KotakMasukanPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await fetchAPI('/suggestions', { method: 'GET' });
      setSuggestions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-4 text-center text-slate-500 animate-pulse">Memuat aspirasi...</div>;
  if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-xl">{error}</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kotak Masukan</h1>
          <p className="text-sm text-slate-500">Aspirasi, kritik, dan saran dari anggota</p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <p className="text-slate-500">Belum ada masukan yang masuk.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((item) => (
            <div key={item._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              {/* Tanda jika anonim */}
              {item.isAnonymous ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold mb-4">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Pengirim Anonim
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                    {item.user?.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.user?.fullName}</p>
                    <p className="text-xs font-medium text-slate-500">{item.user?.role}</p>
                  </div>
                </div>
              )}

              <p className="text-slate-700 leading-relaxed text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                "{item.content}"
              </p>
              
              <div className="mt-4 text-right">
                <span className="text-xs text-slate-400 font-medium">
                  Dikirim: {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
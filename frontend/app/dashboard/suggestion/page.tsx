'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';

interface Suggestion {
  _id: string;
  content: string;
  isAnonymous: boolean;
  status: 'Pending' | 'Selesai';
  response: string;
  createdAt: string;
  createdBy?: { fullName: string; role: string };
}

export default function SuggestionPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Selesai'>('Pending');

  // Modal Tindak Lanjut
  const [isRespondOpen, setIsRespondOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    setUserRole(role || '');
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await fetchAPI('/suggestions', { method: 'GET' });
      setSuggestions(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat aspirasi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRespond = (id: string) => {
    setSelectedId(id);
    setResponseText('');
    setIsRespondOpen(true);
  };

  const handleRespondSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchAPI(`/suggestions/${selectedId}/respond`, {
        method: 'PUT',
        body: JSON.stringify({ response: responseText })
      });
      setIsRespondOpen(false);
      loadSuggestions();
    } catch (err: any) {
      alert(err.message || 'Gagal menanggapi aspirasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = suggestions.filter(s => s.status === activeTab);
  const isKetua = ['Ketua', 'Wakil Ketua'].includes(userRole);

  if (isLoading) return <div className="p-4 text-slate-500 animate-pulse">Memuat data aspirasi...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{isKetua ? 'Kelola Kotak Masukan' : 'Riwayat Aspirasi Saya'}</h1>
        <p className="text-sm text-slate-500">
          {isKetua ? 'Tanggapi kritik, saran, dan ide dari warga/anggota organisasi.' : 'Pantau status tindak lanjut dari aspirasi yang Anda berikan.'}
        </p>
      </div>

      {/* Tabs Control */}
      <div className="flex gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('Pending')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'Pending' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Belum Ditanggapi
        </button>
        <button 
          onClick={() => setActiveTab('Selesai')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'Selesai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Selesai (Ada Tindak Lanjut)
        </button>
      </div>

      {/* Data List */}
      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-sm">
            Tidak ada aspirasi pada kategori ini.
          </div>
        ) : (
          filteredData.map((item) => (
            <div key={item._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                    {item.createdBy?.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.createdBy?.fullName}</p>
                    <p className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${item.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {item.status.toUpperCase()}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-800 font-medium">
                "{item.content}"
              </div>

              {item.status === 'Selesai' && item.response && (
                <div className="mt-2 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-sm">
                  <p className="text-[10px] font-bold text-indigo-600 mb-1 uppercase tracking-wider">Tanggapan Ketua:</p>
                  <p className="text-indigo-900 font-medium">{item.response}</p>
                </div>
              )}

              {isKetua && item.status === 'Pending' && (
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleOpenRespond(item._id)}
                    className="px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs rounded-xl transition-colors shadow-sm"
                  >
                    Tanggapi & Selesaikan
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Tindak Lanjut */}
      {isRespondOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Tindak Lanjut Aspirasi</h3>
              <p className="text-xs text-slate-500 mt-1">Berikan tanggapan resmi. Aspirasi akan ditandai selesai.</p>
            </div>
            <form onSubmit={handleRespondSubmit} className="p-6 space-y-4">
              <textarea
                required
                rows={4}
                placeholder="Tuliskan langkah konkrit atau jawaban dari aspirasi tersebut..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none font-medium text-slate-900"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsRespondOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Tanggapan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
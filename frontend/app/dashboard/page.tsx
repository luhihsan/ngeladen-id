// frontend/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/utils/api';

interface Meeting {
  _id: string;
  title: string;
  date: string;
  isRoutine: boolean;
  host: string;
  notes: string;
}

interface FinanceSummary {
  totalSaldo: number;
  totalMasuk: number;
  totalKeluar: number;
}

interface UserSession {
  fullName: string;
  role: string;
  status: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary>({ totalSaldo: 0, totalMasuk: 0, totalKeluar: 0 });
  const [totalAnggota, setTotalAnggota] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- State Form Aspirasi ---
  const [suggestion, setSuggestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const storedData = localStorage.getItem('userInfo');
    if (storedData) {
      const parsedUser = JSON.parse(storedData);
      setUser(parsedUser);
      loadDashboardData(parsedUser.role);
    }
  }, []);

  const loadDashboardData = async (role: string) => {
    try {
      const [meetingRes, financeRes] = await Promise.all([
        fetchAPI('/meetings', { method: 'GET' }),
        fetchAPI('/transactions', { method: 'GET' })
      ]);

      setMeetings(meetingRes);
      setFinanceSummary(financeRes.summary);

      if (['Ketua', 'Wakil Ketua', 'Sekretaris', 'Kedisiplinan'].includes(role)) {
        const usersRes = await fetchAPI('/users', { method: 'GET' });
        setTotalAnggota(usersRes.length);
      }
    } catch (err: any) {
      console.error('Gagal memuat beberapa komponen dashboard:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
      setSubmitMessage({ text: 'Aspirasi Anda berhasil dikirim.', type: 'success' });
      setSuggestion('');
      setIsAnonymous(false);
      setTimeout(() => setSubmitMessage({ text: '', type: '' }), 5000);
    } catch (err: any) {
      setSubmitMessage({ text: err.message || 'Gagal mengirim aspirasi.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  if (isLoading) return <div className="p-4 text-center text-slate-500 animate-pulse">Menyusun ringkasan informasi...</div>;

  const isAnggotaBiasa = user?.role === 'Anggota';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* BANNER UTAMA: Greeting Personal */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-indigo-100 to-cyan-50 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Selamat datang, <span className="text-indigo-600">{user?.fullName}</span>! 👋
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-500">
              Membuka panel utama <strong className="text-slate-700 font-semibold uppercase">{user?.role}</strong> Ngeladen.id.
            </p>
          </div>
          {isAnggotaBiasa && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-2 text-xs font-bold self-start sm:self-center">
              🟢 Status Anda: Anggota Aktif Pemuda
            </div>
          )}
        </div>
      </div>

      {/* TAMPILAN KARTU STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Kas Utama Organisasi</p>
          <p className="text-2xl font-black mt-1 text-slate-900">{formatRupiah(financeSummary.totalSaldo)}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Transparansi kas real-time pemuda</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Kegiatan Rapat</p>
          <p className="text-2xl font-bold mt-1 text-slate-900">{meetings.length} Agenda</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Jumlah arsip rapat terjadwal</p>
        </div>

        {isAnggotaBiasa ? (
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Estimasi Kewajiban Kas</p>
            <p className="text-2xl font-bold mt-1 text-amber-800">Rp 0</p>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">Anda bebas dari tunggakan kas denda</p>
          </div>
        ) : (
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider">Total Anggota Terdata</p>
            <p className="text-2xl font-bold mt-1 text-indigo-900">{totalAnggota !== null ? `${totalAnggota} Jiwa` : '--'}</p>
            <p className="text-[11px] text-indigo-500 mt-1 font-medium">Hak akses pengelolaan pengurus inti</p>
          </div>
        )}
      </div>

      {/* GRID UTAMA BAWAH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: Linimasa Rapat Terupdate */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              📅 Agenda & Pengumuman Rapat Terdekat
            </h3>
          </div>

          {meetings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-sm">
              Belum ada jadwal rapat terdekat yang diterbitkan oleh sekretaris.
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.slice(0, 3).map((meeting) => (
                <div key={meeting._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 hover:border-indigo-100 transition-colors">
                  
                  {/* Row Atas: Informasi Utama & Badge Status */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          meeting.isRoutine ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>{meeting.isRoutine ? 'Rutin Bulanan' : 'Insidental'}</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          🗓️ {new Date(meeting.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base pt-1">{meeting.title}</h4>
                      {meeting.host && (
                        <p className="text-xs text-slate-500 font-medium">📍 Tuan Rumah / Lokasi: <span className="text-slate-700 font-semibold">{meeting.host}</span></p>
                      )}
                    </div>
                    
                    <div className="shrink-0 self-start sm:self-auto">
                      {meeting.notes ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                          ✓ Notulensi Tersedia
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                          ⏳ Menunggu Rapat
                        </span>
                      )}
                    </div>
                  </div>

                  {/* UPDATE DISINI: Menampilkan Isi Dokumen HTML Notulensi Langsung di Dashboard */}
                  {meeting.notes && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Hasil Pembahasan Rapat:</p>
                      <div 
                        className="text-sm text-slate-700 font-medium prose max-w-none break-words leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: meeting.notes }}
                      />
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

        {/* KOLOM KANAN: Kotak Pengiriman Aspirasi Anggota */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              📥 Kotak Suara Aspirasi Pemuda
            </h3>
            <p className="text-xs text-slate-500 mt-1">Sampaikan keluhan, kritik, atau ide kegiatan</p>
          </div>
          
          <form onSubmit={handleSuggestionSubmit} className="p-5 space-y-4">
            <textarea
              required
              rows={3}
              placeholder="Tulis aspirasi atau usulan kegiatan rapat di sini..."
              className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none font-medium"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <label htmlFor="anonymous" className="text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer select-none">
                Sembunyikan Nama Saya (Kirim Anonim)
              </label>
            </div>

            {submitMessage.text && (
              <div className={`p-3 rounded-xl text-xs sm:text-sm font-semibold ${
                submitMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {submitMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !suggestion.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100"
            >
              {isSubmitting ? 'Mengirim Aspirasi...' : 'Kirim Aspirasi'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
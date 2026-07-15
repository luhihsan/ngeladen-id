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

interface FinancialMetrics {
  masuk: number;
  keluar: number;
  saldo: number;
}

interface FinanceSummary {
  global: FinancialMetrics;
  umum: FinancialMetrics;
  infak: FinancialMetrics;
  kedisiplinan: FinancialMetrics;
  bekakas: FinancialMetrics;
}

interface UserSession {
  fullName: string;
  role: string;
  status: string;
}

interface SP {
  _id: string;
  spNumber: string;
  reason: string;
  fileUrl?: string;
  createdAt: string;
}

interface Fine {
  _id: string;
  amount: number;
  reason: string;
  date: string;
  status: string;
}

interface MandatoryFee {
  _id: string;
  month: string;
  year: number;
  amount: number;
  status: string;
}

interface PersonalRecords {
  fines: Fine[];
  mandatoryFees: MandatoryFee[];
  suratPeringatan: SP[];
}

interface PersonalAlerts {
  unpaidFines: number;
  unpaidKas: number;
  spCount: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary>({
    global: { masuk: 0, keluar: 0, saldo: 0 },
    umum: { masuk: 0, keluar: 0, saldo: 0 },
    infak: { masuk: 0, keluar: 0, saldo: 0 },
    kedisiplinan: { masuk: 0, keluar: 0, saldo: 0 },
    bekakas: { masuk: 0, keluar: 0, saldo: 0 }
  });
  const [totalAnggota, setTotalAnggota] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States Komponen Rapor Data Anggota
  const [personalAlerts, setPersonalAlerts] = useState<PersonalAlerts | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecords | null>(null);

  // States Formulir Aspirasi Kotak Saran
  const [suggestion, setSuggestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const storedData = localStorage.getItem('userInfo');
    if (storedData) {
      try {
        const parsedUser = JSON.parse(storedData);
        setUser(parsedUser);
        loadDashboardData(parsedUser.role);
      } catch (e) {
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  const loadDashboardData = async (role: string) => {
    try {
      // Pemanggilan paralel aman dibungkus catch individual agar antarmuka tidak mati total
      const [meetingRes, financeRes, recordsRes] = await Promise.all([
        fetchAPI('/meetings', { method: 'GET' }).catch(() => []),
        fetchAPI('/transactions', { method: 'GET' }).catch(() => ({})),
        fetchAPI('/users/my-profile', { method: 'GET' }).catch(() => null)
      ]);

      setMeetings(meetingRes);
      
      if (financeRes?.summary) {
        setFinanceSummary(financeRes.summary);
      }

      // Sinkronisasi data tanpa merusak payload token di localStorage
      if (recordsRes && recordsRes.success) {
        const latestStorage = localStorage.getItem('userInfo');
        if (latestStorage && recordsRes.profile) {
          const currentSession = JSON.parse(latestStorage);
          
          // Gabungkan status terbaru tanpa melibas fullName, role, dan token asli
          const updatedUser = { ...currentSession, status: recordsRes.profile.status };
          setUser(updatedUser as UserSession);
          localStorage.setItem('userInfo', JSON.stringify(updatedUser)); 
        }

        const unpaidFinesList = recordsRes.fines || [];
        const unpaidKasList = recordsRes.mandatoryFees || [];

        const unpaidFinesTotal = unpaidFinesList
          .filter((f: any) => f.status !== 'Lunas')
          .reduce((sum: number, f: any) => sum + f.amount, 0);
          
        const unpaidKasTotal = unpaidKasList
          .filter((m: any) => m.status !== 'Lunas')
          .reduce((sum: number, m: any) => sum + m.amount, 0);

        setPersonalRecords({
          fines: unpaidFinesList,
          mandatoryFees: unpaidKasList,
          suratPeringatan: recordsRes.suratPeringatan || []
        });

        setPersonalAlerts({
          unpaidFines: unpaidFinesTotal,
          unpaidKas: unpaidKasTotal,
          spCount: (recordsRes.suratPeringatan || []).length
        });
      }

      if (['Ketua', 'Wakil Ketua', 'Sekretaris', 'Kedisiplinan'].includes(role)) {
        const usersRes = await fetchAPI('/users', { method: 'GET' }).catch(() => []);
        setTotalAnggota(usersRes.length);
      }
    } catch (err: any) {
      console.error('Gagal memuat sinkronisasi komponen dasbor internal.');
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

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse font-normal">Menyusun ringkasan informasi panel...</div>;

  const isAnggotaBiasa = user?.role === 'Anggota';
  const globalSaldo = financeSummary?.global?.saldo || 0;
  const infakSaldo = financeSummary?.infak?.saldo || 0;
  const kasUtamaPemuda = globalSaldo - infakSaldo;

  const hasAlerts = personalAlerts && (personalAlerts.spCount > 0 || personalAlerts.unpaidFines > 0 || personalAlerts.unpaidKas > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800 font-normal">
      
      {/* BANNER UTAMA: Greeting Personal & Badge Sinkron Terkunci */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-indigo-100 to-cyan-50 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-3">
          
          {/* Baris Flexbox Fleksibel Pengunci Posisi Judul Nama & Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Selamat datang, <span className="text-indigo-600">{user?.fullName}</span>!
            </h1>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wide shrink-0 ${
              user?.status === 'Aktif' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {user?.status || 'Aktif'}
            </span>
          </div>
          
          <p className="text-sm text-slate-600">
            Membuka dashboard sebagai <span className="text-slate-800 font-medium uppercase">{user?.role}</span> Pancatama dalam sistem Ngeladen.id.
          </p>
        </div>
      </div>

      {/* BANNER ALERT TANGGUNGAN MENDESAK */}
      {hasAlerts && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-2">
          <div>
            <h3 className="text-rose-800 font-semibold text-sm flex items-center gap-2">
              ⚠️ Perhatian: Anda Memiliki Tanggungan Aktif
            </h3>
            <div className="mt-1.5 text-xs text-rose-700 flex flex-wrap gap-x-4 gap-y-1 font-medium">
              {personalAlerts.spCount > 0 && <span>• {personalAlerts.spCount} Surat Peringatan (SP)</span>}
              {personalAlerts.unpaidKas > 0 && <span>• Tunggakan Kas: {formatRupiah(personalAlerts.unpaidKas)}</span>}
              {personalAlerts.unpaidFines > 0 && <span>• Denda Belum Lunas: {formatRupiah(personalAlerts.unpaidFines)}</span>}
            </div>
          </div>
          <a href="#rincian-tanggungan" className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-xs font-medium shadow-sm transition-colors shrink-0">
            Lihat Rincian di Bawah ↓
          </a>
        </div>
      )}

      {/* PANEL UTAMA KARTU REKAPITULASI DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Kas Utama Organisasi Pemuda</p>
          <p className="text-2xl font-semibold mt-1 text-slate-900">{formatRupiah(kasUtamaPemuda)}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-normal">Transparansi kas riil diluar pos anggaran infak</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Agenda Kegiatan</p>
          <p className="text-2xl font-semibold mt-1 text-slate-900">{meetings.length} Rapat</p>
          <p className="text-[11px] text-slate-500 mt-1 font-normal">Jumlah arsip musyawarah terjadwal</p>
        </div>

        {isAnggotaBiasa ? (
          <div className={`${personalAlerts && (personalAlerts.unpaidKas > 0 || personalAlerts.unpaidFines > 0) ? 'bg-amber-50/80 border-amber-200' : 'bg-emerald-50/50 border-emerald-200'} border rounded-xl p-5 shadow-sm transition-colors`}>
            <p className={`text-xs font-medium uppercase tracking-wider ${personalAlerts && (personalAlerts.unpaidKas > 0 || personalAlerts.unpaidFines > 0) ? 'text-amber-700' : 'text-emerald-700'}`}>Estimasi Kewajiban Kas</p>
            <p className={`text-2xl font-semibold mt-1 ${personalAlerts && (personalAlerts.unpaidKas > 0 || personalAlerts.unpaidFines > 0) ? 'text-amber-800' : 'text-emerald-800'}`}>
              {personalAlerts ? formatRupiah(personalAlerts.unpaidKas + personalAlerts.unpaidFines) : 'Rp 0'}
            </p>
            <p className={`text-[11px] mt-1 font-normal ${personalAlerts && (personalAlerts.unpaidKas > 0 || personalAlerts.unpaidFines > 0) ? 'text-amber-600' : 'text-emerald-600'}`}>
              {personalAlerts && (personalAlerts.unpaidKas > 0 || personalAlerts.unpaidFines > 0) ? 'Silakan lunasi ke Bendahara' : 'Anda bersih dari tunggakan'}
            </p>
          </div>
        ) : (
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-indigo-700 font-medium uppercase tracking-wider">Total Anggota Terdata</p>
            <p className="text-2xl font-semibold mt-1 text-indigo-900">{totalAnggota !== null ? `${totalAnggota} Jiwa` : '--'}</p>
            <p className="text-[11px] text-indigo-600 mt-1 font-normal">Hak akses pengarsipan data milik internal inti</p>
          </div>
        )}
      </div>

      {/* AREA GRID RINCIAN TANGGUNGAN INTEGRASI PRIBADI */}
      {isAnggotaBiasa && hasAlerts && personalRecords && (
        <div id="rincian-tanggungan" className="bg-white border border-rose-200 rounded-xl shadow-sm overflow-hidden w-full scroll-mt-24">
          <div className="p-4 border-b border-rose-100 bg-rose-50/40">
            <h3 className="font-semibold text-rose-800 text-sm">Rincian Tanggungan & Surat Peringatan (SP) Anda</h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {personalRecords.suratPeringatan.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Dokumen Surat Peringatan</h4>
                <div className="space-y-2">
                  {personalRecords.suratPeringatan.map(sp => (
                    <div key={sp._id} className="p-3 border border-rose-200 bg-rose-50/60 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-rose-700 text-xs px-2 py-0.5 bg-white rounded border border-rose-100">{sp.spNumber}</span>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(sp.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-2 leading-relaxed"><span className="font-medium text-slate-900">Alasan:</span> {sp.reason}</p>
                      {sp.fileUrl && (
                        <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${sp.fileUrl}`} target="_blank" rel="noreferrer" className="text-indigo-600 text-[11px] mt-2.5 inline-flex items-center gap-1 font-medium hover:text-indigo-800 bg-white px-2 py-1 rounded border border-slate-200 transition-colors">
                          📄 Unduh / Lihat Dokumen
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(personalRecords.fines.length > 0 || personalRecords.mandatoryFees.length > 0) && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Kewajiban Belum Dibayar</h4>
                <div className="space-y-2">
                  {personalRecords.mandatoryFees.map(kas => (
                    <div key={kas._id} className="flex justify-between items-center p-3 border border-amber-200 bg-amber-50/50 rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-amber-900">Tunggakan Kas Pemuda</p>
                        <p className="text-[10px] text-amber-700 mt-0.5">Bulan {kas.month} {kas.year}</p>
                      </div>
                      <span className="font-mono font-semibold text-amber-700 text-sm bg-white px-2 py-1 rounded border border-amber-100">{formatRupiah(kas.amount)}</span>
                    </div>
                  ))}
                  {personalRecords.fines.map(fine => (
                    <div key={fine._id} className="flex justify-between items-center p-3 border border-amber-200 bg-amber-50/50 rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-amber-900 line-clamp-1">{fine.reason}</p>
                        <p className="text-[10px] text-amber-700 mt-0.5">Tanggal Denda: {new Date(fine.date).toLocaleDateString('id-ID')}</p>
                      </div>
                      <span className="font-mono font-semibold text-amber-700 text-sm bg-white px-2 py-1 rounded border border-amber-100">{formatRupiah(fine.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CONTAINER STRUKTUR BOTTOM GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI BARIS AGENDA RAPAT TERUPDATE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-base">
              Agenda & Pengumuman Rapat Terdekat
            </h3>
          </div>

          {meetings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-600 text-sm font-medium">
              Belum ada jadwal rapat terdekat yang diterbitkan oleh sekretaris pemuda.
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.slice(0, 3).map((meeting) => (
                <div key={meeting._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 hover:border-indigo-200 transition-colors">
                  
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          meeting.isRoutine ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>{meeting.isRoutine ? 'Rutin Bulanan' : 'Insidental'}</span>
                        <span className="text-xs font-mono text-slate-500">
                          Tanggal: {new Date(meeting.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 text-base pt-1">{meeting.title}</h4>
                      {meeting.host && (
                        <p className="text-xs text-slate-600 font-normal">Tempat pertemuan: <span className="text-slate-800 font-medium">{meeting.host}</span></p>
                      )}
                    </div>
                    
                    <div className="shrink-0 self-start sm:self-auto">
                      {meeting.notes ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                          Notulensi Tersedia
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                          Menunggu Pelaksanaan
                        </span>
                      )}
                    </div>
                  </div>

                  {meeting.notes && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Hasil Pembahasan Rapat:</p>
                      <div 
                        className="text-sm text-slate-700 font-normal prose max-w-none break-words leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: meeting.notes }}
                      />
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

        {/* KOLOM KANAN KOTAK SUARA ASPIRASI WARGA PEMUDA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
              Kotak Suara Aspirasi Pemuda
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Sampaikan masukan, kritik, atau usulan gagasan kegiatan pemuda</p>
          </div>
          
          <form onSubmit={handleSuggestionSubmit} className="p-5 space-y-4">
            <textarea
              required
              rows={3}
              placeholder="Tulis usulan atau aspirasi kegiatan rapat di sini..."
              className="w-full px-4 py-3 bg-white text-slate-800 border border-slate-300 rounded-xl text-sm focus:border-indigo-500 outline-none resize-none font-normal"
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
              <label htmlFor="anonymous" className="text-xs sm:text-sm font-medium text-slate-700 cursor-pointer select-none">
                Sembunyikan nama saya (Kirim Anonim)
              </label>
            </div>

            {submitMessage.text && (
              <div className={`p-3 rounded-xl text-xs sm:text-sm font-medium ${
                submitMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {submitMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !suggestion.trim()}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-xs sm:text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Aspirasi'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
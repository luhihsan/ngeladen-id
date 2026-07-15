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

// --- INTERFACE MANIFES DATA RAPOR ANGGOTA ---
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
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800 font-normal w-full">
      
      {/* BANNER UTAMA: Greeting Personal & Badge Sinkron Terkunci */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden w-full">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-indigo-100 to-cyan-50 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-3">
          
          {/* Baris Flexbox Fleksibel Pengunci Posisi Judul Nama & Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Selamat datang, <span className="text-indigo-600">{user?.fullName}</span>!
            </h1>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide shrink-0 ${
              user?.status === 'Aktif' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {user?.status || 'Aktif'}
            </span>
          </div>
          
          <p className="text-sm text-slate-600 font-normal">
            Membuka dashboard sebagai pengurus pengurus <span className="text-slate-800 font-medium uppercase">{user?.role}</span> Pancatama dalam sistem Ngeladen.id.
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
            <div className="mt-1.5 text-xs text-rose-700 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
              {personalAlerts.spCount > 0 && <span>• {personalAlerts.spCount} Surat Peringatan (SP)</span>}
              {personalAlerts.unpaidKas > 0 && <span>• Tunggakan Kas: {formatRupiah(personalAlerts.unpaidKas)}</span>}
              {personalAlerts.unpaidFines > 0 && <span>• Denda Belum Lunas: {formatRupiah(personalAlerts.unpaidFines)}</span>}
            </div>
          </div>
          <a href="#rincian-tanggungan" className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-xs font-medium shadow-sm transition-colors shrink-0 cursor-pointer">
            Lihat Rincian di Bawah ↓
          </a>
        </div>
      )}

      {/* PANEL UTAMA KARTU REKAPITULASI DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Kas Utama Organisasi Pemuda</p>
          <p className="text-2xl font-semibold mt-1 text-slate-900 tracking-tight">{formatRupiah(kasUtamaPemuda)}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-normal">Transparansi kas riil diluar pos anggaran infak</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Agenda Kegiatan</p>
          <p className="text-2xl font-semibold mt-1 text-slate-900 tracking-tight">{meetings.length} Rapat</p>
          <p className="text-[11px] text-slate-500 mt-1 font-normal">Jumlah arsip musyawarah terjadwal</p>
        </div>

        {isAnggotaBiasa ? (
          <div className={`${personalAlerts && (personalAlerts.unpaidKas > 0 || personalAlerts.unpaidFines > 0) ? 'bg-amber-50/80 border-amber-200' : 'bg-emerald-50/50 border-emerald-200'} border rounded-xl p-5 shadow-sm transition-colors`}>
            <p className={`text-xs font-medium uppercase tracking-wider ${personalAlerts && (personalAlerts.unpaidKas > 0 || personalAlerts.unpaidFines > 0) ? 'text-amber-700' : 'text-emerald-700'}`}>Estimasi Kewajiban Kas</p>
            <p className={`text-2xl font-semibold mt-1 tracking-tight ${personalAlerts && (personalAlerts.unpaidKas > 0 || personalAlerts.unpaidFines > 0) ? 'text-amber-800' : 'text-emerald-800'}`}>
              {personalAlerts ? formatRupiah(personalAlerts.unpaidKas + personalAlerts.unpaidFines) : 'Rp 0'}
            </p>
            <p className={`text-[11px] mt-1 font-normal ${personalAlerts && (personalAlerts.unpaidKas > 0 || personalAlerts.unpaidFines > 0) ? 'text-amber-600' : 'text-emerald-600'}`}>
              {personalAlerts && (personalAlerts.unpaidKas > 0 || personalAlerts.unpaidFines > 0) ? 'Silakan lunasi ke Bendahara' : 'Anda bersih dari tunggakan'}
            </p>
          </div>
        ) : (
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-indigo-700 font-medium uppercase tracking-wider">Total Anggota Terdata</p>
            <p className="text-2xl font-semibold mt-1 text-indigo-900 tracking-tight">{totalAnggota !== null ? `${totalAnggota} Jiwa` : '--'}</p>
            <p className="text-[11px] text-indigo-600 mt-1 font-normal">Hak akses pengarsipan data milik internal inti</p>
          </div>
        )}
      </div>

      {/* REVISI PREMIUM UI: AREA GRID RINCIAN TANGGUNGAN INTEGRASI PRIBADI KONTRAS TINGGI */}
      {isAnggotaBiasa && hasAlerts && personalRecords && (
        <div id="rincian-tanggungan" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full scroll-mt-24 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">Rincian Tanggungan & Dokumen Peringatan</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-tight">
              Akses Rapor Pribadi
            </span>
          </div>
          
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
            
            {/* Blok Sub-List Dokumen Surat Peringatan */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Arsip Surat Peringatan ({personalRecords?.suratPeringatan?.length || 0})</h4>
                  {personalRecords && personalRecords.suratPeringatan.length >= 3 && (
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md uppercase tracking-tight">Pemberhentian</span>
                  )}
                </div>
                
                {!personalRecords || personalRecords.suratPeringatan.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center text-xs text-slate-400 font-normal">
                    Bersih. Anda tidak memiliki riwayat Surat Peringatan resmi.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {personalRecords.suratPeringatan.map((sp, idx) => (
                      /* Mengubah bg menjadi putih bersih dengan border abu-abu agar kontrasnya naik tajam */
                      <div key={sp._id} className="p-4 border border-slate-200 bg-white rounded-xl relative shadow-2xs hover:border-slate-300 transition-all">
                        <div className="flex justify-between items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-700 text-xs px-2 py-0.5 bg-rose-50 border border-rose-200 rounded-md">
                              {sp.spNumber}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            {sp.createdAt ? new Date(sp.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-slate-700 font-normal leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                          <span className="font-semibold text-slate-900 block mb-0.5">Alasan Pelanggaran:</span>
                          {sp.reason}
                        </div>
                        
                        {sp.fileUrl && (
                          <div className="flex justify-end pt-1">
                            {/* MENGGUNAKAN INLINE STYLE: Memaksa warna latar belakang Indigo dan teks putih mutlak */}
                            <a 
                              href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${sp.fileUrl}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                backgroundColor: '#4f46e5', 
                                color: '#ffffff', 
                                padding: '8px 14px', 
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                              }}
                              className="hover:opacity-90 transition-opacity cursor-pointer"
                            >
                              {/* LOCK SVG: Ukuran ikon dikunci paksa di 14px murni lewat inline style style */}
                              <svg 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="#ffffff" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                style={{ width: '14px', height: '14px', minWidth: '14px', minHeight: '14px', display: 'block' }}
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              <span style={{ color: '#ffffff' }}>Unduh Dokumen Berita Acara</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            {/* Blok Sub-List Dokumen Tagihan Finansial (Kas Wajib & Denda) */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Kewajiban Belum Dibayar ({personalRecords.mandatoryFees.length + personalRecords.fines.length})</h4>
              
              {personalRecords.mandatoryFees.length === 0 && personalRecords.fines.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center text-xs text-slate-400 font-normal">
                  Lunas. Anda bersih dari tunggakan kas bulanan maupun denda organisasi.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {personalRecords.mandatoryFees.map(kas => (
                    <div key={kas._id} className="flex justify-between items-center p-3.5 border border-amber-200 bg-amber-50/10 rounded-xl shadow-3xs">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Tunggakan Kas Bulanan Wajib</p>
                        <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Periode: Bulan {kas.month} {kas.year}</p>
                      </div>
                      <span className="font-mono font-bold text-amber-800 text-sm bg-white px-3 py-1 rounded-lg border border-amber-200 shadow-3xs">{formatRupiah(kas.amount)}</span>
                    </div>
                  ))}
                  {personalRecords.fines.map(fine => (
                    <div key={fine._id} className="flex justify-between items-center p-3.5 border border-amber-200 bg-amber-50/10 rounded-xl shadow-3xs">
                      <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-2">{fine.reason}</p>
                        <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Tanggal Denda: {new Date(fine.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className="font-mono font-bold text-amber-800 text-sm bg-white px-3 py-1 rounded-lg border border-amber-200 shadow-3xs">{formatRupiah(fine.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      {/* --- END OF BLOK BARU --- */}

      {/* CONTAINER STRUKTUR BOTTOM GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
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
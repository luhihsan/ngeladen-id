// frontend/app/dashboard/sekretariat/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';
import dynamic from 'next/dynamic';

// Import Tiptap secara dinamis dengan mematikan SSR demi stabilitas Turbopack
const TiptapEditor = dynamic(
  () => import('./TiptapEditor'),
  {
    ssr: false,
    loading: () => <div className="min-h-[280px] bg-slate-50 animate-pulse rounded-lg border border-slate-200" />
  }
);

interface Meeting {
  _id: string;
  title: string;
  date: string;
  isRoutine: boolean;
  notes: string; 
  host: string;
  createdBy?: {
    fullName: string;
  };
}

export default function SekretariatPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [filterRoutine, setFilterRoutine] = useState<'Rutin' | 'Insidental'>('Rutin');
  const [filterTime, setFilterTime] = useState<'Selesai' | 'AkanDatang'>('AkanDatang');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', date: '', isRoutine: true, host: '' });
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [notesText, setNotesText] = useState('');
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false);

  // Fungsi pembacaan localStorage yang aman dari crash SSR/Next.js
  const safeGetUserInfo = () => {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem('userInfo');
    if (!stored || stored === 'undefined' || stored.trim() === '') return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  };

  useEffect(() => {
    const role = safeGetUserInfo().role;
    setUserRole(role || '');
    loadMeetings();
  }, []);

  useEffect(() => {
    const today = new Date();
    let result = [...meetings];

    result = result.filter(m => filterRoutine === 'Rutin' ? m.isRoutine === true : m.isRoutine === false);

    if (filterTime === 'Selesai') {
      result = result.filter(m => new Date(m.date) <= today);
    } else {
      result = result.filter(m => new Date(m.date) > today);
    }

    setFilteredMeetings(result);
  }, [meetings, filterRoutine, filterTime]);

  const loadMeetings = async () => {
    try {
      const data = await fetchAPI('/meetings', { method: 'GET' });
      setMeetings(data || []);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat jadwal rapat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpinRoulette = async () => {
    setIsRouletteSpinning(true);
    setCreateForm(prev => ({ ...prev, host: 'Mengacak undian...' }));
    
    setTimeout(async () => {
      try {
        const res = await fetchAPI('/meetings/random-host', { method: 'GET' });
        setCreateForm(prev => ({ ...prev, host: res.host }));
      } catch (err: any) {
        alert(err.message || 'Gagal mengacak anggota. Pastikan ada anggota aktif di database.');
        setCreateForm(prev => ({ ...prev, host: '' }));
      } finally {
        setIsRouletteSpinning(false);
      }
    }, 1200);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.date) return;

    setIsSubmittingMeeting(true);
    try {
      await fetchAPI('/meetings', {
        method: 'POST',
        body: JSON.stringify(createForm)
      });
      setIsCreateOpen(false);
      setCreateForm({ title: '', date: '', isRoutine: true, host: '' });
      loadMeetings();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan jadwal rapat');
    } finally {
      setIsSubmittingMeeting(false);
    }
  };

  const handleOpenNotes = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setNotesText(meeting.notes || '');
    setIsNotesOpen(true);
  };

  const handleNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    setIsSubmittingNotes(true);
    try {
      await fetchAPI(`/meetings/${selectedMeeting._id}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes: notesText })
      });
      setIsNotesOpen(false);
      loadMeetings();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan notulensi');
    } finally {
      setIsSubmittingNotes(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus agenda rapat ini beserta seluruh arsip hasil notulensinya?')) {
      try {
        await fetchAPI(`/meetings/${id}`, { method: 'DELETE' });
        loadMeetings();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus agenda rapat');
      }
    }
  };

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse font-normal">Memuat modul sekretariat...</div>;

  const isAuthorized = userRole === 'Sekretaris';

  return (
    /* PERBAIKAN UTAMA: Menggunakan w-full dan padding horizontal normal agar dashboard melar penuh kiri-kanan */
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800 font-normal w-full px-4 md:px-8 py-2">
      
      {/* Custom Styling untuk Menjamin Kompatibilitas Output Class Tiptap */}
      <style>{`
        .ProseMirror {
          min-height: 260px;
          max-height: 420px;
          overflow-y: auto;
          outline: none;
          padding: 1rem;
          font-size: 0.875rem;
          line-height: 1.625;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
      `}</style>

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Sekretariat & Pertemuan Organisasi</h1>
          <p className="text-sm text-slate-600 mt-0.5">Penjadwalan rapat pemuda, rotasi ketempatan adil, dan pengarsipan risalah notulensi digital.</p>
        </div>
        {isAuthorized && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
          >
            + Jadwalkan Rapat Baru
          </button>
        )}
      </div>

      {/* Filter Antarmuka */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-5 items-center shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Klasifikasi:</span>
          <div className="flex gap-2 text-xs">
            <button 
              type="button" 
              onClick={() => setFilterRoutine('Rutin')} 
              className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                filterRoutine === 'Rutin' 
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-500 shadow-2xs font-semibold' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Rapat Rutin
            </button>
            <button 
              type="button" 
              onClick={() => setFilterRoutine('Insidental')} 
              className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                filterRoutine === 'Insidental' 
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-500 shadow-2xs font-semibold' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Insidental
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Masa Agenda:</span>
          <div className="flex gap-2 text-xs">
            <button 
              type="button" 
              onClick={() => setFilterTime('AkanDatang')} 
              className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                filterTime === 'AkanDatang' 
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-500 shadow-2xs font-semibold' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Akan Datang
            </button>
            <button 
              type="button" 
              onClick={() => setFilterTime('Selesai')} 
              className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                filterTime === 'Selesai' 
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-500 shadow-2xs font-semibold' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Sudah Selesai
            </button>
          </div>
        </div>
      </div>

      {/* Daftar Kartu Pertemuan Rapat */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredMeetings.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-500 font-medium text-sm">
              Tidak ada agenda pertemuan rapat yang sesuai dengan kriteria filter saat ini.
            </div>
          ) : (
            filteredMeetings.map((meeting) => (
              <div key={meeting._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between gap-4 animate-in fade-in duration-200">
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider bg-slate-50 text-slate-700 border-slate-200">
                      {meeting.isRoutine ? 'Rapat Rutin' : 'Insidental'}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {new Date(meeting.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-900 text-base mt-3 tracking-tight leading-tight">{meeting.title}</h4>
                  
                  {meeting.host && (
                    <p className="text-xs text-slate-600 mt-1.5 font-normal">
                      📍 Lokasi Ketempatan: <span className="text-slate-900 font-medium">{meeting.host}</span>
                    </p>
                  )}

                  <div className="mt-3 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Hasil Pembahasan Notulensi:</p>
                    {meeting.notes ? (
                      <div 
                        className="text-sm text-slate-700 font-normal prose max-w-none break-words leading-relaxed text-left"
                        dangerouslySetInnerHTML={{ __html: meeting.notes }}
                      />
                    ) : (
                      <p className="text-xs text-slate-400 italic font-normal">Belum ada dokumen notulensi yang diinput oleh sekretaris pemuda.</p>
                    )}
                  </div>
                </div>

                {isAuthorized && (
                  <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      onClick={() => handleDeleteMeeting(meeting._id)}
                      className="px-3 py-1.5 bg-slate-50 text-red-600 border border-slate-200 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Hapus Rapat
                    </button>
                    <button
                      onClick={() => handleOpenNotes(meeting)}
                      className="px-3 py-1.5 bg-slate-50 text-indigo-700 border border-slate-200 hover:bg-indigo-50/50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      {meeting.notes ? 'Edit Notulensi' : 'Isi Notulensi'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- MODAL BUAT AGENDA JADWAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">Buat Agenda Pertemuan Baru</h3>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-sm font-normal">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nama / Pembahasan Rapat</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Pleno Sinoman Pernikahan"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal Rapat</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none"
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sifat Klasifikasi</label>
                  <select
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal"
                    value={createForm.isRoutine ? 'true' : 'false'}
                    onChange={(e) => setCreateForm({ ...createForm, isRoutine: e.target.value === 'true' })}
                  >
                    <option value="true">Rapat Rutin Bulanan</option>
                    <option value="false">Insidental (Kondisional)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Petugas Tuan Rumah (Host Ketempatan)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama warga atau gunakan roulette"
                    disabled={isRouletteSpinning}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none disabled:bg-slate-50"
                    value={createForm.host}
                    onChange={(e) => setCreateForm({ ...createForm, host: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={handleSpinRoulette}
                    disabled={isRouletteSpinning}
                    className="px-4 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {isRouletteSpinning ? 'Mengacak...' : 'Undi Roulette'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer">
                  Batal
                </button>
                <button type="submit" disabled={isSubmittingMeeting || isRouletteSpinning || !createForm.title} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
                  {isSubmittingMeeting ? 'Menyimpan...' : 'Simpan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL NOTULENSI --- */}
      {isNotesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">Notulensi Hasil Pertemuan Rapat</h3>
              <p className="text-xs text-slate-500 mt-0.5">Agenda: <span className="font-medium text-slate-700">{selectedMeeting?.title}</span></p>
            </div>
            
            <form onSubmit={handleNotesSubmit} className="p-5 flex-1 overflow-y-auto flex flex-col justify-between items-stretch space-y-4">
              <div className="space-y-2 flex-1 flex flex-col items-stretch">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider shrink-0">Catatan Hasil Pembahasan</label>
                
                <div className="flex-1 flex flex-col items-stretch min-h-[280px]">
                  <TiptapEditor 
                    value={notesText}
                    onChange={setNotesText}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end shrink-0">
                <button type="button" onClick={() => setIsNotesOpen(false)} className="px-5 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-xs font-medium transition-colors border-0 cursor-pointer">
                  Batal
                </button>
                <button type="submit" disabled={isSubmittingNotes} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 border-0 cursor-pointer">
                  {isSubmittingNotes ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
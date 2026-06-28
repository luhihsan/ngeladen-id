// frontend/app/dashboard/sekretariat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '@/utils/api';

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
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- State Modal Buat Jadwal Rapat ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', date: '', isRoutine: false, host: '' });
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);

  // --- State Modal Isi Notulensi ---
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [notesText, setNotesText] = useState('');
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    setUserRole(role || '');
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const data = await fetchAPI('/meetings', { method: 'GET' });
      setMeetings(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat jadwal rapat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpinRoulette = async () => {
    setIsRouletteSpinning(true);
    setCreateForm(prev => ({ ...prev, host: '🎰 Memutar Undian...' }));
    
    setTimeout(async () => {
      try {
        const res = await fetchAPI('/meetings/random-host', { method: 'GET' });
        setCreateForm(prev => ({ ...prev, host: res.host }));
      } catch (err: any) {
        alert(err.message || 'Gagal mengacak anggota. Pastikan ada anggota aktif di DB.');
        setCreateForm(prev => ({ ...prev, host: '' }));
      } finally {
        setIsRouletteSpinning(false);
      }
    }, 1500);
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
      setCreateForm({ title: '', date: '', isRoutine: false, host: '' });
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

  const execEditorCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setNotesText(editorRef.current.innerHTML);
    }
  };

  const handleNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    const htmlContent = editorRef.current ? editorRef.current.innerHTML : notesText;

    setIsSubmittingNotes(true);
    try {
      await fetchAPI(`/meetings/${selectedMeeting._id}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes: htmlContent })
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

  if (isLoading) return <div className="p-4 text-center text-slate-500 animate-pulse">Memuat modul sekretariat...</div>;

  // REVISI LOCK AKSES: Hanya Sekretaris yang bisa melakukan aksi penulisan/modifikasi
  const isAuthorized = userRole === 'Sekretaris';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sekretariat & Rapat Rutin</h1>
          <p className="text-sm text-slate-500">Penjadwalan rapat pemuda, sistem roulette ketempatan, dan arsip notulensi digital</p>
        </div>
        {isAuthorized && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5"
          >
            + Jadwalkan Rapat
          </button>
        )}
      </div>

      {/* Agenda Rapat List */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-lg">Agenda Rapat Organisasi</h3>
        {meetings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">Belum ada agenda rapat yang dibuat.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {meetings.map((meeting) => (
              <div key={meeting._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      meeting.isRoutine ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {meeting.isRoutine ? 'Rapat Rutin' : 'Rapat Insidental'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(meeting.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-lg mt-3 leading-tight">{meeting.title}</h4>
                  
                  {meeting.host && (
                    <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                      <span>📍 Ketempatan:</span> <strong className="text-slate-800">{meeting.host}</strong>
                    </p>
                  )}

                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Hasil Notulensi Rapat:</p>
                    {meeting.notes ? (
                      <div 
                        className="text-sm text-slate-700 font-medium prose max-w-none break-words"
                        dangerouslySetInnerHTML={{ __html: meeting.notes }}
                      />
                    ) : (
                      <p className="text-sm text-slate-400 italic">Belum ada notulensi yang diinput oleh sekretaris.</p>
                    )}
                  </div>
                </div>

                {isAuthorized && (
                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      onClick={() => handleDeleteMeeting(meeting._id)}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-xl transition-colors"
                    >
                      Hapus Rapat
                    </button>
                    <button
                      onClick={() => handleOpenNotes(meeting)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-bold text-xs rounded-xl transition-colors border border-transparent hover:border-indigo-100"
                    >
                      {meeting.notes ? 'Edit Notulensi' : 'Isi Notulensi'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL BUAT JADWAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Buat Agenda Rapat</h3>
              <p className="text-xs text-slate-500 mt-1">Atur tanggal dan pilih petugas/tuan rumah rapat</p>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama / Agenda Rapat</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Pleno Kerja Bakti"
                  className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl outline-none font-medium"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Rapat</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl outline-none font-medium"
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Sifat Agenda</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl outline-none font-medium"
                    value={createForm.isRoutine ? 'true' : 'false'}
                    onChange={(e) => setCreateForm({ ...createForm, isRoutine: e.target.value === 'true' })}
                  >
                    <option value="false">Insidental (Kondisional)</option>
                    <option value="true">Rapat Rutin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Petugas / Tempat Rapat (Host)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ketik nama atau gunakan roulette 🎰"
                    disabled={isRouletteSpinning}
                    className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl outline-none font-medium text-sm disabled:opacity-60"
                    value={createForm.host}
                    onChange={(e) => setCreateForm({ ...createForm, host: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={handleSpinRoulette}
                    disabled={isRouletteSpinning}
                    className="px-4 bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold rounded-xl text-sm shadow-md hover:from-amber-600 hover:to-orange-500 disabled:opacity-50 transition-all flex items-center justify-center"
                  >
                    🎰 Acak
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" disabled={isSubmittingMeeting || isRouletteSpinning || !createForm.title} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700">
                  {isSubmittingMeeting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL NOTULENSI --- */}
      {isNotesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Notulensi Hasil Rapat</h3>
              <p className="text-xs text-slate-500 mt-1">Rapat: <span className="font-semibold text-slate-800">{selectedMeeting?.title}</span></p>
            </div>
            
            <form onSubmit={handleNotesSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan Hasil Pembahasan</label>
                
                <div className="bg-slate-100 border border-slate-200 border-b-0 rounded-t-xl p-2 flex flex-wrap gap-1 items-center">
                  <button type="button" onClick={() => execEditorCommand('bold')} className="p-1.5 hover:bg-slate-200 text-slate-700 rounded font-bold text-sm" title="Tebal (Bold)">B</button>
                  <button type="button" onClick={() => execEditorCommand('italic')} className="p-1.5 hover:bg-slate-200 text-slate-700 rounded italic text-sm" title="Miring (Italic)">I</button>
                  <button type="button" onClick={() => execEditorCommand('underline')} className="p-1.5 hover:bg-slate-200 text-slate-700 rounded underline text-sm" title="Garis Bawah (Underline)">U</button>
                  <div className="h-4 w-[1px] bg-slate-300 mx-1" />
                  <button type="button" onClick={() => execEditorCommand('justifyLeft')} className="p-1.5 hover:bg-slate-200 text-slate-700 rounded" title="Rata Kiri">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" /></svg>
                  </button>
                  <button type="button" onClick={() => execEditorCommand('justifyCenter')} className="p-1.5 hover:bg-slate-200 text-slate-700 rounded" title="Rata Tengah">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h12M4 18h16" /></svg>
                  </button>
                  <button type="button" onClick={() => execEditorCommand('justifyRight')} className="p-1.5 hover:bg-slate-200 text-slate-700 rounded" title="Rata Kanan">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" /></svg>
                  </button>
                  <button type="button" onClick={() => execEditorCommand('justifyFull')} className="p-1.5 hover:bg-slate-200 text-slate-700 rounded" title="Rata Kanan Kiri">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  <div className="h-4 w-[1px] bg-slate-300 mx-1" />
                  <button type="button" onClick={() => execEditorCommand('insertUnorderedList')} className="p-1.5 hover:bg-slate-200 text-slate-700 rounded font-bold text-xs" title="Bullet List">• List</button>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="w-full min-h-[180px] max-h-[300px] overflow-auto px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-b-xl outline-none font-medium text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 prose"
                  dangerouslySetInnerHTML={{ __html: notesText }}
                  onBlur={(e) => setNotesText(e.currentTarget.innerHTML)}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsNotesOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" disabled={isSubmittingNotes} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700">
                  {isSubmittingNotes ? 'Menyimpan...' : 'Simpan Notulensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
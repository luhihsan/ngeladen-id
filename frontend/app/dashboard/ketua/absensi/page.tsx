// frontend/app/dashboard/ketua/absensi/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';

interface Member {
  _id: string;
  fullName: string;
  role: string;
  status: string;
}

interface AttendanceRecord {
  user: string;
  fullName: string;
  status: 'Hadir' | 'Alpa' | 'Izin';
}

interface Meeting {
  _id: string;
  title: string;
  date: string;
}

export default function RekapAbsensiRapatPage() {
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // BARU: State Penguncian Edit Kontrol Antarmuka (Pencegah Kegeser di HP)
  const [isEditing, setIsEditing] = useState(false);

  // BARU: State Modal Konfirmasi Ganda Sebelum Simpan
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // BARU: States Filter Pertemuan Utama & Waktu Jurnal
  const [meetingTab, setMeetingTab] = useState<'Selesai' | 'AkanDatang'>('Selesai');
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString()); // Default: Bulan Berjalan (Juli)
  const [filterYear, setFilterYear] = useState('2026'); // Mengikuti tahun kalender sistem

  const currentYear = 2026;
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const monthOptions = [
    { val: '1', label: 'Januari' }, { val: '2', label: 'Februari' }, { val: '3', label: 'Maret' },
    { val: '4', label: 'April' }, { val: '5', label: 'Mei' }, { val: '6', label: 'Juni' },
    { val: '7', label: 'Juli' }, { val: '8', label: 'Agustus' }, { val: '9', label: 'September' },
    { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' }
  ];

  useEffect(() => {
    initAbsensiPage();
  }, []);

  // BARU: Jalankan auto-select rapat bulan berjalan setelah data master berhasil dimuat
  useEffect(() => {
    if (allMeetings.length > 0 && activeMembers.length > 0) {
      applyMeetingFiltersAndAutoSelect();
    }
  }, [allMeetings, meetingTab, filterMonth, filterYear, activeMembers]);

  useEffect(() => {
    if (selectedMeetingId) {
      loadAttendanceForMeeting(selectedMeetingId);
      setIsEditing(false); // Otomatis kunci status setiap kali ketua berpindah agenda rapat
    }
  }, [selectedMeetingId]);

  const initAbsensiPage = async () => {
    try {
      const [meetingsData, usersData] = await Promise.all([
        fetchAPI('/meetings', { method: 'GET' }),
        fetchAPI('/users', { method: 'GET' })
      ]);
      
      setAllMeetings(meetingsData);
      const actives = usersData.filter((u: Member) => u.status === 'Aktif');
      setActiveMembers(actives);
    } catch (err) {
      console.error('Gagal menginisialisasi data pendukung absensi');
    }
  };

  // BARU: Logika Pemilahan Rapat & Otomatisasi Seleksi Bulan Berjalan (Juli)
  const applyMeetingFiltersAndAutoSelect = () => {
    const todayStr = new Date('2026-07-07').toISOString().split('T')[0]; // Menyesuaikan tanggal sistem berjalan
    const today = new Date(todayStr);

    let result = allMeetings.filter(m => {
      const meetingDate = new Date(m.date);
      if (meetingTab === 'Selesai') {
        // Harus rapat yang sudah lewat atau hari ini
        const isPast = meetingDate <= today;
        const matchMonth = filterMonth ? (meetingDate.getMonth() + 1 === parseInt(filterMonth)) : true;
        const matchYear = filterYear ? (meetingDate.getFullYear() === parseInt(filterYear)) : true;
        return isPast && matchMonth && matchYear;
      } else {
        // Rapat yang akan datang
        return meetingDate > today;
      }
    });

    setFilteredMeetings(result);

    // Otomatis tandai/pilih rapat pertama yang cocok dengan bulan berjalan jika ketua belum memilih manual
    if (result.length > 0) {
      const currentMonthMeeting = result.find(m => new Date(m.date).getMonth() + 1 === new Date('2026-07-07').getMonth() + 1);
      if (currentMonthMeeting) {
        setSelectedMeetingId(currentMonthMeeting._id);
      } else {
        setSelectedMeetingId(result[0]._id);
      }
    } else {
      setSelectedMeetingId('');
      setAttendanceRecords([]);
    }
  };

  const loadAttendanceForMeeting = async (meetingId: string) => {
    try {
      const res = await fetchAPI(`/meeting-attendance?meetingId=${meetingId}`, { method: 'GET' });
      
      if (res && res.records && res.records.length > 0) {
        const mappedRecords = activeMembers.map(m => {
          const savedRow = res.records.find((r: any) => r.user === m._id);
          return {
            user: m._id,
            fullName: m.fullName,
            status: savedRow ? savedRow.status : 'Hadir'
          };
        });
        setAttendanceRecords(mappedRecords);
      } else {
        const defaultRecords = activeMembers.map(m => ({
          user: m._id,
          fullName: m.fullName,
          status: 'Hadir' as const
        }));
        setAttendanceRecords(defaultRecords);
      }
    } catch (err) {
      console.error('Gagal memuat draf log absensi');
    }
  };

  const handleSetAllHadir = () => {
    if (!isEditing) return;
    setAttendanceRecords(prev => prev.map(r => ({ ...r, status: 'Hadir' })));
  };

  const handleStatusRowChange = (userId: string, statusValue: 'Hadir' | 'Alpa' | 'Izin') => {
    if (!isEditing) return; // Kunci mutasi jika mode edit belum dinyalakan ketua
    setAttendanceRecords(prev => prev.map(r => r.user === userId ? { ...r, status: statusValue } : r));
  };

  // Trigger buka modal ganda konfirmasi
  const handleTriggerConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingId) return;
    setIsConfirmModalOpen(true);
  };

  const handleSaveAttendanceExecute = async () => {
    setIsConfirmModalOpen(false);
    setIsSubmitting(true);
    try {
      await fetchAPI('/meeting-attendance/save', {
        method: 'POST',
        body: JSON.stringify({ 
          meetingId: selectedMeetingId, 
          records: attendanceRecords.map(r => ({ user: r.user, status: r.status }))
        })
      });
      setIsEditing(false); // Matikan kembali mode edit setelah data tersimpan aman
      alert('Rekapitulasi absensi rapat rutin berhasil disimpan ke sistem pembukuan.');
    } catch (err: any) {
      alert(err.message || 'Gagal merekam data absensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800 font-normal max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Rekapitulasi Absensi Rapat</h1>
        <p className="text-sm text-slate-500 mt-0.5">Sinkronisasi tanda tangan fisik ke sistem digital. Status Alpa otomatis dihitung sebagai tunggakan kas bulanan.</p>
      </div>

      {/* KLASSIFIKASI FILTER AGENDAs CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
        {/* Tab Utama: Selesai vs Akan Datang */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit text-xs">
          <button type="button" onClick={() => setMeetingTab('AkanDatang')} className={`px-4 py-2 rounded-md font-medium transition-all ${meetingTab === 'AkanDatang' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
            Rapat Akan Datang
          </button>
          <button type="button" onClick={() => setMeetingTab('Selesai')} className={`px-4 py-2 rounded-md font-medium transition-all ${meetingTab === 'Selesai' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
            Rapat Sudah Selesai
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 pt-1">
          {/* Sub-Filter Bulan & Tahun (Hanya muncul jika tab Rapat Sudah Selesai menyala) */}
          {meetingTab === 'Selesai' && (
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="w-36">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Bulan Jurnal</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                  <option value="">Semua Bulan</option>
                  {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
              </div>
              <div className="w-28">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Tahun Jurnal</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                  <option value="">Semua Tahun</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Dropdown Hasil Seleksi Agenda Rapat */}
          <div className="flex-1 w-full max-w-md">
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Daftar Agenda Pertemuan Ter saring</label>
            <div className="relative">
              <select 
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none appearance-none" 
                value={selectedMeetingId} 
                onChange={e => setSelectedMeetingId(e.target.value)}
              >
                <option value="">-- Pilih Agenda Rapat Pemuda --</option>
                {filteredMeetings.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({new Date(m.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIKS TABEL UTAMA REKAPITULASI */}
      {selectedMeetingId && attendanceRecords.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs animate-in slide-in-from-bottom-2 duration-300">
          
          {/* CONTROL BAR ACTION ATAS TABEL */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 justify-between items-center">
            <div className="text-xs text-slate-600 font-medium">
              Status Operasional: {isEditing ? (
                <span className="text-amber-600 font-semibold animate-pulse">● Mode Edit Terbuka</span>
              ) : (
                <span className="text-slate-500">● Mode Terkunci</span>
              )}
            </div>

            <div className="flex gap-2">
              {/* REVISI LOGIKA UTAMA: Tombol Pengendali Kunci Gembok Edit */}
              {!isEditing ? (
                <button type="button" onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-all shadow-2xs">
                  Buka Kunci / Edit Kehadiran
                </button>
              ) : (
                <>
                  <button type="button" onClick={handleSetAllHadir} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-all">
                    Tandai Semua Hadir
                  </button>
                  <button type="button" onClick={() => { loadAttendanceForMeeting(selectedMeetingId); setIsEditing(false); }} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-500 hover:text-slate-800 rounded-lg text-xs font-medium transition-all">
                    Batal Edit
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Nama Anggota Pemuda</th>
                  <th className="px-6 py-4 text-center w-64">Status Kehadiran Rapat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {attendanceRecords.map(row => (
                  <tr key={row.user} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{row.fullName}</p>
                    </td>
                    <td className="px-6 py-4 flex justify-center">
                      {/* REVISI LOGIKA TOGGLE PILL: Menambahkan properti disabled murni jika isEditing bernilai false */}
                      <div className={`flex rounded-lg p-0.5 w-fit border border-slate-200/50 transition-all ${!isEditing ? 'bg-slate-50 opacity-65 cursor-not-allowed select-none' : 'bg-slate-100'}`}>
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => handleStatusRowChange(row.user, 'Hadir')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            row.status === 'Hadir' 
                              ? 'bg-white text-emerald-600 shadow-xs border border-slate-200/30' 
                              : 'text-slate-500 hover:text-slate-900 disabled:hover:text-slate-500'
                          }`}
                        >
                          Hadir
                        </button>
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => handleStatusRowChange(row.user, 'Izin')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            row.status === 'Izin' 
                              ? 'bg-white text-amber-600 shadow-xs border border-slate-200/30' 
                              : 'text-slate-500 hover:text-slate-900 disabled:hover:text-slate-500'
                          }`}
                        >
                          Izin
                        </button>
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => handleStatusRowChange(row.user, 'Alpa')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            row.status === 'Alpa' 
                              ? 'bg-white text-red-600 shadow-xs border border-slate-200/30' 
                              : 'text-slate-500 hover:text-slate-900 disabled:hover:text-slate-500'
                          }`}
                        >
                          Alpa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* UTILITY FOOTER SUBMIT */}
          {isEditing && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                type="button"
                onClick={handleTriggerConfirmModal}
                disabled={isSubmitting} 
                className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-medium transition-all shadow-xs tracking-wide"
              >
                Simpan Rekap Absensi
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= BARU: MODAL DIALOG KONFIRMASI GANDA BERLAPIS ================= */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl overflow-hidden transform animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">Validasi Data Absensi</h3>
            </div>
            <div className="p-5 text-sm text-slate-600 leading-relaxed font-normal">
              Apakah Anda sudah yakin seluruh isian rekap tanda tangan dari buku fisik rapat bulanan ini sudah benar dan sesuai?
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setIsConfirmModalOpen(false)} 
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
              >
                Kembali
              </button>
              <button 
                type="button" 
                onClick={handleSaveAttendanceExecute} 
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                Ya, Sudah Benar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
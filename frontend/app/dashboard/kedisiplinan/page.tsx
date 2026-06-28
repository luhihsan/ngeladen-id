// frontend/app/dashboard/kedisiplinan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';

interface User {
  _id: string;
  fullName: string;
  role: string;
  gender: 'Laki-laki' | 'Perempuan';
  occupationStatus: 'Pelajar/Mahasiswa' | 'Bekerja';
}

interface Group {
  _id: string;
  name: string;
  members: { _id: string; fullName: string }[];
}

interface Fine {
  _id: string;
  user: { _id: string; fullName: string };
  amount: number;
  reason: string;
  date: string;
  status: string;
}

interface Agenda {
  _id: string;
  title: string;
  date: string;
  type: string;
  fineAmount?: number; 
}

interface KumpulanLegi {
  _id: string;
  date: string;
  location: string;
  assignedGroup: { _id: string; name: string };
}

export default function KedisiplinanPage() {
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState<'kelompok' | 'absensi' | 'denda'>('kelompok');
  const [activeAbsensiCategory, setActiveAbsensiCategory] = useState<'Agenda' | 'KumpulanLegi'>('Agenda');
  const [isLoading, setIsLoading] = useState(true);

  // --- Core States ---
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [kumpulans, setKumpulan] = useState<KumpulanLegi[]>([]);

  // --- States Absensi ---
  const [searchName, setSearchName] = useState('');
  const [genderFilter, setGenderFilter] = useState<'Semua' | 'Laki-laki' | 'Perempuan'>('Semua');
  const [activeAbsenTarget, setActiveAbsenTarget] = useState<{ type: 'Agenda' | 'KumpulanLegi'; id: string; title: string } | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: 'Hadir' | 'Alpa' | 'Izin' }>({});

  // --- Modals States ---
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', members: [] as string[] });

  const [isKumpulanOpen, setIsKumpulanOpen] = useState(false);
  const [kumpulanForm, setKumpulanForm] = useState({ date: '', location: '', assignedGroup: '' });

  const [isFineOpen, setIsFineOpen] = useState(false);
  const [fineForm, setFineForm] = useState({ user: '', amountRaw: '', amountDisplay: '', reason: '', date: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    setUserRole(role || '');
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [usersData, groupsData, finesData, agendasData, kumpulanData] = await Promise.all([
        fetchAPI('/users', { method: 'GET' }),
        fetchAPI('/discipline/groups', { method: 'GET' }),
        fetchAPI('/discipline/fines', { method: 'GET' }),
        fetchAPI('/agendas', { method: 'GET' }),
        fetchAPI('/discipline/kumpulan', { method: 'GET' })
      ]);
      setUsers(usersData);
      setGroups(groupsData);
      setFines(finesData);
      setAgendas(agendasData);
      setKumpulan(kumpulanData);
    } catch (err: any) {
      alert('Gagal sinkronisasi data');
    } finally {
      setIsLoading(false);
    }
  };

  // ================= ABSENSI LOGIC =================
  const handleOpenAbsenPanel = async (type: 'Agenda' | 'KumpulanLegi', id: string, title: string) => {
    setActiveAbsenTarget({ type, id, title });
    setSearchName('');
    setGenderFilter('Semua');
    try {
      const res = await fetchAPI(`/discipline/attendance?type=${type}&refId=${id}`, { method: 'GET' });
      const mappedRecords: { [key: string]: 'Hadir' | 'Alpa' | 'Izin' } = {};
      res.records.forEach((rec: any) => {
        mappedRecords[rec.user] = rec.status;
      });
      setAttendanceRecords(mappedRecords);
    } catch (err) {
      setAttendanceRecords({});
    }
  };

  let targetUsersList = users;
  if (activeAbsenTarget?.type === 'KumpulanLegi') {
    const assignedGroupId = kumpulans.find(k => k._id === activeAbsenTarget.id)?.assignedGroup._id;
    const assignedGroupMembers = groups.find(g => g._id === assignedGroupId)?.members.map(m => m._id) || [];
    targetUsersList = users.filter(u => assignedGroupMembers.includes(u._id));
  }

  const displayedUsersForAbsen = targetUsersList.filter(u => {
    const matchSearch = u.fullName.toLowerCase().includes(searchName.toLowerCase());
    const matchGender = genderFilter === 'Semua' || u.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const handleSelectAllPresent = () => {
    const updated = { ...attendanceRecords };
    displayedUsersForAbsen.forEach(u => { updated[u._id] = 'Hadir'; });
    setAttendanceRecords(updated);
  };

  const handleSaveAttendanceSheet = async () => {
    if (!activeAbsenTarget) return;
    setIsSubmitting(true);
    
    const recordsArray = targetUsersList.map(u => ({
      user: u._id,
      status: attendanceRecords[u._id] || 'Alpa'
    }));

    try {
      await fetchAPI('/discipline/attendance', {
        method: 'POST',
        body: JSON.stringify({
          type: activeAbsenTarget.type,
          refId: activeAbsenTarget.id,
          records: recordsArray,
          eventTitle: activeAbsenTarget.title
        })
      });
      alert('Presensi berhasil dikunci! Denda (jika ada) otomatis masuk ke daftar.');
      setActiveAbsenTarget(null);
      loadInitialData(); 
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan absensi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= CRUD & FORMATTING LOGIC =================
  const handleGroupCheckbox = (userId: string) => {
    setGroupForm(prev => {
      const exists = prev.members.includes(userId);
      return {
        ...prev,
        members: exists ? prev.members.filter(id => id !== userId) : [...prev.members, userId]
      };
    });
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchAPI('/discipline/groups', { method: 'POST', body: JSON.stringify(groupForm) });
      setIsGroupOpen(false);
      loadInitialData();
    } catch (err) { alert('Gagal menyimpan kelompok'); } finally { setIsSubmitting(false); }
  };

  const handleKumpulanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchAPI('/discipline/kumpulan', { method: 'POST', body: JSON.stringify(kumpulanForm) });
      setIsKumpulanOpen(false);
      loadInitialData();
    } catch (err) { alert('Gagal menjadwalkan kumpulan'); } finally { setIsSubmitting(false); }
  };

  const handleFineAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const formattedValue = rawValue ? new Intl.NumberFormat('id-ID').format(Number(rawValue)) : '';
    setFineForm({ ...fineForm, amountRaw: rawValue, amountDisplay: formattedValue });
  };

  const handleFineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(fineForm.amountRaw);
    setIsSubmitting(true);
    try {
      await fetchAPI('/discipline/fines', {
        method: 'POST',
        body: JSON.stringify({ user: fineForm.user, amount: parsedAmount, reason: fineForm.reason, date: fineForm.date })
      });
      setIsFineOpen(false);
      loadInitialData();
    } catch (err) { alert('Gagal mencatat denda'); } finally { setIsSubmitting(false); }
  };

  const handleForwardToTreasurer = async (id: string) => {
    if (window.confirm('Teruskan berkas denda ini ke Bendahara untuk di-ACC?')) {
      try {
        await fetchAPI(`/discipline/fines/${id}/pay`, { method: 'PUT' });
        loadInitialData();
      } catch (err: any) { alert('Gagal menyetorkan dana'); }
    }
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const assignedMemberIds = groups.flatMap(g => g.members.map(m => m._id));
  const availableMen = users.filter(u => u.gender === 'Laki-laki' && !assignedMemberIds.includes(u._id));

  const isKedisiplinan = userRole === 'Kedisiplinan';

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse">Menghubungkan birokrasi kedisiplinan...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Biro Kedisiplinan & Laden</h1>
        <p className="text-sm text-slate-600 mt-1">Otoritas penegakan tata tertib, absensi kegiatan, dan penugasan jatah kelompok</p>
      </div>

      {/* Tabs Menu Utama */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto whitespace-nowrap">
        <button onClick={() => { setActiveTab('kelompok'); setActiveAbsenTarget(null); }} className={`px-4 py-3 text-sm transition-colors border-b-2 ${activeTab === 'kelompok' ? 'font-semibold border-indigo-600 text-indigo-700' : 'font-medium border-transparent text-slate-600 hover:text-slate-800'}`}>
          🎰 Kelompok & Jadwal Legi
        </button>
        <button onClick={() => { setActiveTab('absensi'); setActiveAbsenTarget(null); }} className={`px-4 py-3 text-sm transition-colors border-b-2 ${activeTab === 'absensi' ? 'font-semibold border-indigo-600 text-indigo-700' : 'font-medium border-transparent text-slate-600 hover:text-slate-800'}`}>
          📋 Absensi Sesi Kegiatan
        </button>
        <button onClick={() => { setActiveTab('denda'); setActiveAbsenTarget(null); }} className={`px-4 py-3 text-sm transition-colors border-b-2 ${activeTab === 'denda' ? 'font-semibold border-indigo-600 text-indigo-700' : 'font-medium border-transparent text-slate-600 hover:text-slate-800'}`}>
          💰 Buku Denda
        </button>
      </div>

      {/* TAB KELOMPOK */}
      {activeTab === 'kelompok' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h3 className="font-semibold text-slate-800 text-lg">Manajemen Shift Kumpulan</h3>
            {isKedisiplinan && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setIsKumpulanOpen(true)} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
                  + Jadwalkan Kumpulan
                </button>
                <button onClick={() => { setGroupForm({ name: '', members: [] }); setIsGroupOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  + Buat Kelompok Baru
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kumpulans.map(k => (
              <div key={k._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-xs rounded-md">Shift: {k.assignedGroup?.name}</span>
                  <span className="text-sm font-medium text-slate-600">{new Date(k.date).toLocaleDateString('id-ID')}</span>
                </div>
                <p className="text-sm text-slate-700 font-medium">📍 Lokasi: {k.location}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            {groups.map(group => (
              <div key={group._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="font-semibold text-slate-800 text-base border-b border-slate-100 pb-2">{group.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {group.members.map(m => (
                    <span key={m._id} className="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 font-medium text-sm rounded-md">
                      👤 {m.fullName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB ABSENSI - SUB-TABS */}
      {activeTab === 'absensi' && !activeAbsenTarget && (
        <div className="space-y-6">
          <div className="flex gap-2">
             <button onClick={() => setActiveAbsensiCategory('Agenda')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeAbsensiCategory === 'Agenda' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Agenda Ketua</button>
             <button onClick={() => setActiveAbsensiCategory('KumpulanLegi')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeAbsensiCategory === 'KumpulanLegi' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Kumpulan Minggu Legi</button>
          </div>

          <div className="space-y-3">
            {activeAbsensiCategory === 'Agenda' ? agendas.map(a => (
              <div key={a._id} className="bg-white p-5 border border-slate-200 rounded-xl flex justify-between items-center gap-4 shadow-sm">
                <div>
                  <h4 className="font-semibold text-slate-800 text-base">{a.title}</h4>
                  {/* UPDATE DISINI: Indikator Nominal Denda Muncul di Samping Tanggal */}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <p className="text-sm text-slate-500">{new Date(a.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                    {a.fineAmount && a.fineAmount > 0 ? (
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-semibold">⚠️ Denda Alpa: {formatRupiah(a.fineAmount)}</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded text-xs font-semibold">Bebas Denda</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleOpenAbsenPanel('Agenda', a._id, a.title)} className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium text-sm rounded-lg hover:bg-indigo-600 hover:text-white transition-colors shrink-0">Buka Absen</button>
              </div>
            )) : kumpulans.map(k => (
              <div key={k._id} className="bg-white p-5 border border-slate-200 rounded-xl flex justify-between items-center gap-4 shadow-sm">
                <div>
                  <h4 className="font-semibold text-slate-800 text-base">Shift {k.assignedGroup?.name}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <p className="text-sm text-slate-600">📍 {k.location}</p>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">⚠️ Denda Otomatis (Rp 15k / Rp 25k)</span>
                  </div>
                </div>
                <button onClick={() => handleOpenAbsenPanel('KumpulanLegi', k._id, `Shift ${k.assignedGroup?.name}`)} className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 font-medium text-sm rounded-lg hover:bg-amber-600 hover:text-white transition-colors shrink-0">Buka Absen</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEMBAR INSTRUMEN ABSENSI (MODE PENGISIAN) */}
      {activeTab === 'absensi' && activeAbsenTarget && (
        <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-5 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 gap-4">
            <div>
              <button onClick={() => setActiveAbsenTarget(null)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-1">← Kembali</button>
              <h3 className="font-semibold text-slate-800 text-lg">Presensi: {activeAbsenTarget.title}</h3>
            </div>
            {isSubmitting ? (
              <span className="text-sm text-slate-500 font-medium animate-pulse">Menyimpan data...</span>
            ) : (
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={handleSelectAllPresent} className="flex-1 md:flex-none px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-200 transition-colors">Hadir Semua</button>
                <button onClick={handleSaveAttendanceSheet} className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700 transition-colors">Simpan & Kunci</button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Cari nama anggota..." className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500 font-normal" value={searchName} onChange={e => setSearchName(e.target.value)} />
            {activeAbsenTarget.type === 'Agenda' && (
              <select className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-normal text-slate-800 outline-none focus:border-indigo-500" value={genderFilter} onChange={e => setGenderFilter(e.target.value as any)}>
                <option value="Semua">Semua Gender</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            )}
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-700">Nama Anggota</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedUsersForAbsen.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-slate-800">
                      <span className="font-medium">{u.fullName}</span>
                      <span className="text-slate-500 ml-2 text-xs">({u.gender})</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-center gap-5">
                        {['Hadir', 'Alpa', 'Izin'].map(st => (
                          <label key={st} className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                            <input type="radio" checked={(attendanceRecords[u._id] || 'Alpa') === st} onChange={() => setAttendanceRecords({ ...attendanceRecords, [u._id]: st as any })} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" /> 
                            {st}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB DENDA */}
      {activeTab === 'denda' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h3 className="font-semibold text-slate-800 text-lg">Buku Denda Warga</h3>
            {isKedisiplinan && (
              <button onClick={() => { setFineForm({ user: '', amountRaw: '', amountDisplay: '', reason: '', date: '' }); setIsFineOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                + Input Denda Manual
              </button>
            )}
          </div>
          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Warga</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Nominal</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Keterangan</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  {isKedisiplinan && <th className="px-6 py-4"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map(fine => (
                  <tr key={fine._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-800 font-medium">{fine.user?.fullName}</td>
                    <td className="px-6 py-4 font-semibold text-red-600">{formatRupiah(fine.amount)}</td>
                    <td className="px-6 py-4 text-slate-600">{fine.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${fine.status === 'Lunas' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : fine.status === 'Menunggu Konfirmasi' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {fine.status}
                      </span>
                    </td>
                    {isKedisiplinan && (
                      <td className="px-6 py-4 text-right">
                        {fine.status === 'Belum Bayar' && (
                          <button onClick={() => handleForwardToTreasurer(fine._id)} className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-md hover:bg-indigo-100 transition-colors">
                            Setorkan
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL BUAT KELOMPOK */}
      {isGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">Buat Kelompok Baru</h3>
            </div>
            <form onSubmit={handleGroupSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelompok</label>
                <input required type="text" placeholder="Contoh: Regu 1" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500 font-normal" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Anggota Tim (Laki-laki):</label>
                <div className="max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-3 bg-white space-y-2">
                  {availableMen.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">Semua pria sudah mendapat kelompok.</p> : availableMen.map(u => (
                    <label key={u._id} className="flex items-center gap-3 text-sm font-normal text-slate-800 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                      <input type="checkbox" checked={groupForm.members.includes(u._id)} onChange={() => handleGroupCheckbox(u._id)} className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" /> 
                      {u.fullName}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setIsGroupOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting || !groupForm.name} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">Simpan Kelompok</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL JADWAL KUMPULAN */}
      {isKumpulanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">Jadwalkan Kumpulan Legi</h3>
            </div>
            <form onSubmit={handleKumpulanSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500 font-normal" value={kumpulanForm.date} onChange={e => setKumpulanForm({ ...kumpulanForm, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shift Tugas</label>
                  <select required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500 font-normal" value={kumpulanForm.assignedGroup} onChange={e => setKumpulanForm({ ...kumpulanForm, assignedGroup: e.target.value })}>
                    <option value="">-- Pilih Shift --</option>
                    {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Pertemuan</label>
                <input required type="text" placeholder="Lokasi kumpulan" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500 font-normal" value={kumpulanForm.location} onChange={e => setKumpulanForm({ ...kumpulanForm, location: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setIsKumpulanOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">Jadwalkan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT DENDA MANUAL */}
      {isFineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">Catat Denda Manual</h3>
            </div>
            <form onSubmit={handleFineSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pelanggar</label>
                <select required className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500 font-normal" value={fineForm.user} onChange={e => setFineForm({ ...fineForm, user: e.target.value })}>
                  <option value="">-- Pilih Warga --</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.fullName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                  <input required type="text" placeholder="10.000" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500 font-normal" value={fineForm.amountDisplay} onChange={handleFineAmountChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500 font-normal" value={fineForm.date} onChange={e => setFineForm({ ...fineForm, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Alasan</label>
                <textarea required rows={3} placeholder="Tulis alasan denda..." className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 resize-none outline-none focus:border-indigo-500 font-normal" value={fineForm.reason} onChange={e => setFineForm({ ...fineForm, reason: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setIsFineOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">Simpan Catatan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
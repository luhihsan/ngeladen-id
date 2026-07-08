// frontend/app/dashboard/kedisiplinan/components/AttendanceTab.tsx
'use client';

import { useState } from 'react';

interface User {
  _id: string;
  fullName: string;
  role: string;
  gender: 'Laki-laki' | 'Perempuan';
  occupationStatus: 'Pelajar/Mahasiswa' | 'Bekerja';
}

interface Group {
  _id: string;
  members: { _id: string }[];
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

interface AttendanceTabProps {
  users: User[];
  groups: Group[];
  agendas: Agenda[];
  kumpulans: KumpulanLegi[];
  isSubmitting: boolean;
  onFetchAttendance: (type: 'Agenda' | 'KumpulanLegi', id: string) => Promise<{ [key: string]: 'Hadir' | 'Alpa' | 'Izin' }>;
  onSaveAttendance: (payload: { type: string; refId: string; records: any[]; eventTitle: string }) => Promise<void>;
  formatRupiah: (num: number) => string;
}

export default function AttendanceTab({ users, groups, agendas, kumpulans, isSubmitting, onFetchAttendance, onSaveAttendance, formatRupiah }: AttendanceTabProps) {
  const [category, setCategory] = useState<'Agenda' | 'KumpulanLegi'>('Agenda');
  const [activeTarget, setActiveTarget] = useState<{ type: 'Agenda' | 'KumpulanLegi'; id: string; title: string } | null>(null);
  const [records, setAttendanceRecords] = useState<{ [key: string]: 'Hadir' | 'Alpa' | 'Izin' }>({});

  const [searchName, setSearchName] = useState('');
  const [genderFilter, setGenderFilter] = useState<'Semua' | 'Laki-laki' | 'Perempuan'>('Semua');

  const handleOpenPanel = async (type: 'Agenda' | 'KumpulanLegi', id: string, title: string) => {
    setActiveTarget({ type, id, title });
    setSearchName('');
    setGenderFilter('Semua');
    const data = await onFetchAttendance(type, id);
    setAttendanceRecords(data);
  };

  let targetUsersList = users;
  if (activeTarget?.type === 'KumpulanLegi') {
    const assignedGroupId = kumpulans.find(k => k._id === activeTarget.id)?.assignedGroup._id;
    const assignedGroupMembers = groups.find(g => (g as any)._id === assignedGroupId)?.members.map(m => m._id) || [];
    targetUsersList = users.filter(u => assignedGroupMembers.includes(u._id));
  }

  const displayedUsers = targetUsersList.filter(u => {
    const matchSearch = u.fullName.toLowerCase().includes(searchName.toLowerCase());
    const matchGender = genderFilter === 'Semua' || u.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const handleSelectAllPresent = () => {
    const updated = { ...records };
    displayedUsers.forEach(u => { updated[u._id] = 'Hadir'; });
    setAttendanceRecords(updated);
  };

  const handleSaveSheet = async () => {
    if (!activeTarget) return;
    const recordsArray = targetUsersList.map(u => ({
      user: u._id,
      status: records[u._id] || 'Alpa'
    }));

    await onSaveAttendance({
      type: activeTarget.type,
      refId: activeTarget.id,
      records: recordsArray,
      eventTitle: activeTarget.title
    });
    setActiveTarget(null);
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {!activeTarget ? (
        <>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit text-xs">
            <button onClick={() => setCategory('Agenda')} className={`px-4 py-2 rounded-md font-medium transition-all ${category === 'Agenda' ? 'bg-white text-indigo-600 shadow-3xs border border-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>Agenda Ketua</button>
            <button onClick={() => setCategory('KumpulanLegi')} className={`px-4 py-2 rounded-md font-medium transition-all ${category === 'KumpulanLegi' ? 'bg-white text-indigo-600 shadow-3xs border border-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>Kumpulan Minggu Legi</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {category === 'Agenda' ? agendas.map(a => (
              <div key={a._id} className="bg-white p-5 border border-slate-200 rounded-xl flex flex-col justify-between gap-4 shadow-2xs">
                <div>
                  <h4 className="font-medium text-slate-900 text-sm">{a.title}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500">{new Date(a.date).toLocaleDateString('id-ID', {dateStyle: 'medium'})}</span>
                    {a.fineAmount && a.fineAmount > 0 ? (
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded text-[10px] font-medium">Denda: {formatRupiah(a.fineAmount)}</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded text-[10px] font-medium">Bebas Denda</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleOpenPanel('Agenda', a._id, a.title)} className="w-full py-1.5 bg-slate-50 border border-slate-200 text-indigo-600 rounded-md text-xs font-medium hover:bg-indigo-50 transition-colors">Buka Absen</button>
              </div>
            )) : kumpulans.map(k => (
              <div key={k._id} className="bg-white p-5 border border-slate-200 rounded-xl flex flex-col justify-between gap-4 shadow-2xs">
                <div>
                  <h4 className="font-medium text-slate-900 text-sm">Shift {k.assignedGroup?.name}</h4>
                  <div className="flex flex-col gap-1 mt-2 text-xs text-slate-500">
                    <span>📍 Lokasi: {k.location}</span>
                    <span className="text-amber-600 font-medium">Denda Otomatis (Rp 15k / 25k)</span>
                  </div>
                </div>
                <button onClick={() => handleOpenPanel('KumpulanLegi', k._id, `Shift ${k.assignedGroup?.name}`)} className="w-full py-1.5 bg-slate-50 border border-slate-200 text-amber-700 rounded-md text-xs font-medium hover:bg-amber-50 transition-colors">Buka Absen</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* LEMBAR INSTRUMEN ABSENSI */
        <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4 shadow-2xs w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4 w-full">
            <div>
              <button onClick={() => setActiveTarget(null)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">← Kembali</button>
              <h3 className="font-medium text-slate-900 text-base mt-1">Presensi: {activeTarget.title}</h3>
            </div>
            <div className="flex gap-2 w-full sm:w-auto text-xs">
              <button onClick={handleSelectAllPresent} disabled={isSubmitting} className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-200">Hadir Semua</button>
              <button onClick={handleSaveSheet} disabled={isSubmitting} className="flex-1 sm:flex-none px-4 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Kunci'}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <input type="text" placeholder="Cari nama anggota..." className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-indigo-500" value={searchName} onChange={e => setSearchName(e.target.value)} />
            {activeTarget.type === 'Agenda' && (
              <select className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-indigo-500" value={genderFilter} onChange={e => setGenderFilter(e.target.value as any)}>
                <option value="Semua">Semua Gender</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden w-full">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-6 py-3">Nama Anggota</th>
                  <th className="px-6 py-3 text-center w-64">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {displayedUsers.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-medium text-slate-900">{u.fullName}</span>
                      <span className="text-slate-400 ml-1.5 text-xs font-mono">({u.gender.slice(0,1)})</span>
                    </td>
                    <td className="px-6 py-3.5 flex justify-center">
                      <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/40 text-xs">
                        {(['Hadir', 'Alpa', 'Izin'] as const).map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setAttendanceRecords({ ...records, [u._id]: st })}
                            className={`px-3 py-1 rounded-md font-medium transition-all ${
                              (records[u._id] || 'Alpa') === st 
                                ? 'bg-white text-indigo-600 shadow-3xs' 
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            {st}
                          </button>
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
    </div>
  );
}
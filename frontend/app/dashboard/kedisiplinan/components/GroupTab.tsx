// frontend/app/dashboard/kedisiplinan/components/GroupTab.tsx
'use client';

import { useState } from 'react';

interface User {
  _id: string;
  fullName: string;
  gender: string;
}

interface Group {
  _id: string;
  name: string;
  members: { _id: string; fullName: string }[];
}

interface KumpulanLegi {
  _id: string;
  date: string;
  location: string;
  assignedGroup: { _id: string; name: string };
}

interface GroupTabProps {
  users: User[];
  groups: Group[];
  kumpulans: KumpulanLegi[];
  isKedisiplinan: boolean;
  isSubmitting: boolean;
  onSaveGroup: (groupData: { id?: string; name: string; members: string[] }) => Promise<void>;
  onSaveKumpulan: (kumpulanData: { date: string; location: string; assignedGroup: string }) => Promise<void>;
}

export default function GroupTab({ users, groups, kumpulans, isKedisiplinan, isSubmitting, onSaveGroup, onSaveKumpulan }: GroupTabProps) {
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [groupForm, setGroupForm] = useState({ name: '', members: [] as string[] });

  const [isKumpulanOpen, setIsKumpulanOpen] = useState(false);
  const [kumpulanForm, setKumpulanForm] = useState({ date: '', location: '', assignedGroup: '' });

  // REVISI FILTER SUB-TAB JADWAL: Memilah waktu murni via tombol tab horizontal
  const [kumpulanTimeFilter, setKumpulanTimeFilter] = useState<'AkanDatang' | 'Selesai'>('AkanDatang');

  const openEditGroupModal = (group: Group) => {
    setIsEditMode(true);
    setTargetGroupId(group._id);
    setGroupForm({
      name: group.name,
      members: group.members.map(m => m._id)
    });
    setIsGroupOpen(true);
  };

  const openCreateGroupModal = () => {
    setIsEditMode(false);
    setTargetGroupId('');
    setGroupForm({ name: '', members: [] });
    setIsGroupOpen(true);
  };

  const handleGroupCheckbox = (userId: string) => {
    setGroupForm(prev => {
      const exists = prev.members.includes(userId);
      return {
        ...prev,
        members: exists ? prev.members.filter(id => id !== userId) : [...prev.members, userId]
      };
    });
  };

  const handleGroupFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveGroup({ id: targetGroupId, ...groupForm });
    setIsGroupOpen(false);
  };

  const handleKumpulanFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveKumpulan(kumpulanForm);
    setIsKumpulanOpen(false);
    setKumpulanForm({ date: '', location: '', assignedGroup: '' });
  };

  const assignedMemberIds = groups
    .filter(g => isEditMode ? g._id !== targetGroupId : true)
    .flatMap(g => g.members.map(m => m._id));
    
  const availableMen = users.filter(u => u.gender === 'Laki-laki' && !assignedMemberIds.includes(u._id));

  // Klasifikasi otomatis zona waktu penugasan srawung
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = kumpulans.filter(k => new Date(k.date) >= today);
  const past = kumpulans.filter(k => new Date(k.date) < today);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200 text-slate-800">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div>
          <h3 className="font-semibold text-slate-900 text-lg tracking-tight">Manajemen Shift Kumpulan</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">Penjadwalan ronda srawung berkala dan mutasi jatah anggota kelompok pemuda.</p>
        </div>
        {isKedisiplinan && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={() => setIsKumpulanOpen(true)} className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 transition-colors">
              Jadwalkan Kumpulan
            </button>
            <button onClick={openCreateGroupModal} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
              Buat Kelompok Baru
            </button>
          </div>
        )}
      </div>

      {/* REVISI SUB-TAB TIME SELECTOR: Flat kontras, bebas border semu, border hanya muncul saat berstatus AKTIF */}
      <div className="flex bg-slate-100 p-1 rounded-lg w-fit text-xs font-medium">
        <button 
          type="button"
          onClick={() => setKumpulanTimeFilter('AkanDatang')}
          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
            kumpulanTimeFilter === 'AkanDatang' 
              ? 'bg-white text-indigo-600 border border-indigo-600 shadow-3xs font-semibold' 
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Jadwal Akan Datang ({upcoming.length})
        </button>
        <button 
          type="button"
          onClick={() => setKumpulanTimeFilter('Selesai')}
          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
            kumpulanTimeFilter === 'Selesai' 
              ? 'bg-white text-indigo-600 border border-indigo-600 shadow-3xs font-semibold' 
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Riwayat Selesai ({past.length})
        </button>
      </div>

      {/* CONTAINER MONITORING JADWAL BERDASARKAN TOGGLE TAB SELECTOR */}
      <div className="w-full">
        {kumpulanTimeFilter === 'AkanDatang' ? (
          <div className="space-y-3 w-full">
            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-400 italic font-normal py-3 bg-white border border-slate-200 rounded-xl p-4 text-center">Tidak ada jadwal kumpulan aktif dalam waktu dekat.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {upcoming.map(k => (
                  <div key={k._id} className="bg-white border-l-4 border-l-emerald-500 border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-1.5">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-medium text-[10px] rounded border border-indigo-100">Shift: {k.assignedGroup?.name}</span>
                      <span className="text-xs font-mono text-slate-500">{new Date(k.date).toLocaleDateString('id-ID', {dateStyle: 'medium'})}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-normal">📍 Lokasi: <span className="text-slate-800 font-medium">{k.location}</span></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 w-full">
            {past.length === 0 ? (
              <p className="text-xs text-slate-400 italic font-normal py-3 bg-white border border-slate-200 rounded-xl p-4 text-center">Belum ada riwayat kumpulan yang terlewat.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {past.map(k => (
                  <div key={k._id} className="bg-slate-50/60 border-l-4 border-l-red-400 border border-slate-200 rounded-xl p-4 opacity-75 shadow-2xs">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-medium text-[10px] rounded border border-slate-200">Selesai: {k.assignedGroup?.name}</span>
                      <span className="text-xs font-mono text-slate-400 line-through">{new Date(k.date).toLocaleDateString('id-ID', {dateStyle: 'medium'})}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-normal">📍 Eks Lokasi: <span className="text-slate-700 font-normal">{k.location}</span></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MANIFES GRUP UTAMA: Dijamin aman posisinya tidak akan melorot jauh kebawah lagi */}
      <div className="space-y-4 pt-4 border-t border-slate-200 w-full">
        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Manifes Anggota Per Regu Kelompok</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {groups.map(group => (
            <div key={group._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between min-h-[140px]">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="font-medium text-slate-900 text-sm">{group.name}</h4>
                  {isKedisiplinan && (
                    <button onClick={() => openEditGroupModal(group)} className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">
                      Mutasi Anggota
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.members.map(m => (
                    <span key={m._id} className="px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200/60 font-normal text-xs rounded">
                      {m.fullName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL INPUTS (Lama - Dipertahankan Utuh) */}
      {isGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-semibold text-slate-800">{isEditMode ? `Mutasi Anggota: ${groupForm.name}` : 'Buat Kelompok Baru'}</h3>
            </div>
            <form onSubmit={handleGroupFormSubmit} className="p-5 space-y-4 text-sm font-normal">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Nama Kelompok</label>
                <input required type="text" placeholder="Contoh: Regu 1" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-indigo-500" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Pilih Anggota Tim (Pria Tersedia):</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
                  {availableMen.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">Seluruh warga laki-laki aktif sudah dialokasikan kelompok.</p>
                  ) : availableMen.map(u => (
                    <label key={u._id} className="flex items-center gap-3 text-xs font-normal text-slate-700 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                      <input type="checkbox" checked={groupForm.members.includes(u._id)} onChange={() => handleGroupCheckbox(u._id)} className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" /> 
                      {u.fullName}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsGroupOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Memproses...' : 'Simpan Kelompok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isKumpulanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-semibold text-slate-800">Jadwalkan Kumpulan Legi</h3>
            </div>
            <form onSubmit={handleKumpulanFormSubmit} className="p-5 space-y-4 text-sm font-normal">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Tanggal</label>
                  <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none" value={kumpulanForm.date} onChange={e => setKumpulanForm({ ...kumpulanForm, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Shift Tugas</label>
                  <select required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={kumpulanForm.assignedGroup} onChange={e => setKumpulanForm({ ...kumpulanForm, assignedGroup: e.target.value })}>
                    <option value="">-- Pilih Shift --</option>
                    {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Lokasi Pertemuan</label>
                <input required type="text" placeholder="Contoh: Balai RT 01" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none" value={kumpulanForm.location} onChange={e => setKumpulanForm({ ...kumpulanForm, location: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsKumpulanOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">Jadwalkan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
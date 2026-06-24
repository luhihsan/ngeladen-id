// frontend/app/dashboard/anggota/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';

interface SP {
  _id?: string;
  spNumber: string;
  reason: string;
  fileUrl?: string; 
  createdAt: string;
}

interface UserData {
  _id: string;
  fullName: string;
  role: string;
  status: string;
  statusReason?: string; 
  suratPeringatan: SP[];
}

export default function ManajemenAnggotaPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isSpModalOpen, setIsSpModalOpen] = useState(false);
  const [spForm, setSpForm] = useState({ spNumber: '', reason: '' });
  const [spFile, setSpFile] = useState<File | null>(null);
  const [isSubmittingSp, setIsSubmittingSp] = useState(false);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: 'Aktif', statusReason: '' });
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchAPI('/users', { method: 'GET' });
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openSpModal = (user: UserData) => {
    setSelectedUser(user);
    setSpForm({ spNumber: '', reason: '' });
    setSpFile(null); 
    setIsSpModalOpen(true);
  };

  const handleSubmitSp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmittingSp(true);

    try {
      const formData = new FormData();
      formData.append('spNumber', spForm.spNumber);
      formData.append('reason', spForm.reason);
      if (spFile) {
        formData.append('spDocument', spFile);
      }

      const token = JSON.parse(localStorage.getItem('userInfo') || '{}').token;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_URL}/users/${selectedUser._id}/sp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal menerbitkan SP');

      setIsSpModalOpen(false);
      loadUsers(); 
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingSp(false);
    }
  };

  const openStatusModal = (user: UserData) => {
    setSelectedUser(user);
    setStatusForm({ 
      status: user.status, 
      statusReason: user.statusReason || '' 
    });
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmittingStatus(true);

    try {
      await fetchAPI(`/users/${selectedUser._id}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusForm),
      });
      setIsStatusModalOpen(false);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktif': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pasif': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Keluar': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) return <div className="p-4 text-center text-slate-500 animate-pulse">Memuat data anggota...</div>;
  if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-xl">{error}</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Anggota</h1>
          <p className="text-sm text-slate-500">Kelola status keanggotaan dan Surat Peringatan (SP)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users?.map((user) => (
          <div key={user._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
            
            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold border-l border-b ${getStatusColor(user.status)}`}>
              {user.status}
            </div>

            <div className="flex items-center gap-4 mb-3 mt-2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-100 to-cyan-50 flex items-center justify-center border border-indigo-100 shrink-0">
                <span className="text-indigo-700 font-bold text-lg">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 truncate text-lg leading-tight">{user.fullName}</h3>
                <p className="text-sm font-medium text-indigo-600">{user.role}</p>
              </div>
            </div>

            {user.statusReason && user.status !== 'Aktif' && (
              <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 italic">
                <span className="font-semibold not-italic">Keterangan:</span> {user.statusReason}
              </div>
            )}

            <div className="mt-auto space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total SP Aktif:</span>
                <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                  {user.suratPeringatan?.length || 0}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => openStatusModal(user)}
                  className="flex-1 py-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold transition-colors"
                >
                  Ubah Status
                </button>
                
                <button 
                  onClick={() => openSpModal(user)}
                  className="flex-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl text-sm font-semibold transition-colors"
                >
                  Terbitkan SP
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL UBAH STATUS */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Ubah Status Anggota</h3>
              <p className="text-sm text-slate-500 mt-1">Anggota: <span className="font-semibold text-slate-800">{selectedUser?.fullName}</span></p>
            </div>
            
            <form onSubmit={handleSubmitStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status Keanggotaan</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Pasif">Pasif (Cuti/Keluar Kota)</option>
                  <option value="Keluar">Keluar (Purna/Menikah)</option>
                </select>
              </div>

              {statusForm.status !== 'Aktif' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Keterangan / Alasan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Magang di Jakarta 6 bulan"
                    className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    value={statusForm.statusReason}
                    onChange={(e) => setStatusForm({ ...statusForm, statusReason: e.target.value })}
                  />
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-900 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStatus}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmittingStatus ? 'Menyimpan...' : 'Simpan Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TERBITKAN SP */}
      {isSpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Terbitkan Surat Peringatan</h3>
              <p className="text-sm text-slate-500 mt-1">Untuk: <span className="font-semibold text-slate-800">{selectedUser?.fullName}</span></p>
            </div>
            
            <form onSubmit={handleSubmitSp} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nomor Surat</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SP/RT01/001"
                  className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  value={spForm.spNumber}
                  onChange={(e) => setSpForm({ ...spForm, spNumber: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Alasan Peringatan Singkat</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Tidak hadir kerja bakti"
                  className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                  value={spForm.reason}
                  onChange={(e) => setSpForm({ ...spForm, reason: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Dokumen Lampiran SP</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf"
                    className="block w-full text-sm text-slate-900 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSpFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSpModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-900 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSp}
                  className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isSubmittingSp ? 'Menerbitkan...' : 'Terbitkan SP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
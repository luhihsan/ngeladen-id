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
  username: string;
  fullName: string;
  role: string;
  status: string;
  statusReason?: string; 
  gender: 'Laki-laki' | 'Perempuan';
  occupationStatus: 'Pelajar/Mahasiswa' | 'Bekerja';
  joinDate: string;
  suratPeringatan: SP[];
}

export default function ManajemenAnggotaPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');

  // BARU: State Filter Peran Kategori Pengurus vs Anggota Biasa
  const [roleFilter, setRoleFilter] = useState<'Semua' | 'Pengurus' | 'Anggota'>('Semua');

  // States Modal SP (Lama - Dipertahaman)
  const [isSpModalOpen, setIsSpModalOpen] = useState(false);
  const [spForm, setSpForm] = useState({ spNumber: '', reason: '' });
  const [spFile, setSpFile] = useState<File | null>(null);
  const [isSubmittingSp, setIsSubmittingSp] = useState(false);

  // States Modal Status Keaktifan (Lama - Dipertahankan)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: 'Aktif', statusReason: '' });
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // States Modal CRUD Akun (Lama - Dipertahankan)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [accountForm, setAccountForm] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'Anggota',
    gender: 'Laki-laki',
    occupationStatus: 'Pelajar/Mahasiswa',
    joinDate: ''
  });
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    setCurrentUserRole(role || '');
    loadUsers();
  }, []);

  // BARU: Logic memilah data berdasarkan pilihan filter peran pengurus vs anggota biasa
  useEffect(() => {
    let result = [...users];
    if (roleFilter === 'Pengurus') {
      result = users.filter(u => u.role !== 'Anggota');
    } else if (roleFilter === 'Anggota') {
      result = users.filter(u => u.role === 'Anggota');
    }
    setFilteredUsers(result);
  }, [users, roleFilter]);

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

  const openCreateAccountModal = () => {
    setIsEditMode(false);
    setAccountForm({
      username: '',
      password: '',
      fullName: '',
      role: 'Anggota',
      gender: 'Laki-laki',
      occupationStatus: 'Pelajar/Mahasiswa',
      joinDate: new Date().toISOString().split('T')[0]
    });
    setIsAccountModalOpen(true);
  };

  const openEditAccountModal = (user: UserData) => {
    setIsEditMode(true);
    setEditUserId(user._id);
    setAccountForm({
      username: user.username,
      password: '',
      fullName: user.fullName,
      role: user.role,
      gender: user.gender,
      occupationStatus: user.occupationStatus,
      joinDate: user.joinDate ? new Date(user.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsAccountModalOpen(true);
  };

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAccount(true);
    try {
      const endpoint = isEditMode ? `/users/${editUserId}` : '/users';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const payload = { ...accountForm };
      if (isEditMode && !payload.password.trim()) {
        delete (payload as any).password;
      }

      await fetchAPI(endpoint, { method, body: JSON.stringify(payload) });
      setIsAccountModalOpen(false);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses data akun keanggotaan');
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus akun keanggotaan ini secara permanen?')) {
      try {
        await fetchAPI(`/users/${id}`, { method: 'DELETE' });
        loadUsers();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus data akun');
      }
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
      case 'Aktif': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Pasif': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Keluar': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse font-normal">Memuat data manifes anggota pemuda...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 border border-red-100 rounded-xl text-sm font-medium">{error}</div>;

  const isChairman = ['Ketua', 'Wakil Ketua'].includes(currentUserRole);

  // BARU: Memecah data filteredUsers menjadi 2 barisan klaster (Aktif vs Pasif/Keluar)
  const activeMembers = filteredUsers.filter(u => u.status === 'Aktif');
  const passiveMembers = filteredUsers.filter(u => u.status === 'Pasif' || u.status === 'Keluar');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Manajemen Anggota Pemuda</h1>
          <p className="text-sm text-slate-600 mt-0.5">Mendaftarkan anggota baru, mutasi pergantian pengurus, dan monitoring status keaktifan.</p>
        </div>
        {isChairman && (
          <button onClick={openCreateAccountModal} className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">
            Registrasi Anggota Baru
          </button>
        )}
      </div>

      {/* BARU: Navigasi Filter Kategori Peran Akun */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit text-xs">
        {(['Semua', 'Pengurus', 'Anggota'] as const).map(tab => (
          <button key={tab} onClick={() => setRoleFilter(tab)} className={`px-4 py-2 rounded-md font-medium transition-all ${roleFilter === tab ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
            {tab === 'Anggota' ? 'Anggota Biasa' : tab}
          </button>
        ))}
      </div>

      {/* ================= SECTION 1: ANGGOTA AKTIF ================= */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-800 whitespace-nowrap">Anggota Aktif ({activeMembers.length})</span>
          {/* REVISI GARIS PEMISAH HIJAU AKTIF */}
          <div className="w-full border-t-2 border-emerald-500/80"></div>
        </div>
        
        {activeMembers.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">Tidak ada data anggota aktif terdaftar pada kategori peran ini.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeMembers.map(user => renderMemberCard(user))}
          </div>
        )}
      </div>

      {/* ================= SECTION 2: ANGGOTA PASIF / KELUAR ================= */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-800 whitespace-nowrap">Anggota Pasif / Keluar ({passiveMembers.length})</span>
          {/* REVISI GARIS PEMISAH MERAH PASIF */}
          <div className="w-full border-t-2 border-red-500/80"></div>
        </div>

        {passiveMembers.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">Bersih. Tidak ada anggota pasif atau purna keluar terdaftar.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {passiveMembers.map(user => renderMemberCard(user))}
          </div>
        )}
      </div>

      {/* MODAL INPUT REGISTRASI & EDIT (Lama - Dipertahankan) */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">{isEditMode ? 'Perbarui Struktur / Profil Anggota' : 'Registrasi Akun Anggota Pemuda'}</h3>
            </div>
            <form onSubmit={handleSubmitAccount} className="p-5 space-y-4 text-sm font-normal">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Username Login</label>
                  <input required disabled={isEditMode} type="text" placeholder="username_login" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none disabled:bg-slate-50 disabled:cursor-not-allowed" value={accountForm.username} onChange={e => setAccountForm({ ...accountForm, username: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Password Login</label>
                  <input required={!isEditMode} type="password" placeholder={isEditMode ? 'Isi jika ingin direset' : '••••••••'} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none" value={accountForm.password} onChange={e => setAccountForm({ ...accountForm, password: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nama Lengkap Sesuai KTP</label>
                <input required type="text" placeholder="Masukkan nama lengkap" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none" value={accountForm.fullName} onChange={e => setAccountForm({ ...accountForm, fullName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Struktur Jabatan / Role</label>
                  <select className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none" value={accountForm.role} onChange={e => setAccountForm({ ...accountForm, role: e.target.value })}>
                    <option value="Anggota">Anggota Biasa</option>
                    <option value="Ketua">Ketua Pemuda</option>
                    <option value="Wakil Ketua">Wakil Ketua</option>
                    <option value="Sekretaris">Sekretaris</option>
                    <option value="Bendahara">Bendahara</option>
                    <option value="Kedisiplinan">Seksi Kedisiplinan</option>
                    <option value="Infak">Seksi Infak</option>
                    <option value="Bekakas">Seksi Bekakas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal Resmi Bergabung</label>
                  <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none" value={accountForm.joinDate} onChange={e => setAccountForm({ ...accountForm, joinDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jenis Kelamin</label>
                  <select className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none" value={accountForm.gender} onChange={e => setAccountForm({ ...accountForm, gender: e.target.value as any })}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status Aktivitas</label>
                  <select className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none" value={accountForm.occupationStatus} onChange={e => setAccountForm({ ...accountForm, occupationStatus: e.target.value as any })}>
                    <option value="Pelajar/Mahasiswa">Pelajar / Mahasiswa</option>
                    <option value="Bekerja">Bekerja</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmittingAccount || !accountForm.fullName || !accountForm.username} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {isSubmittingAccount ? 'Memproses...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UBAH STATUS (Lama - Dipertahankan) */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">Ubah Status Anggota</h3>
              <p className="text-xs text-slate-500 mt-0.5">Anggota: <span className="font-medium text-slate-800">{selectedUser?.fullName}</span></p>
            </div>
            <form onSubmit={handleSubmitStatus} className="p-5 space-y-4 text-sm font-normal">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status Keanggotaan</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}>
                  <option value="Aktif">Aktif</option>
                  <option value="Pasif">Pasif (Cuti/Keluar Kota)</option>
                  <option value="Keluar">Keluar (Purna/Menikah)</option>
                </select>
              </div>
              {statusForm.status !== 'Aktif' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Keterangan / Alasan</label>
                  <input type="text" required placeholder="Contoh: Magang di Jakarta 6 bulan" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={statusForm.statusReason} onChange={(e) => setStatusForm({ ...statusForm, statusReason: e.target.value })} />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsStatusModalOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmittingStatus} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  Simpan Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TERBITKAN SP (Lama - Dipertahankan) */}
      {isSpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">Terbitkan Surat Peringatan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Untuk: <span className="font-medium text-slate-800">{selectedUser?.fullName}</span></p>
            </div>
            <form onSubmit={handleSubmitSp} className="p-5 space-y-4 text-sm font-normal">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Surat</label>
                <input type="text" required placeholder="Contoh: SP/PEMUDA/001" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={spForm.spNumber} onChange={(e) => setSpForm({ ...spForm, spNumber: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Alasan Peringatan Singkat</label>
                <textarea required rows={2} placeholder="Contoh: Tidak hadir kegiatan sinoman tanpa keterangan resmi" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 resize-none outline-none font-normal" value={spForm.reason} onChange={(e) => setSpForm({ ...spForm, reason: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Dokumen Lampiran SP</label>
                <input type="file" accept=".doc,.docx,.pdf" className="block w-full text-xs text-slate-800 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-300 rounded-lg bg-white cursor-pointer" onChange={(e) => { if (e.target.files && e.target.files.length > 0) setSpFile(e.target.files[0]); }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsSpModalOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmittingSp} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                  Terbitkan SP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // REUSABLE CARD RENDER FUNCTION: Diisolasi agar kode bersih dan rapi
  function renderMemberCard(user: UserData) {
    return (
      <div key={user._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[220px]">
        
        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[11px] font-medium border-l border-b ${getStatusColor(user.status)}`}>
          {user.status}
        </div>

        <div className="flex items-center gap-4 mb-3 mt-2">
          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-50 to-slate-50 flex items-center justify-center border border-slate-200 shrink-0">
            <span className="text-indigo-600 font-medium text-lg">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate text-base leading-tight">{user.fullName}</h3>
            <p className="text-xs font-medium text-indigo-600 mt-0.5">{user.role} • <span className="text-slate-500 font-normal">{user.gender}</span></p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Gabung: {user.joinDate ? new Date(user.joinDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : '—'}</p>
          </div>
        </div>

        {user.statusReason && user.status !== 'Aktif' && (
          <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
            <span className="font-medium text-slate-700">Keterangan:</span> {user.statusReason}
          </div>
        )}

        <div className="mt-auto space-y-2 pt-3 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-normal">Total SP Aktif:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.suratPeringatan?.length > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'text-slate-400'}`}>
              {user.suratPeringatan?.length || 0} SP
            </span>
          </div>

          {isSpChairmanAccess(currentUserRole, user.role) && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => openStatusModal(user)} className="py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium transition-colors">Keaktifan</button>
              <button onClick={() => openSpModal(user)} className="py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-md text-xs font-medium transition-colors">Terbitkan SP</button>
            </div>
          )}

          {isChairman && (
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button onClick={() => openEditAccountModal(user)} className="py-1.5 bg-slate-50 text-amber-700 hover:bg-amber-50 border border-slate-200 rounded-md text-xs font-medium transition-colors">Mutasi / Edit</button>
              <button onClick={() => handleDeleteUser(user._id)} className="py-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium transition-colors">Hapus Akun</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function isSpChairmanAccess(myRole: string, targetRole: string) {
    if (['Ketua', 'Wakil Ketua'].includes(myRole)) {
      return targetRole !== 'Ketua';
    }
    return ['Sekretaris', 'Kedisiplinan'].includes(myRole) && ['Anggota'].includes(targetRole);
  }
}
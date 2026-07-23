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
  email?: string;
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

  // Filter Peran Kategori Pengurus vs Anggota Biasa
  const [roleFilter, setRoleFilter] = useState<'Semua' | 'Pengurus' | 'Anggota'>('Semua');

  // BARU: State Kata Kunci Pencarian Nama / Username / Email
  const [searchQuery, setSearchQuery] = useState('');

  // State Pengunci ID Kartu untuk Menampilkan Riwayat Lembar SP secara Inline
  const [expandedSpUserId, setExpandedSpUserId] = useState<string | null>(null);

  // States Modal SP
  const [isSpModalOpen, setIsSpModalOpen] = useState(false);
  const [spForm, setSpForm] = useState({ spNumber: '', reason: '' });
  const [spFile, setSpFile] = useState<File | null>(null);
  const [isSubmittingSp, setIsSubmittingSp] = useState(false);

  // States Modal Status Keaktifan
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: 'Aktif', statusReason: '' });
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // States Modal CRUD Akun
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  
  const [accountForm, setAccountForm] = useState({
    username: '',
    password: '',
    email: '', 
    fullName: '',
    role: 'Anggota',
    gender: 'Laki-laki',
    occupationStatus: 'Pelajar/Mahasiswa',
    joinDate: ''
  });
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // State untuk Modal Konfirmasi Pembuatan Akun Sukses
  const [createdAccountSuccess, setCreatedAccountSuccess] = useState<{
    fullName: string;
    username: string;
    email: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    setCurrentUserRole(role || '');
    loadUsers();
  }, []);

  // UPDATE LOGIC: Filtering Kombinasi (Role Filter + Search Query)
  useEffect(() => {
    let result = [...users];

    // 1. Saring Berdasarkan Kategori Role Tab
    if (roleFilter === 'Pengurus') {
      result = result.filter(u => u.role !== 'Anggota');
    } else if (roleFilter === 'Anggota') {
      result = result.filter(u => u.role === 'Anggota');
    }

    // 2. Saring Berdasarkan Pencarian (Nama, Username, atau Email)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(u => 
        u.fullName?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    setFilteredUsers(result);
  }, [users, roleFilter, searchQuery]);

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
      email: '',
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
      email: user.email || '',
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

      if (!isEditMode) {
        delete (payload as any).password;
      } else if (!payload.password.trim()) {
        delete (payload as any).password;
      }

      const res = await fetchAPI(endpoint, { method, body: JSON.stringify(payload) });
      setIsAccountModalOpen(false);
      loadUsers();

      if (!isEditMode) {
        setCreatedAccountSuccess({
          fullName: accountForm.fullName,
          username: accountForm.username,
          email: accountForm.email,
          message: res?.message
        });
      }
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

      alert(data.message || 'Surat Peringatan berhasil diterbitkan.');
      setIsSpModalOpen(false);
      loadUsers(); 
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingSp(false);
    }
  };

  const handleDeleteSP = async (userId: string, spId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus lembar Surat Peringatan ini dari rekam medis organisasi?')) return;
    try {
      const res = await fetchAPI(`/users/${userId}/sp/${spId}`, { method: 'DELETE' });
      alert(res.message);
      
      setUsers(users.map(u => u._id === userId ? { ...u, suratPeringatan: res.suratPeringatan } : u));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus dokumen SP');
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
      case 'Aktif': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pasif': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Keluar': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse font-normal">Memuat data manifes anggota pemuda...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 border border-red-100 rounded-xl text-sm font-medium">{error}</div>;

  const isChairman = ['Ketua', 'Wakil Ketua'].includes(currentUserRole);

  const activeMembers = filteredUsers.filter(u => u.status === 'Aktif');
  const passiveMembers = filteredUsers.filter(u => u.status === 'Pasif' || u.status === 'Keluar');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800 w-full font-normal">
      
      {/* Header Utama */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Manajemen Anggota Pemuda</h1>
          <p className="text-sm text-slate-500 mt-0.5">Mendaftarkan anggota baru, mutasi pergantian pengurus, dan monitoring status keaktifan.</p>
        </div>
        {isChairman && (
          <button onClick={openCreateAccountModal} className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer shrink-0">
            Registrasi Anggota Baru
          </button>
        )}
      </div>

     {/* BARIS KONTROL: Filter Tab (Pojok Kiri) & Search Bar (Pojok Kanan Sejajar Tombol Regis) */}
{/* BARIS KONTROL: Kunci Mati dengan Inline Style */}
<div className="flex flex-col gap-3 w-full items-start">
  
  {/* 1. Navigasi Filter Role */}
  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit text-xs font-medium shrink-0">
    {(['Semua', 'Pengurus', 'Anggota'] as const).map(tab => (
      <button 
        key={tab} 
        onClick={() => setRoleFilter(tab)} 
        className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
          roleFilter === tab 
            ? 'bg-white text-indigo-600 shadow-sm font-semibold border border-slate-200/40' 
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {tab === 'Anggota' ? 'Anggota Biasa' : tab}
      </button>
    ))}
  </div>

  {/* 2. Search Bar - Dikunci Lebar & Padding-nya pakai Inline Style */}
  <div 
    className="relative w-full"
    style={{ maxWidth: '280px' }} /* Kunci lebar agar sejajar dengan ujung tombol "Anggota Biasa" */
  >
    {/* Ikon Loop */}
    <div 
      className="absolute inset-y-0 flex items-center pointer-events-none z-10 text-slate-400"
      style={{ left: '12px' }} /* Kunci posisi ikon dari kiri */
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>

    {/* Input Field */}
    <input
      type="text"
      placeholder="Cari nama / email..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full py-2 pr-8 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs font-normal"
      style={{ paddingLeft: '38px' }} /* Kunci jarak teks placeholder agar TIDAK NABRAK ikon */
    />

    {/* Tombol Clear (X) */}
    {searchQuery && (
      <button
        type="button"
        onClick={() => setSearchQuery('')}
        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer z-10"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>

</div>

      {/* SECTION 1: ANGGOTA AKTIF */}
      <div className="space-y-4 w-full">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Anggota Aktif ({activeMembers.length})
          </span>
          <div className="w-full border-t border-slate-200"></div>
        </div>
        
        {activeMembers.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            {searchQuery ? `Tidak ada anggota aktif yang cocok dengan kata kunci "${searchQuery}".` : 'Tidak ada data anggota aktif terdaftar pada kategori peran ini.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
            {activeMembers.map(user => renderMemberCard(user))}
          </div>
        )}
      </div>

      {/* SECTION 2: ANGGOTA PASIF / KELUAR */}
      <div className="space-y-4 pt-4 w-full">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Anggota Pasif / Keluar ({passiveMembers.length})
          </span>
          <div className="w-full border-t border-slate-200"></div>
        </div>

        {passiveMembers.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            {searchQuery ? `Tidak ada anggota pasif/keluar yang cocok dengan kata kunci "${searchQuery}".` : 'Tidak ada anggota pasif atau purna keluar terdaftar.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
            {passiveMembers.map(user => renderMemberCard(user))}
          </div>
        )}
      </div>

      {/* MODAL INPUT REGISTRASI & EDIT */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-semibold text-slate-800">{isEditMode ? 'Perbarui Struktur / Profil Anggota' : 'Registrasi Akun Anggota Pemuda'}</h3>
            </div>
            <form onSubmit={handleSubmitAccount} className="p-5 space-y-4 text-sm font-normal">
              
              {/* INPUT USERNAME & PASSWORD */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Username Login</label>
                  <input 
                    required 
                    disabled={isEditMode} 
                    type="text" 
                    placeholder="username_login" 
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none disabled:bg-slate-50 disabled:cursor-not-allowed font-normal" 
                    value={accountForm.username} 
                    onChange={e => setAccountForm({ ...accountForm, username: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Password Login</label>
                  {isEditMode ? (
                    <input 
                      type="password" 
                      placeholder="Isi jika ingin direset" 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" 
                      value={accountForm.password} 
                      onChange={e => setAccountForm({ ...accountForm, password: e.target.value })} 
                    />
                  ) : (
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-mono flex items-center justify-between cursor-not-allowed select-none">
                      <span>••••••••</span>
                      <span className="text-[10px] text-indigo-600 font-sans font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        Otomatis 🔒
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* INPUT EMAIL */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Email Aktif Anggota</label>
                <input 
                  required 
                  type="email" 
                  placeholder="contoh: anggota@gmail.com" 
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" 
                  value={accountForm.email} 
                  onChange={e => setAccountForm({ ...accountForm, email: e.target.value })} 
                />
                {!isEditMode && (
                  <p className="text-[10px] text-indigo-600 font-medium mt-1">
                    * Kredensial login awal akan dikirimkan otomatis ke email ini.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Nama Lengkap Sesuai KTP</label>
                <input required type="text" placeholder="Masukkan nama lengkap" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={accountForm.fullName} onChange={e => setAccountForm({ ...accountForm, fullName: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Struktur Jabatan / Role</label>
                  <select className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={accountForm.role} onChange={e => setAccountForm({ ...accountForm, role: e.target.value })}>
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
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Tanggal Resmi Bergabung</label>
                  <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={accountForm.joinDate} onChange={e => setAccountForm({ ...accountForm, joinDate: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Jenis Kelamin</label>
                  <select className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={accountForm.gender} onChange={e => setAccountForm({ ...accountForm, gender: e.target.value as any })}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Status Aktivitas</label>
                  <select className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={accountForm.occupationStatus} onChange={e => setAccountForm({ ...accountForm, occupationStatus: e.target.value as any })}>
                    <option value="Pelajar/Mahasiswa">Pelajar / Mahasiswa</option>
                    <option value="Bekerja">Bekerja</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={isSubmittingAccount || !accountForm.fullName || !accountForm.username || !accountForm.email} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer">
                  {isSubmittingAccount ? 'Memproses...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UBAH STATUS */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-semibold text-slate-800">Ubah Status Keaktifan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Anggota: <span className="font-semibold text-slate-800">{selectedUser?.fullName}</span></p>
            </div>
            <form onSubmit={handleSubmitStatus} className="p-5 space-y-4 text-sm font-normal">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Status Keanggotaan</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}>
                  <option value="Aktif">Aktif</option>
                  <option value="Pasif">Pasif (Cuti/Keluar Kota)</option>
                  <option value="Keluar">Keluar (Purna/Menikah)</option>
                </select>
              </div>
              {statusForm.status !== 'Aktif' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Keterangan / Alasan Resmi</label>
                  <input type="text" required placeholder="Contoh: Kuliah kerja nyata luar daerah" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={statusForm.statusReason} onChange={(e) => setStatusForm({ ...statusForm, statusReason: e.target.value })} />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsStatusModalOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={isSubmittingStatus} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer">
                  Simpan Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TERBITKAN SP */}
      {isSpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-semibold text-slate-800">Terbitkan Surat Peringatan Resmi</h3>
              <p className="text-xs text-slate-500 mt-0.5">Untuk: <span className="font-semibold text-slate-800">{selectedUser?.fullName}</span></p>
            </div>
            <form onSubmit={handleSubmitSp} className="p-5 space-y-4 text-sm font-normal">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Nomor Dokumen Surat</label>
                <input type="text" required placeholder="Contoh: SP/PEMUDA/011" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none font-normal" value={spForm.spNumber} onChange={(e) => setSpForm({ ...spForm, spNumber: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Alasan Pelanggaran Kedisiplinan</label>
                <textarea required rows={2} placeholder="Tulis alasan dikeluarkannya surat peringatan..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 resize-none outline-none font-normal" value={spForm.reason} onChange={(e) => setSpForm({ ...spForm, reason: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Dokumen Lampiran SP Berita Acara</label>
                <input type="file" accept=".doc,.docx,.pdf" className="block w-full text-xs text-slate-800 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-300 rounded-lg bg-white cursor-pointer font-normal" onChange={(e) => { if (e.target.files && e.target.files.length > 0) setSpFile(e.target.files[0]); }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsSpModalOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={isSubmittingSp} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer">
                  Terbitkan SP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI PEMBUATAN AKUN SUKSES */}
      {createdAccountSuccess && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            
            {/* Header Modal - Icon Centang Hijau */}
            <div className="p-6 pb-4 bg-gradient-to-b from-emerald-50 to-white text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 mb-3.5 border border-emerald-500 shrink-0">
                <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Akun Berhasil Diterbitkan! 🎉</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Data anggota resmi tersimpan di dalam sistem.</p>
            </div>

            {/* Kartu Rincian Kredensial & Status Email */}
            <div className="p-6 pt-2 space-y-4">
              <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Nama Anggota</span>
                  <span className="font-bold text-slate-900 text-right">{createdAccountSuccess.fullName}</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Username Login</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-md border border-indigo-200 text-xs">
                    {createdAccountSuccess.username}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 font-medium">Email Tujuan</span>
                  <span className="font-semibold text-slate-800 break-all text-right max-w-[200px]">
                    {createdAccountSuccess.email}
                  </span>
                </div>
              </div>

              {/* Notifikasi Pengiriman Email */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-300/80 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 font-medium">
                <span className="text-lg leading-none shrink-0">📧</span>
                <p className="leading-relaxed">
                  Password sementara telah di-generate otomatis. Instruksi verifikasi & login telah dikirimkan ke <b className="text-emerald-950 underline decoration-emerald-400">{createdAccountSuccess.email}</b>.
                </p>
              </div>

              {/* Tombol Tutup */}
              <button
                type="button"
                onClick={() => setCreatedAccountSuccess(null)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all uppercase tracking-wider border border-slate-800 active:scale-[0.99]"
              >
                Mengerti & Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );

  // REUSABLE CARD RENDER FUNCTION
  function renderMemberCard(user: UserData) {
    const spCount = user.suratPeringatan?.length || 0;
    const isLockedOutBySp3 = spCount >= 3 || user.status === 'Keluar';
    const isSpExpanded = expandedSpUserId === user._id;

    return (
      <div key={user._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300/80 transition-all relative overflow-hidden flex flex-col justify-between min-h-[230px] h-fit">
        
        {/* Badge Status Keaktifan Pojok Atas */}
        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold border-l border-b tracking-wide uppercase ${getStatusColor(user.status)}`}>
          {user.status}
        </div>

        {/* Profil Inti: Avatar & Keterangan Personal */}
        <div className="flex items-start gap-4 mb-4 mt-2">
          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center border border-indigo-200 shrink-0 shadow-xs">
            <span className="text-white font-semibold text-lg">
              {user.fullName?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-base leading-snug break-words pr-12">{user.fullName}</h3>
            <p className="text-xs font-semibold text-indigo-600 mt-1">{user.role} • <span className="text-slate-500 font-normal">{user.gender}</span></p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tight">Terdaftar: {user.joinDate ? new Date(user.joinDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : '—'}</p>
          </div>
        </div>

        {/* Alasan Status Pasif/Keluar */}
        {user.statusReason && user.status !== 'Aktif' && (
          <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-700 font-normal leading-relaxed">
            <span className="font-semibold text-slate-800">Keterangan internal:</span> {user.statusReason}
          </div>
        )}

        {/* Blok Riwayat Disiplin & Tombol Pembuka Detail SP */}
        <div className="mt-auto space-y-3 pt-3 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs font-normal">
            <span className="text-slate-500">Total SP Aktif:</span>
            
            <button
              type="button"
              disabled={spCount === 0}
              onClick={() => setExpandedSpUserId(isSpExpanded ? null : user._id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border inline-flex items-center gap-1 ${
                spCount > 0 
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:text-rose-800 cursor-pointer shadow-2xs' 
                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              {spCount} SP {spCount > 0 && (isSpExpanded ? '▲ Tutup' : '▼ Lihat Rincian')}
            </button>
          </div>

          {/* PANEL DROPDOWN INLINE: Rincian Lembaran SP */}
          {spCount > 0 && isSpExpanded && (
            <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-200/60 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
              <p className="text-[9px] font-bold uppercase text-rose-800 tracking-wider">Arsip Surat Peringatan Resmi:</p>
              {user.suratPeringatan.map((sp, idx) => (
                <div key={sp._id || idx} className="p-2.5 bg-white rounded-lg border border-rose-200 shadow-2xs text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-rose-700 px-1.5 py-0.5 bg-rose-50 border border-rose-100 rounded text-[10px]">{sp.spNumber}</span>
                    <span className="text-[9px] font-mono text-slate-400">{sp.createdAt ? new Date(sp.createdAt).toLocaleDateString('id-ID') : '—'}</span>
                  </div>
                  <p className="text-slate-700 font-normal leading-relaxed mt-1.5"><span className="font-semibold text-slate-900">Alasan:</span> {sp.reason}</p>
                  
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {sp.fileUrl ? (
                      <a 
                        href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${sp.fileUrl}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                      >
                        📄 Unduh Berkas
                      </a>
                    ) : <span className="text-[10px] text-slate-400 italic">Tanpa lampiran</span>}

                    {isChairman && user.status !== 'Keluar' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSP(user._id, sp._id!)}
                        className="px-2 py-0.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded text-[10px] font-bold cursor-pointer transition-all"
                      >
                        🗑️ Hapus SP
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Baris Tombol Aksi Kontras Tinggi - Pengurus Jalur Inti */}
          {isSpChairmanAccess(currentUserRole, user.role) && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => openStatusModal(user)} className="py-2 bg-white text-slate-800 hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer">
                Keaktifan
              </button>
              
              {isLockedOutBySp3 ? (
                <span className="py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-center text-[10px] font-bold select-none cursor-not-allowed uppercase tracking-wider">
                  Batas SP3 (Keluar)
                </span>
              ) : (
                <button onClick={() => openSpModal(user)} className="py-2 bg-red-600 text-white hover:bg-red-700 border border-red-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer">
                  Terbitkan SP
                </button>
              )}
            </div>
          )}

          {/* Baris Tombol Aksi CRUD Ketua */}
          {isChairman && (
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button onClick={() => openEditAccountModal(user)} className="py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                Mutasi / Edit
              </button>
              <button onClick={() => handleDeleteUser(user._id)} className="py-2 bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                Hapus Akun
              </button>
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
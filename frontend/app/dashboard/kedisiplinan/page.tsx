// frontend/app/dashboard/kedisiplinan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';

// Impor komponen pecahan modular fungsional
import GroupTab from './components/GroupTab';
import AttendanceTab from './components/AttendanceTab';
import FineTab from './components/FineTab';

export default function KedisiplinanPage() {
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState<'kelompok' | 'absensi' | 'denda'>('kelompok');
  const [isLoading, setIsLoading] = useState(true);

  // Core Data States
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [fines, setFines] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [kumpulans, setKumpulan] = useState([]);

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
    } catch (err) {
      alert('Gagal sinkronisasi data birokrasi seksi');
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLER ACTION MUTASI KELOMPOK (MENDUKUNG UPDATE/ASSIGN KE EXISTING)
  const handleSaveGroup = async (payload: { id?: string; name: string; members: string[] }) => {
    setIsSubmitting(true);
    try {
      // Jika memiliki properti ID, berarti melakukan mutasi kelompok existing via PUT rute baru lu
      const endpoint = payload.id ? `/discipline/groups/${payload.id}` : '/discipline/groups';
      const method = payload.id ? 'PUT' : 'POST';

      await fetchAPI(endpoint, { method, body: JSON.stringify(payload) });
      loadInitialData();
    } catch (err) {
      alert('Gagal memproses pengalokasian regu kelompok');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveKumpulan = async (payload: any) => {
    setIsSubmitting(true);
    try {
      await fetchAPI('/discipline/kumpulan', { method: 'POST', body: JSON.stringify(payload) });
      loadInitialData();
    } catch (err) {
      alert('Gagal menjadwalkan kumpulan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFetchAttendanceRecords = async (type: string, id: string) => {
    try {
      const res = await fetchAPI(`/discipline/attendance?type=${type}&refId=${id}`, { method: 'GET' });
      const mappedRecords: any = {};
      res.records.forEach((rec: any) => { mappedRecords[rec.user] = rec.status; });
      return mappedRecords;
    } catch (err) {
      return {};
    }
  };

  const handleSaveAttendanceSheet = async (payload: any) => {
    setIsSubmitting(true);
    try {
      await fetchAPI('/discipline/attendance', { method: 'POST', body: JSON.stringify(payload) });
      alert('Presensi resmi dikunci! Log pelanggaran denda terakumulasi otomatis.');
      loadInitialData();
    } catch (err: any) {
      alert(err.message || 'Gagal merekam lembar absensi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveManualFine = async (payload: any) => {
    setIsSubmitting(true);
    try {
      await fetchAPI('/discipline/fines', { method: 'POST', body: JSON.stringify(payload) });
      loadInitialData();
    } catch (err) {
      alert('Gagal menerbitkan denda manual');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForwardToTreasurer = async (id: string) => {
    if (window.confirm('Teruskan laporan denda ini ke Bendahara Pusat untuk divalidasi?')) {
      try {
        await fetchAPI(`/discipline/fines/${id}/pay`, { method: 'PUT' });
        loadInitialData();
      } catch (err) {
        alert('Gagal menyetorkan kas seksi');
      }
    }
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse font-normal">Menghubungkan birokrasi kedisiplinan...</div>;

  const isKedisiplinan = userRole === 'Kedisiplinan';

  return (
    // KUNCI LAYOUT FLUID: w-full murni menjamin stretch rata kanan-kiri murni
    <div className="space-y-6 text-slate-800 font-normal w-full">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Biro Kedisiplinan & Laden</h1>
        <p className="text-sm text-slate-600 mt-0.5">Otoritas penegakan tata tertib, absensi kegiatan, dan penugasan jatah kelompok warga.</p>
      </div>

      {/* Tabs Menu Utama Kontras Tinggi Tanpa Border Semu */}
      <div className="flex bg-slate-100 p-1 rounded-lg w-fit text-xs font-medium">
        <button onClick={() => setActiveTab('kelompok')} className={`px-4 py-2 rounded-md transition-all cursor-pointer ${activeTab === 'kelompok' ? 'bg-white text-indigo-600 border border-indigo-600 shadow-3xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}>
          Kelompok & Jadwal Legi
        </button>
        <button onClick={() => setActiveTab('absensi')} className={`px-4 py-2 rounded-md transition-all cursor-pointer ${activeTab === 'absensi' ? 'bg-white text-indigo-600 border border-indigo-600 shadow-3xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}>
          Absensi Sesi Kegiatan
        </button>
        <button onClick={() => setActiveTab('denda')} className={`px-4 py-2 rounded-md transition-all cursor-pointer ${activeTab === 'denda' ? 'bg-white text-indigo-600 border border-indigo-600 shadow-3xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}>
          Buku Denda Warga
        </button>
      </div>

      {/* ROUTING VIEW SUB-TAB MODULAR */}
      <div className="w-full">
        {activeTab === 'kelompok' && (
          <GroupTab users={users} groups={groups} kumpulans={kumpulans} isKedisiplinan={isKedisiplinan} isSubmitting={isSubmitting} onSaveGroup={handleSaveGroup} onSaveKumpulan={handleSaveKumpulan} />
        )}
        {activeTab === 'absensi' && (
          <AttendanceTab users={users} groups={groups} agendas={agendas} kumpulans={kumpulans} isSubmitting={isSubmitting} onFetchAttendance={handleFetchAttendanceRecords} onSaveAttendance={handleSaveAttendanceSheet} formatRupiah={formatRupiah} />
        )}
        {activeTab === 'denda' && (
          <FineTab users={users} fines={fines} isKedisiplinan={isKedisiplinan} isSubmitting={isSubmitting} onSaveManualFine={handleSaveManualFine} onForwardFine={handleForwardToTreasurer} formatRupiah={formatRupiah} />
        )}
      </div>
    </div>
  );
}
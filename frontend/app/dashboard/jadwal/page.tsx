// frontend/app/dashboard/jadwal/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';

type ActivityCategory = 'Rapat Rutin' | 'Kumpulan Minggu Legi' | 'Agenda Kemasyarakatan' | 'Rapat Insidental';

interface Activity {
  id: string;
  title: string;
  date: string;
  category: ActivityCategory;
  host: string;
  description: string;
  allowedGender: 'Semua' | 'Laki-laki';
}

export default function JadwalKegiatanPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [userGender, setUserGender] = useState('Laki-laki');
  const [isLoading, setIsLoading] = useState(true);

  // States Filter Tab Kategori Resmi & Waktu Jurnal
  const [activeCategory, setActiveCategory] = useState<'Semua' | ActivityCategory>('Semua');
  const [activeTime, setActiveTime] = useState<'AkanDatang' | 'Selesai'>('AkanDatang');

  useEffect(() => {
    loadTimelineData();
  }, []);

  // Alur Filterisasi Data Linimasa Pertemuan Resmi
  useEffect(() => {
    const today = new Date();
    let result = [...activities];

    // 1. Filter Kategori Acara (Mencocokkan murni string kategori dari database)
    if (activeCategory !== 'Semua') {
      result = result.filter(a => a.category === activeCategory);
    }

    // 2. Filter Masa Waktu Event
    if (activeTime === 'AkanDatang') {
      result = result.filter(a => new Date(a.date) > today);
    } else {
      result = result.filter(a => new Date(a.date) <= today);
    }

    setFilteredActivities(result);
  }, [activities, activeCategory, activeTime]);

  const loadTimelineData = async () => {
    try {
      const res = await fetchAPI('/activities', { method: 'GET' });
      if (res.success) {
        setActivities(res.activities);
        setUserGender(res.userGender);
      }
    } catch (err) {
      alert('Gagal memuat jadwal terintegrasi organisasi pemuda');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryBadgeClass = (category: ActivityCategory) => {
    switch (category) {
      case 'Rapat Rutin': return 'bg-indigo-50 text-indigo-700';
      case 'Kumpulan Minggu Legi': return 'bg-emerald-50 text-emerald-700';
      case 'Agenda Kemasyarakatan': return 'bg-amber-50 text-amber-700';
      case 'Rapat Insidental': return 'bg-rose-50 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse font-normal">Memuat data kalender agenda...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800 font-normal w-full">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Jadwal & Agenda Organisasi</h1>
        <p className="text-sm text-slate-500 mt-0.5">Papan monitoring terpusat untuk seluruh agenda kegiatan kemasyarakatan dan internal pemuda RT.</p>
      </div>

      {/* FILTER TAB CONTROLLER DENGAN KATEGORI KONTRAST RESMI */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs w-full">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-slate-400 tracking-wider">Kategori Agenda:</span>
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg gap-1.5 text-xs">
            {([
              { key: 'Semua', label: 'Semua Kegiatan' },
              { key: 'Rapat Rutin', label: 'Rapat Rutin' },
              { key: 'Kumpulan Minggu Legi', label: 'Kumpulan Minggu Legi' },
              { key: 'Agenda Kemasyarakatan', label: 'Agenda Kemasyarakatan' },
              { key: 'Rapat Insidental', label: 'Rapat Insidental' }
            ] as const).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  activeCategory === tab.key 
                    ? 'bg-white text-indigo-600 border border-indigo-600 shadow-3xs font-semibold' 
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-medium text-slate-400 tracking-wider">Masa Waktu:</span>
          <div className="flex bg-slate-100 p-1 rounded-lg gap-1.5 text-xs">
            {([
              { key: 'AkanDatang', label: 'Agenda Akan Datang' },
              { key: 'Selesai', label: 'Riwayat Kegiatan Selesai' }
            ] as const).map(timeTab => (
              <button
                key={timeTab.key}
                type="button"
                onClick={() => setActiveTime(timeTab.key)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  activeTime === timeTab.key 
                    ? 'bg-white text-indigo-600 border border-indigo-600 shadow-3xs font-semibold' 
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {timeTab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRID TIMELINE FLUID RATAN KANAN-KIRI (3 KOLOM PROPORSIONAL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {filteredActivities.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm italic font-normal">
            Tidak ada agenda pertemuan atau kegiatan yang terdaftar dalam kriteria filter ini.
          </div>
        ) : (
          filteredActivities.map(act => {
            const isMaleOnly = act.allowedGender === 'Laki-laki';
            const shouldBlurOrDim = isMaleOnly && userGender === 'Perempuan';

            return (
              <div 
                key={act.id} 
                className={`bg-white p-5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between gap-4 relative overflow-hidden transition-all ${
                  shouldBlurOrDim ? 'bg-slate-50/60 border-slate-200/50 opacity-60' : 'hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase border border-transparent ${getCategoryBadgeClass(act.category)}`}>
                      {act.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {new Date(act.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 mt-3 tracking-tight leading-tight">{act.title}</h3>
                  {act.description && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-normal">{act.description}</p>}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">📍 <span className="font-medium text-slate-700">{act.host}</span></span>
                  
                  {isMaleOnly && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      userGender === 'Laki-laki' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {userGender === 'Laki-laki' ? 'Wajib Hadir' : 'Khusus Pria'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
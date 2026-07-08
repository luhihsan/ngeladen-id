// frontend/app/dashboard/jadwal/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';

interface Activity {
  id: string;
  title: string;
  date: string;
  category: 'Rapat Rutin' | 'Rapat Insidental' | 'Minggu Legi' | 'Agenda Ketua';
  host: string;
  description: string;
  allowedGender: 'Semua' | 'Laki-laki';
}

interface Member {
  _id: string;
  fullName: string;
  role: string;
  status: string;
}

export default function JadwalKegiatanPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [userGender, setUserGender] = useState('Laki-laki');
  const [isLoading, setIsLoading] = useState(true);

  // States Filter Tab Kategori & Waktu Agenda
  const [activeCategory, setActiveCategory] = useState<'Semua' | 'Rapat' | 'Legi' | 'Ketua'>('Semua');
  const [activeTime, setActiveTime] = useState<'AkanDatang' | 'Selesai'>('AkanDatang');

  useEffect(() => {
    loadTimelineData();
  }, []);

  // Alur Filterisasi Data Linimasa Pertemuan
  useEffect(() => {
    const today = new Date();
    let result = [...activities];

    // 1. Filter Kategori Acara
    if (activeCategory === 'Rapat') {
      result = result.filter(a => a.category.includes('Rapat'));
    } else if (activeCategory === 'Legi') {
      result = result.filter(a => a.category === 'Minggu Legi');
    } else if (activeCategory === 'Ketua') {
      result = result.filter(a => a.category === 'Agenda Ketua');
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

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Rapat Rutin': return 'bg-indigo-50 text-indigo-700';
      case 'Minggu Legi': return 'bg-emerald-50 text-emerald-700';
      case 'Agenda Ketua': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse font-normal">Menjalin pipa data kalender pengurus...</div>;

  return (
    // REVISI TOTAL LAYOUT: Mengunci kelas murni w-full tanpa max-width agar stretch rata kanan-kiri konsisten dengan page lain
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800 font-normal w-full">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Jadwal & Agenda Organisasi</h1>
        <p className="text-sm text-slate-500 mt-0.5">Terintegrasi langsung dengan Seksi Sekretariat, Kedisiplinan, dan Ketua.</p>
      </div>

      {/* CONTROLLER FILTER CONTRAST */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs w-full">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-slate-400 tracking-wider">Kategori Agenda:</span>
          <div className="flex bg-slate-100 p-1 rounded-lg gap-1.5 text-xs">
            {([
              { key: 'Semua', label: 'Semua Kegiatan' },
              { key: 'Rapat', label: 'Rapat Rutin Bulanan' },
              { key: 'Legi', label: 'Laden Minggu Legi' },
              { key: 'Ketua', label: 'Agenda Kemasyarakatan' }
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
              { key: 'AkanDatang', label: 'Akan Datang' },
              { key: 'Selesai', label: 'Sudah Selesai' }
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

      {/* REVISI GRID LAYOUT: Menggunakan lg:grid-cols-3 agar sebaran kartu padat merata saat layar melebar penuh */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {filteredActivities.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm italic">
            Belum ada agenda terjadwal yang terdaftar pada filter ini.
          </div>
        ) : (
          filteredActivities.map(act => {
            const isMaleOnly = act.allowedGender === 'Laki-laki';
            const shouldBlurOrDim = isMaleOnly && userGender === 'Perempuan';

            return (
              <div 
                key={act.id} 
                className={`bg-white p-5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between gap-4 relative overflow-hidden transition-all ${
                  shouldBlurOrDim ? 'bg-slate-50/70 border-slate-200/60 opacity-60' : 'hover:shadow-xs'
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
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{act.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">📍 <span className="font-medium text-slate-700">{act.host}</span></span>
                  
                  {isMaleOnly && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      userGender === 'Laki-laki' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {userGender === 'Laki-laki' ? 'Jatah Wajib Lu' : 'Khusus Pria'}
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
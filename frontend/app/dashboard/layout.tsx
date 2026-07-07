// frontend/app/dashboard/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface UserInfo {
  _id: string;
  username: string;
  fullName: string;
  role: string;
  token: string;
}

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: string[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = () => {
      const storedData = localStorage.getItem('userInfo');
      if (!storedData) {
        router.push('/login');
      } else {
        setUserInfo(JSON.parse(storedData));
        setIsLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    router.push('/login');
  };

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard Utama',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      allowedRoles: ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Kedisiplinan', 'Infak', 'Bekakas', 'Anggota'],
    },
    {
      title: 'Manajemen Anggota',
      path: '/dashboard/anggota',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      allowedRoles: ['Ketua', 'Wakil Ketua'],
    },
    {
      title: 'Kotak Masukan',
      path: '/dashboard/suggestion',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
      ),
      allowedRoles: ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Kedisiplinan', 'Infak', 'Bekakas', 'Anggota'], // Terbuka semua
    },
    {
      title: 'Agenda Kegiatan',
      path: '/dashboard/agenda',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
      ),
      // REVISI: Kedisiplinan sekarang diizinkan masuk ke halaman pemantauan ini
      allowedRoles: ['Ketua', 'Wakil Ketua', 'Kedisiplinan'], 
    },
    {
      title: 'Manajemen Keuangan',
      path: '/dashboard/keuangan',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      allowedRoles: ['Ketua', 'Bendahara'],
    },
    {
      title: 'Absensi Rapat Rutin',
      path: '/dashboard/ketua/absensi',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      allowedRoles: ['Ketua', 'Wakil Ketua'],
    },
    {
      title: 'Buku Kas Wajib',
      path: '/dashboard/keuangan/wajib',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 00-2 2h5a2 2 0 002-2" />
        </svg>
      ),
      allowedRoles: ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Kedisiplinan', 'Infak', 'Bekakas', 'Anggota'], 
    },
    {
      title: 'Notulensi & Jadwal',
      path: '/dashboard/sekretariat',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      allowedRoles: ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Kedisiplinan', 'Infak', 'Bekakas', 'Anggota'],
    },
    {
      title: 'Kedisiplinan & Laden',
      path: '/dashboard/kedisiplinan',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      allowedRoles: ['Ketua', 'Kedisiplinan'],
    },
    {
      title: 'Infak & Kurban',
      path: '/dashboard/infak',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      allowedRoles: ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Kedisiplinan', 'Infak', 'Bekakas', 'Anggota'], // Terbuka untuk umum
    },
    {
      title: 'Inventaris & Bekakas',
      path: '/dashboard/bekakas',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
      allowedRoles: ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Kedisiplinan', 'Infak', 'Bekakas', 'Anggota'],
    },
  ];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Memuat sistem...</div>;
  }

  const filteredMenus = menuItems.filter(menu => menu.allowedRoles.includes(userInfo?.role || ''));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out flex flex-col 
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} 
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        <div className={`h-16 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
          {isCollapsed ? (
            <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-cyan-600">N</span>
          ) : (
            <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-cyan-600">Ngeladen.id</h2>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {filteredMenus.map((menu) => {
            const isActive = pathname === menu.path;
            return (
              <Link 
                key={menu.path} 
                href={menu.path}
                title={isCollapsed ? menu.title : ''}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <div className={`${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {menu.icon}
                </div>
                {!isCollapsed && <span className="truncate">{menu.title}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-3">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center justify-center gap-3 p-3 w-full rounded-2xl font-bold transition-all duration-300 border ${
              isCollapsed 
                ? 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 hover:shadow-md'
            }`}
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!isCollapsed && <span className="text-sm">Tutup Panel</span>}
          </button>

          <button 
            onClick={handleLogout}
            title={isCollapsed ? 'Keluar Sistem' : ''}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-red-600 hover:bg-red-50 transition-colors font-medium ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span>Keluar Sistem</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{userInfo?.fullName}</p>
              <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">{userInfo?.role}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-100 to-cyan-50 flex items-center justify-center border border-indigo-200 shadow-sm">
              <span className="text-indigo-700 font-bold text-lg">
                {userInfo?.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}
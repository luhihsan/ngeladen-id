// frontend/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/utils/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bannedModalMessage, setBannedMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem('userInfo', JSON.stringify(data));
      router.push('/dashboard');
    } catch (err: any) {
      const message = err?.message || err?.data?.message || 'Kredensial tidak valid. Silakan periksa kembali.';
      
      if (
        typeof message === 'string' && 
        (
          message.toLowerCase().includes('banned') || 
          message.toLowerCase().includes('diblokir') || 
          message.toLowerCase().includes('dicabut') ||
          message.toLowerCase().includes('akses ditolak') || 
          message.toLowerCase().includes('diberhentikan') || 
          message.toLowerCase().includes('sp3')
        )
      ) {
        setBannedMessage(message);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50">
      {/* Background Ornaments */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>

      {/* Main Card */}
      <div className="relative w-full max-w-md mx-4 sm:mx-auto bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-2xl p-8 sm:p-10">
        
        {/* Header / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 mb-6 shadow-lg shadow-indigo-200 rotate-3 transition-transform hover:rotate-0 duration-300">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-cyan-600">
            Ngeladen.id
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Ruang Kolaborasi & Keuangan Pemuda
          </p>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="bg-red-50/80 border border-red-200 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-center gap-3 backdrop-blur-sm animate-pulse">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username Field */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700 ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 ${error ? 'text-red-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                required
                disabled={isLoading}
                className={`block w-full pl-11 pr-5 py-3.5 bg-white/70 border rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:bg-slate-100
                  ${error 
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'}`}
                placeholder="Masukkan Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(''); 
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 ${error ? 'text-red-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                className={`block w-full pl-11 pr-12 py-3.5 bg-white/70 border rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:bg-slate-100
                  ${error 
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'}`}
                placeholder="Masukan Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
              />
              {/* Tombol Show/Hide Password */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.275 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.543-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`relative w-full flex justify-center py-4 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg mt-2
              ${isLoading 
                ? 'bg-slate-400 cursor-not-allowed shadow-none hover:translate-y-0' 
                : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 shadow-indigo-200'}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </span>
            ) : (
              'Masuk ke Sistem'
            )}
          </button>
        </form>
      </div>

      {/* ================= REVISI TOTAL: MODAL BLOCKADE OVERLAY INLINE STYLE (ANTI-PUCET & KONTRAST MUTLAK) ================= */}
      {bannedModalMessage && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '440px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0'
            }}
          >
            
            {/* Header Modal - MERAH SOLID JRENG */}
            <div 
              style={{
                backgroundColor: '#dc2626',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px'
              }}
            >
              <div 
                style={{
                  height: '56px',
                  width: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.025em' }}>Akses Sistem Ditutup</h3>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '4px 0 0 0' }}>Status Keanggotaan Nonaktif</p>
              </div>
            </div>

            {/* Isi Konten Pesan - BOX MERAH SANGAR & TEKS HITAM PEKAT */}
            <div style={{ padding: '24px', backgroundColor: '#ffffff' }}>
              <div 
                style={{
                  padding: '16px',
                  backgroundColor: '#fff5f5',
                  border: '2px solid #feb2b2',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#742a2a',
                  lineHeight: 1.5,
                  textAlign: 'center',
                  marginBottom: '16px'
                }}
              >
                {bannedModalMessage}
              </div>
              
              <div 
                style={{
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  lineHeight: 1.6,
                  textAlign: 'center',
                  marginBottom: '16px'
                }}
              >
                Hak eksklusif akun login Anda ke dalam platform manajemen pemuda <span style={{ fontWeight: 800, color: '#0f172a' }}>Ngeladen.id</span> saat ini ditangguhkan akibat pelanggaran kedisiplinan organisasi.
              </div>
              
              <p style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                Jika Anda merasa ini adalah kekeliruan administratif, silakan hubungi Seksi Kedisiplinan atau Ketua Pemuda untuk proses reaktivasi.
              </p>
            </div>

            {/* Tombol Tutup - HITAM PEKAT KONTRAS MUTLAK */}
            <div 
              style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'end'
              }}
            >
              <button
                type="button"
                onClick={() => setBannedMessage('')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0f172a')}
              >
                Saya Mengerti, Kembali
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
// frontend/app/dashboard/keuangan/wajib/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';

interface MonthStatus {
  monthNumber: number;
  monthName: string;
  status: 'Tidak Ada Tagihan' | 'Gratis (Anggota Baru)' | 'Lunas' | 'Tagihan';
}

interface MemberReport {
  userId: string;
  fullName: string;
  role: string;
  monthlyMatrix: MonthStatus[];
  totalTunggakan: number;
}

export default function BukuKasWajibPage() {
  const [reportList, setReportList] = useState<MemberReport[]>([]);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKasWajibData();
  }, []);

  const loadKasWajibData = async () => {
    try {
      const res = await fetchAPI('/kas-wajib/report', { method: 'GET' });
      if (res.success) {
        setReportList(res.report);
        setHasFullAccess(res.hasFullAccess);
      }
    } catch (err) {
      alert('Gagal mengambil pelaporan kas wajib organisasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Lunas':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Tagihan':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'Gratis (Anggota Baru)':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse">Menghitung kalender iuran kas wajib pemuda...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Buku Monitoring Kas Wajib</h1>
        <p className="text-sm text-slate-600 mt-0.5">Arsip pencatatan iuran wajib bulanan pemuda berdasarkan tanggal registrasi dan masa tenggang keanggotaan.</p>
      </div>

      {/* TAMPILAN LAPIS 1: Khusus Anggota Biasa / Pengurus Biasa (Hanya Melihat Milik Sendiri) */}
      {!hasFullAccess && reportList.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-md">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Identitas Pengguna</p>
            <h3 className="text-lg font-medium text-slate-900 mt-1">{reportList[0].fullName}</h3>
            <p className="text-xs text-slate-500 uppercase font-medium">{reportList[0].role}</p>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">Total Akumulasi Tunggakan:</span>
              <span className={`text-xl font-semibold ${reportList[0].totalTunggakan > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatRupiah(reportList[0].totalTunggakan)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Kalender Iuran Anda (Tahun 2026)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {reportList[0].monthlyMatrix.map(m => (
                <div key={m.monthNumber} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col justify-between h-20">
                  <span className="text-xs font-medium text-slate-500">{m.monthName}</span>
                  <span className={`px-2 py-0.5 border rounded-md text-[10px] font-medium text-center truncate ${getStatusBadgeClass(m.status)}`}>
                    {m.status === 'Tagihan' ? 'Belum Bayar' : m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAMPILAN LAPIS 2: Khusus Ketua & Bendahara (Matriks Komparasi Seluruh Anggota) */}
      {hasFullAccess && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="text-base font-semibold text-slate-900">Matriks Iuran Wajib Anggota Pemuda</h3>
            <p className="text-xs text-slate-500 mt-0.5">Otoritas monitoring Bendahara untuk pengecekan total tunggakan bulanan kolektif.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-600 font-medium">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama Anggota</th>
                  <th className="px-4 py-3 font-semibold text-right">Tunggakan</th>
                  {reportList[0]?.monthlyMatrix.map(m => (
                    <th key={m.monthNumber} className="px-3 py-3 text-center font-semibold text-[11px] font-mono">{m.monthName.slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {reportList.map(member => (
                  <tr key={member.userId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900 text-sm">{member.fullName}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tight">{member.role}</p>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-semibold text-sm ${member.totalTunggakan > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                      {member.totalTunggakan > 0 ? formatRupiah(member.totalTunggakan) : 'Lunas'}
                    </td>
                    {member.monthlyMatrix.map((m, idx) => (
                      <td key={idx} className="px-2 py-3.5 text-center">
                        <span className={`px-1.5 py-0.5 border rounded text-[9px] font-medium tracking-tighter ${getStatusBadgeClass(m.status)}`} title={`${m.monthName}: ${m.status}`}>
                          {m.status === 'Lunas' ? 'L' : m.status === 'Tagihan' ? 'B' : m.status === 'Tidak Ada Tagihan' ? '—' : 'G'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-4 text-[10px] font-medium text-slate-500 uppercase font-mono">
            <span>Legenda:</span>
            <span><span className="px-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">L</span> Lunas</span>
            <span><span className="px-1 bg-red-50 text-red-600 border border-red-200 rounded">B</span> Belum Bayar</span>
            <span><span className="px-1 bg-blue-50 text-blue-700 border border-blue-200 rounded">G</span> Gratis (Grace Period)</span>
            <span><span className="px-1 bg-slate-50 text-slate-400 border border-slate-200 rounded">—</span> Belum Bergabung</span>
          </div>
        </div>
      )}
    </div>
  );
}
// frontend/app/dashboard/keuangan/wajib/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';

interface MatrixRow {
  _id: string;
  fullName: string;
  occupationStatus: string;
  payments: { [key: string]: boolean };
}

export default function KasWajibPage() {
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [userRole, setUserRole] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsSubmitting] = useState(false);

  const monthKeys = Array.from({ length: 12 }, (_, i) => {
    const mStr = (i + 1).toString().padStart(2, '0');
    return `${selectedYear}-${mStr}`;
  });

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  useEffect(() => {
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    setUserRole(role || '');
    loadMatrixData();
  }, [selectedYear]);

  const loadMatrixData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAPI(`/mandatory-fees/matrix?year=${selectedYear}`, { method: 'GET' });
      setMatrix(data);
    } catch (err) {
      alert('Gagal mengambil lembar matriks kas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutePayment = async (userId: string, period: string, memberName: string) => {
    const dateObj = new Date(`${period}-01`);
    const mName = dateObj.toLocaleDateString('id-ID', { month: 'long' });
    
    if (window.confirm(`Konfirmasi pembayaran kas wajib sebesar Rp 10.000 untuk ${memberName} pada bulan ${mName}?`)) {
      setIsSubmitting(true);
      try {
        await fetchAPI('/mandatory-fees/pay', {
          method: 'POST',
          body: JSON.stringify({ userId, period })
        });
        loadMatrixData(); 
      } catch (err: any) {
        alert(err.message || 'Gagal mengeksekusi kas');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse">Menghamparkan lembar buku iuran bulanan...</div>;

  const isBendahara = ['Bendahara', 'Wakil Bendahara'].includes(userRole);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Buku Kas Wajib Bulanan</h1>
          <p className="text-sm text-slate-600 mt-1">Matriks iuran wajib Rp 10.000 per bulan. Data terintegrasi otomatis ke brankas utama.</p>
        </div>
        <select 
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium outline-none"
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="2026">Tahun 2026</option>
          <option value="2025">Tahun 2025</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700 border-r">Nama Anggota</th>
              {monthLabels.map(label => (
                <th key={label} className="px-4 py-4 font-semibold text-slate-700 text-center border-r w-20">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matrix.map(row => (
              <tr key={row._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3 border-r font-medium text-slate-800">
                  <div>{row.fullName}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{row.occupationStatus}</div>
                </td>
                
                {monthKeys.map(periodKey => {
                  const isPaid = row.payments[periodKey];
                  return (
                    <td key={periodKey} className="p-2 border-r text-center align-middle">
                      {isPaid ? (
                        <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2 py-1 text-xs font-medium">
                          ✓ 10k
                        </span>
                      ) : isBendahara ? (
                        <button
                          disabled={isProcessing}
                          onClick={() => handleExecutePayment(row._id, periodKey, row.fullName)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-500 rounded text-xs font-normal transition-colors"
                        >
                          + Bayar
                        </button>
                      ) : (
                        <span className="text-red-400 font-bold text-xs select-none">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
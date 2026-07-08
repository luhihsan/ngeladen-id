// frontend/app/dashboard/kedisiplinan/components/FineTab.tsx
'use client';

import { useState } from 'react';

interface User {
  _id: string;
  fullName: string;
}

interface Fine {
  _id: string;
  user: { _id: string; fullName: string };
  amount: number;
  reason: string;
  date: string;
  status: string;
}

interface FineTabProps {
  users: User[];
  fines: Fine[];
  isKedisiplinan: boolean;
  isSubmitting: boolean;
  onSaveManualFine: (fineData: { user: string; amount: number; reason: string; date: string }) => Promise<void>;
  onForwardFine: (id: string) => Promise<void>;
  formatRupiah: (num: number) => string;
}

export default function FineTab({ users, fines, isKedisiplinan, isSubmitting, onSaveManualFine, onForwardFine, formatRupiah }: FineTabProps) {
  const [isOpen, setIsFineOpen] = useState(false);
  const [form, setFineForm] = useState({ user: '', amountRaw: '', amountDisplay: '', reason: '', date: '' });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const formattedValue = rawValue ? new Intl.NumberFormat('id-ID').format(Number(rawValue)) : '';
    setFineForm({ ...form, amountRaw: rawValue, amountDisplay: formattedValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveManualFine({
      user: form.user,
      amount: parseFloat(form.amountRaw),
      reason: form.reason,
      date: form.date
    });
    setIsFineOpen(false);
    setFineForm({ user: '', amountRaw: '', amountDisplay: '', reason: '', date: '' });
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg tracking-tight">Buku Denda Warga Pemuda</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">Pencatatan kas pelanggaran tata tertib dan ketidakhadiran agenda RT resmi.</p>
        </div>
        {isKedisiplinan && (
          <button onClick={() => setIsFineOpen(true)} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
            + Input Denda Manual
          </button>
        )}
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-6 py-4">Nama Anggota</th>
                <th className="px-6 py-4">Nominal Tagihan</th>
                <th className="px-6 py-4">Alasan Keterangan</th>
                <th className="px-6 py-4 text-center">Status Mutasi</th>
                {isKedisiplinan && <th className="px-6 py-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {fines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-xs text-slate-400 italic">Arsip denda bersih. Seluruh warga tertib organisasi.</td>
                </tr>
              ) : fines.map(fine => (
                <tr key={fine._id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{fine.user?.fullName}</td>
                  <td className="px-6 py-4 text-red-600 font-medium font-mono">{formatRupiah(fine.amount)}</td>
                  <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-500" title={fine.reason}>{fine.reason}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      fine.status === 'Lunas' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : fine.status === 'Menunggu Konfirmasi' 
                        ? 'bg-amber-50 text-amber-700 border-amber-100' 
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {fine.status}
                    </span>
                  </td>
                  {isKedisiplinan && (
                    <td className="px-6 py-4 text-right">
                      {fine.status === 'Belum Bayar' && (
                        <button onClick={() => onForwardFine(fine._id)} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-medium rounded-md hover:bg-indigo-100 transition-colors cursor-pointer">
                          Setorkan
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT MANUAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50"><h3 className="text-base font-semibold text-slate-800">Catat Denda Manual</h3></div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm font-normal">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Nama Pelanggar</label>
                <select required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-indigo-500" value={form.user} onChange={e => setFineForm({ ...form, user: e.target.value })}>
                  <option value="">-- Pilih Anggota --</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.fullName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Nominal (Rp)</label>
                  <input required type="text" placeholder="10.000" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-indigo-500" value={form.amountDisplay} onChange={handleAmountChange} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Tanggal</label>
                  <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none" value={form.date} onChange={e => setFineForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Alasan Penindakan</label>
                <textarea required rows={2} placeholder="Tulis alasan denda..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs resize-none outline-none focus:border-indigo-500" value={form.reason} onChange={e => setFineForm({ ...form, reason: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsFineOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">Simpan Catatan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
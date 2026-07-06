// frontend/app/dashboard/keuangan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';
import * as XLSX from 'xlsx';

interface Transaction {
  _id: string;
  description: string;
  type: 'Masuk' | 'Keluar';
  amount: number;
  section: string;
  receiptNumber: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  createdBy: {
    fullName: string;
    role: string;
  };
}

interface FinancialMetrics {
  masuk: number;
  keluar: number;
  saldo: number;
}

interface FinanceSummary {
  global: FinancialMetrics;
  umum: FinancialMetrics;
  infak: FinancialMetrics;
  kedisiplinan: FinancialMetrics;
  bekakas: FinancialMetrics; 
}

export default function KeuanganPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  
  const [summary, setSummary] = useState<FinanceSummary>({
    global: { masuk: 0, keluar: 0, saldo: 0 },
    umum: { masuk: 0, keluar: 0, saldo: 0 },
    infak: { masuk: 0, keluar: 0, saldo: 0 },
    kedisiplinan: { masuk: 0, keluar: 0, saldo: 0 },
    bekakas: { masuk: 0, keluar: 0, saldo: 0 }
  });

  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const monthOptions = [
    { val: '1', label: 'Januari' }, { val: '2', label: 'Februari' }, { val: '3', label: 'Maret' },
    { val: '4', label: 'April' }, { val: '5', label: 'Mei' }, { val: '6', label: 'Juni' },
    { val: '7', label: 'Juli' }, { val: '8', label: 'Agustus' }, { val: '9', label: 'September' },
    { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' }
  ];

  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState({ description: '', type: 'Masuk', amountRaw: '', amountDisplay: '', section: 'Umum' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    setUserRole(role || '');
    loadFinanceData();
  }, []);

  useEffect(() => {
    let approvedList = transactions.filter(t => t.status === 'Approved');
    
    // Perhitungan Lapis Kedua Mandiri per Seksi di Frontend Agar Data 100% Akurat
    let gMasuk = 0, gKeluar = 0;
    let uMasuk = 0, uKeluar = 0;
    let iMasuk = 0, iKeluar = 0;
    let kMasuk = 0, kKeluar = 0;
    let bMasuk = 0, bKeluar = 0;

    approvedList.forEach(t => {
      const nominal = Number(t.amount) || 0;
      
      // 1. Akumulasi Global
      if (t.type === 'Masuk') gMasuk += nominal;
      if (t.type === 'Keluar') gKeluar += nominal;

      // 2. Akumulasi per Pos Klaster
      if (t.section === 'Umum') {
        if (t.type === 'Masuk') uMasuk += nominal;
        if (t.type === 'Keluar') uKeluar += nominal;
      } else if (t.section === 'Infak') {
        if (t.type === 'Masuk') iMasuk += nominal;
        if (t.type === 'Keluar') iKeluar += nominal;
      } else if (t.section === 'Kedisiplinan' || t.section === 'Denda') {
        if (t.type === 'Masuk') kMasuk += nominal;
        if (t.type === 'Keluar') kKeluar += nominal;
      } else if (t.section === 'Bekakas') {
        if (t.type === 'Masuk') bMasuk += nominal;
        if (t.type === 'Keluar') bKeluar += nominal;
      }
    });

    setSummary({
      global: { masuk: gMasuk, keluar: gKeluar, saldo: gMasuk - gKeluar },
      umum: { masuk: uMasuk, keluar: uKeluar, saldo: uMasuk - uKeluar },
      infak: { masuk: iMasuk, keluar: iKeluar, saldo: iMasuk - iKeluar },
      kedisiplinan: { masuk: kMasuk, keluar: kKeluar, saldo: kMasuk - kKeluar },
      bekakas: { masuk: bMasuk, keluar: bKeluar, saldo: bMasuk - bKeluar }
    });
    
    if (filterMonth) approvedList = approvedList.filter(t => new Date(t.createdAt).getMonth() + 1 === parseInt(filterMonth));
    if (filterYear) approvedList = approvedList.filter(t => new Date(t.createdAt).getFullYear() === parseInt(filterYear));
    
    setFilteredTransactions(approvedList);
    
    const pendingList = transactions.filter(t => t.status === 'Pending');
    setPendingTransactions(pendingList);
  }, [transactions, filterMonth, filterYear]);

  const loadFinanceData = async () => {
    try {
      const res = await fetchAPI('/transactions', { method: 'GET' });
      setTransactions(res.transactions);
      if (res.summary && res.summary.global) {
        setSummary(res.summary);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memuat data keuangan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const formattedValue = rawValue ? new Intl.NumberFormat('id-ID').format(Number(rawValue)) : '';
    setForm({ ...form, amountRaw: rawValue, amountDisplay: formattedValue });
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setForm({ description: '', type: 'Masuk', amountRaw: '', amountDisplay: '', section: 'Umum' });
    setIsOpen(true);
  };

  const handleOpenEdit = (t: Transaction) => {
    setIsEditMode(true);
    setEditId(t._id);
    const formattedValue = new Intl.NumberFormat('id-ID').format(t.amount);
    setForm({ description: t.description, type: t.type, amountRaw: t.amount.toString(), amountDisplay: formattedValue, section: t.section });
    setIsOpen(true);
  };

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(form.amountRaw);
    if (!form.description || isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const endpoint = isEditMode ? `/transactions/${editId}` : '/transactions';
      const method = isEditMode ? 'PUT' : 'POST';
      await fetchAPI(endpoint, { method, body: JSON.stringify({ ...form, amount: parsedAmount }) });
      setIsOpen(false);
      loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionValidation = async (id: string, actionStatus: 'Approved' | 'Rejected') => {
    const confirmMsg = actionStatus === 'Approved' 
      ? 'Konfirmasi bahwa uang fisik denda/infak sudah masuk brankas dan sahkan transaksi?' 
      : 'Tolk setoran kas ini dan kembalikan berkas ke seksi terkait?';

    if (window.confirm(confirmMsg)) {
      try {
        await fetchAPI(`/transactions/${id}/validate`, {
          method: 'PUT',
          body: JSON.stringify({ status: actionStatus })
        });
        loadFinanceData();
      } catch (err: any) {
        alert(err.message || 'Gagal memproses otorisasi kas');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus transaksi ini?')) {
      try {
        await fetchAPI(`/transactions/${id}`, { method: 'DELETE' });
        loadFinanceData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus');
      }
    }
  };

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) return alert('Tidak ada data untuk diexport.');
    const excelData = filteredTransactions.map((t, index) => ({
      'No': index + 1,
      'Tanggal & Waktu': new Date(t.createdAt).toLocaleString('id-ID'),
      'Nominal (Rp)': t.amount,
      'Jenis Mutasi': t.type === 'Masuk' ? 'Debit' : 'Kredit',
      'Keterangan': t.description,
      'Alokasi Kas': t.section,
      'Nomor Nota': t.receiptNumber || '-',
      'Diinput Oleh': t.createdBy?.fullName
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jurnal_Utama');
    XLSX.writeFile(workbook, `Laporan_Kas_Ngeladen.xlsx`);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse">Sinkronisasi brankas Bendahara...</div>;

  const isAuthorized = ['Bendahara', 'Wakil Bendahara'].includes(userRole);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Manajemen Keuangan Terpusat</h1>
          <p className="text-sm text-slate-600 mt-1">Transparansi arus kas, pembukuan debit, kredit, dan nota keluar organisasi</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
            Export Excel
          </button>
          {isAuthorized && (
            <button onClick={handleOpenCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:bg-indigo-700 transition-colors">
              + Catat Kas Baru
            </button>
          )}
        </div>
      </div>

      {/* --- REVISI JOSSS PANEL: TOTAL KAS BESAR UTAMA (APPROVED ONLY) --- */}
      <div className="bg-slate-800 text-white rounded-xl p-6 shadow-md border border-slate-700">
        <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Total Saldo Sah Keseluruhan Organisasi</p>
        <h2 className="text-3xl font-semibold mt-1 tracking-tight">{formatRupiah(summary.global.saldo)}</h2>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700 text-sm">
          <div>
            <p className="text-xs text-slate-400">Total Akumulasi Masuk</p>
            <p className="font-semibold text-emerald-400 mt-0.5">{formatRupiah(summary.global.masuk)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Akumulasi Keluar</p>
            <p className="font-semibold text-red-400 mt-0.5">{formatRupiah(summary.global.keluar)}</p>
          </div>
        </div>
      </div>

      {/* --- CENTRALIZED SECTION FINANCIAL BREAKDOWN GRID --- */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800 text-base">Rincian Saldo Terpusat Per Pos Anggaran</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kas 1: Umum */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-semibold tracking-wide uppercase">📦 KAS UTAMA / UMUM</span>
            <p className="text-xl font-semibold text-slate-800 pt-0.5">{formatRupiah(summary.umum.saldo)}</p>
            <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
              <span>Masuk: <span className="text-emerald-600 font-medium">{formatRupiah(summary.umum.masuk)}</span></span>
              <span>Keluar: <span className="text-red-600 font-medium">{formatRupiah(summary.umum.keluar)}</span></span>
            </div>
          </div>

          {/* Kas 2: Infak */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-semibold tracking-wide uppercase">MAJID / INFAK SOIAL</span>
            <p className="text-xl font-semibold text-slate-800 pt-0.5">{formatRupiah(summary.infak.saldo)}</p>
            <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
              <span>Masuk: <span className="text-emerald-600 font-medium">{formatRupiah(summary.infak.masuk)}</span></span>
              <span>Keluar: <span className="text-red-600 font-medium">{formatRupiah(summary.infak.keluar)}</span></span>
            </div>
          </div>

          {/* Kas 3: Kedisiplinan (Denda) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
            <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[10px] font-semibold tracking-wide uppercase">⚖️ DENDA KEDISIPLINAN</span>
            <p className="text-xl font-semibold text-slate-800 pt-0.5">{formatRupiah(summary.kedisiplinan.saldo)}</p>
            <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
              <span>Masuk: <span className="text-emerald-600 font-medium">{formatRupiah(summary.kedisiplinan.masuk)}</span></span>
              <span>Keluar: <span className="text-red-600 font-medium">{formatRupiah(summary.kedisiplinan.keluar)}</span></span>
            </div>
          </div>

          {/* Kas 4: Bekakas */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-semibold tracking-wide uppercase">🛠️ KAS SEKSI BEKAKAS</span>
            <p className="text-xl font-semibold text-slate-800 pt-0.5">{formatRupiah(summary.bekakas?.saldo || 0)}</p>
            <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
              <span>Masuk: <span className="text-emerald-600 font-medium">{formatRupiah(summary.bekakas?.masuk || 0)}</span></span>
              <span>Keluar: <span className="text-red-600 font-medium">{formatRupiah(summary.bekakas?.keluar || 0)}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DAFTAR APPROVAL PENDING */}
      {isAuthorized && pendingTransactions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <h3 className="font-semibold text-amber-900 text-base">Butuh Otorisasi Persetujuan Kas ({pendingTransactions.length} Pengajuan)</h3>
          </div>
          <div className="space-y-2">
            {pendingTransactions.map(pt => (
              <div key={pt._id} className="bg-white p-4 rounded-xl border border-amber-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-xs">
                <div>
                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-semibold rounded uppercase">{pt.section}</span>
                  <p className="font-medium text-slate-800 text-sm mt-1">{pt.description}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Disetorkan oleh: {pt.createdBy?.fullName} • Nominal: <span className="text-emerald-600 font-semibold">{formatRupiah(pt.amount)}</span></p>
                </div>
                <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button onClick={() => handleActionValidation(pt._id, 'Rejected')} className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-red-600 hover:bg-red-50 rounded-md text-xs font-medium transition-colors">
                    Tolak
                  </button>
                  <button onClick={() => handleActionValidation(pt._id, 'Approved')} className="px-4 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md text-xs font-medium transition-colors shadow-sm">
                    ACC / Sahkan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kontrol Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="text-sm font-medium text-slate-700">Filter Jurnal Umum:</div>
        <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
          <option value="">Semua Bulan</option>
          {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
        <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="">Semua Tahun</option>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Riwayat Transaksi Utama */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800 text-base">📋 Buku Jurnal Umum Kas Sah</h3>
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-600 font-medium text-sm">Tidak ada transaksi kas sah tercatat pada periode filter ini.</div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">No</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Tanggal</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Nominal</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Jenis</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Keterangan</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Oleh</th>
                  {isAuthorized && <th className="px-6 py-4 font-semibold text-slate-700 text-center">Aksi Audit</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredTransactions.map((t, index) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{index + 1}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-mono">{new Date(t.createdAt).toLocaleString('id-ID', { dateStyle: 'medium' })}</td>
                    <td className={`px-6 py-4 font-semibold ${t.type === 'Masuk' ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(t.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${t.type === 'Masuk' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {t.type === 'Masuk' ? 'Debit' : 'Kredit'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800 truncate max-w-xs">{t.description}</p>
                      <p className="text-xs text-slate-500 font-normal mt-0.5">{t.section} {t.receiptNumber && `• ${t.receiptNumber}`}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                      {t.createdBy?.fullName || 'Sistem'}
                    </td>
                    {isAuthorized && (
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenEdit(t)} className="px-2.5 py-1.5 bg-slate-100 text-amber-700 border border-slate-200 hover:bg-slate-200 rounded-md text-xs font-medium transition-colors">Edit</button>
                          <button onClick={() => handleDelete(t._id)} className="px-2.5 py-1.5 bg-slate-100 text-red-600 border border-slate-200 hover:bg-slate-200 rounded-md text-xs font-medium transition-colors">Hapus</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal CRUD Kas Umum */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">{isEditMode ? 'Edit Transaksi Kas' : 'Catat Kas Baru'}</h3>
            </div>
            <form onSubmit={handleInputSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Mutasi</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                  <option value="Masuk">Uang Masuk (Debit)</option>
                  <option value="Keluar">Uang Keluar (Kredit)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                  <input type="text" required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={form.amountDisplay} onChange={handleAmountChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alokasi Seksi</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                    <option value="Umum">Kas Umum</option>
                    <option value="Infak">Kas Infak</option>
                    <option value="Kedisiplinan">Kas Denda</option>
                    <option value="Bekakas">Kas Bekakas</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi / Keterangan</label>
                <textarea required rows={2} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 resize-none outline-none font-normal focus:border-indigo-500" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting || !form.description || !form.amountRaw} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Memproses...' : 'Simpan Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
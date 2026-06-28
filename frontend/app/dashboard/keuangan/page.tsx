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
  status: 'Pending' | 'Approved' | 'Rejected'; // Tambahan tracking status brankas
  createdAt: string;
  createdBy: {
    fullName: string;
    role: string;
  };
}

interface FinanceSummary {
  totalSaldo: number;
  totalMasuk: number;
  totalKeluar: number;
}

export default function KeuanganPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]); // Khusus antrean ACC denda
  const [summary, setSummary] = useState<FinanceSummary>({ totalSaldo: 0, totalMasuk: 0, totalKeluar: 0 });
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // States Filter Jurnal Umum
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

  // State Modal Input Kas Umum
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
    // Hanya tampilkan kas yang disetujui (Approved) di Buku Jurnal Utama & Laporan Bulanan
    let result = transactions.filter(t => t.status === 'Approved');
    
    if (filterMonth) result = result.filter(t => new Date(t.createdAt).getMonth() + 1 === parseInt(filterMonth));
    if (filterYear) result = result.filter(t => new Date(t.createdAt).getFullYear() === parseInt(filterYear));
    
    setFilteredTransactions(result);
    
    // Pisahkan kas berstatus Pending ke antrean validasi internal Bendahara
    const pendingList = transactions.filter(t => t.status === 'Pending');
    setPendingTransactions(pendingList);
  }, [transactions, filterMonth, filterYear]);

  const loadFinanceData = async () => {
    try {
      const res = await fetchAPI('/transactions', { method: 'GET' });
      setTransactions(res.transactions);
      setSummary(res.summary);
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

  // --- LOGIKA UTAMA: Eksekusi Tombol ACC / TOLAK dari Bendahara ---
  const handleActionValidation = async (id: string, actionStatus: 'Approved' | 'Rejected') => {
    const confirmMsg = actionStatus === 'Approved' 
      ? 'Konfirmasi bahwa uang fisik denda sudah masuk brankas dan sahkan transaksi?' 
      : 'Tolak setoran kas denda ini dan kembalikan berkas ke seksi Kedisiplinan?';

    if (window.confirm(confirmMsg)) {
      try {
        await fetchAPI(`/transactions/${id}/validate`, {
          method: 'PUT',
          body: JSON.stringify({ status: actionStatus })
        });
        loadFinanceData(); // Muat ulang saldo dan update status terintegrasi
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

  if (isLoading) return <div className="p-4 text-center text-slate-500 animate-pulse">Sinkronisasi brankas Bendahara...</div>;

  const isAuthorized = ['Bendahara', 'Wakil Bendahara'].includes(userRole);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Keuangan AD/ART</h1>
          <p className="text-sm text-slate-500">Transparansi arus kas, pembukuan debit, kredit, dan nota keluar organisasi</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors">
            Export Excel
          </button>
          {isAuthorized && (
            <button onClick={handleOpenCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700">
              + Catat Kas Baru
            </button>
          )}
        </div>
      </div>

      {/* Rangkuman Finansial */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-tr from-indigo-700 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
          <p className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Total Saldo Sah Kas</p>
          <p className="text-2xl font-black mt-1">{formatRupiah(summary.totalSaldo)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Pemasukan (Debit)</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{formatRupiah(summary.totalMasuk)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Pengeluaran (Kredit)</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{formatRupiah(summary.totalKeluar)}</p>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* PANEL DAFTAR APPROVAL PENDING (Hanya Muncul Jika Ada Data & User = Bendahara) */}
      {/* ======================================================================= */}
      {isAuthorized && pendingTransactions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3 shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <h3 className="font-extrabold text-amber-900 text-base">Butuh Otorisasi Persetujuan Kas ({pendingTransactions.length} Pengajuan)</h3>
          </div>
          <div className="space-y-2">
            {pendingTransactions.map(pt => (
              <div key={pt._id} className="bg-white p-4 rounded-xl border border-amber-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase">{pt.section}</span>
                  <p className="font-bold text-slate-900 text-sm mt-1">{pt.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Disetorkan oleh: {pt.createdBy?.fullName} • Nominal: <strong className="text-emerald-600 font-extrabold">{formatRupiah(pt.amount)}</strong></p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleActionValidation(pt._id, 'Rejected')} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors">
                    Tolak
                  </button>
                  <button onClick={() => handleActionValidation(pt._id, 'Approved')} className="px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold transition-all shadow-sm">
                    ACC / Sahkan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kontrol Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="text-sm font-bold text-slate-700">Filter Jurnal Umum:</div>
        <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium outline-none" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
          <option value="">Semua Bulan</option>
          {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
        <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium outline-none" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="">Semua Tahun</option>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Riwayat Transaksi Utama */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-lg">Buku Jurnal Umum Kas Sah</h3>
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">Tidak ada transaksi tercatat pada periode filter ini.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-900">No</th>
                  <th className="px-6 py-4 font-bold text-slate-900">Tanggal</th>
                  <th className="px-6 py-4 font-bold text-slate-900">Nominal</th>
                  <th className="px-6 py-4 font-bold text-slate-900">Jenis</th>
                  <th className="px-6 py-4 font-bold text-slate-900">Keterangan</th>
                  <th className="px-6 py-4 font-bold text-slate-900">Oleh</th>
                  {isAuthorized && <th className="px-6 py-4 font-bold text-slate-900 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t, index) => (
                  <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{index + 1}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">{new Date(t.createdAt).toLocaleString('id-ID', { dateStyle: 'medium' })}</td>
                    <td className={`px-6 py-4 font-black ${t.type === 'Masuk' ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(t.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.type === 'Masuk' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {t.type === 'Masuk' ? 'Debit' : 'Kredit'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 truncate max-w-xs">{t.description}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{t.section} {t.receiptNumber && `• ${t.receiptNumber}`}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">{t.createdBy?.fullName}</span>
                    </td>
                    {isAuthorized && (
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenEdit(t)} className="px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors">Edit</button>
                          <button onClick={() => handleDelete(t._id)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors">Hapus</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">{isEditMode ? 'Edit Transaksi Kas' : 'Catat Kas Baru'}</h3>
            </div>
            <form onSubmit={handleInputSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Jenis Mutasi</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm outline-none" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                  <option value="Masuk">Uang Masuk (Debit)</option>
                  <option value="Keluar">Uang Keluar (Kredit)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Nominal (Rp)</label>
                  <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm outline-none" value={form.amountDisplay} onChange={handleAmountChange} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Alokasi Seksi</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm outline-none" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                    <option value="Umum">Kas Umum</option>
                    <option value="Infak">Kas Infak</option>
                    <option value="Bekakas">Kas Bekakas</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Deskripsi / Keterangan</label>
                <textarea required rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm resize-none outline-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm">Batal</button>
                <button type="submit" disabled={isSubmitting || !form.description || !form.amountRaw} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">
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
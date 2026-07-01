// frontend/app/dashboard/infak/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';
import * as XLSX from 'xlsx'; // TAMBAHAN: Import library excel

interface InfakRecord {
  _id: string;
  description: string;
  type: 'Masuk' | 'Keluar';
  amount: number;
  date: string;
  status: 'Belum Disetor' | 'Menunggu Konfirmasi' | 'Lunas' | 'Ditolak';
  createdBy: {
    fullName: string;
    role: string;
  };
}

export default function InfakKurbanPage() {
  const [records, setRecords] = useState<InfakRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<InfakRecord[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [filterType, setFilterType] = useState('Semua');
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
  const [form, setForm] = useState({ description: '', type: 'Masuk', amountRaw: '', amountDisplay: '', date: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    setUserRole(role || '');
    loadInfakData();
  }, []);

  useEffect(() => {
    let result = [...records];
    if (filterType !== 'Semua') result = result.filter(r => r.type === filterType);
    if (filterMonth) result = result.filter(r => new Date(r.date).getMonth() + 1 === parseInt(filterMonth));
    if (filterYear) result = result.filter(r => new Date(r.date).getFullYear() === parseInt(filterYear));
    setFilteredRecords(result);
  }, [records, filterType, filterMonth, filterYear]);

  const loadInfakData = async () => {
    try {
      const data = await fetchAPI('/infak', { method: 'GET' });
      setRecords(data);
    } catch (err) {
      alert('Gagal memuat catatan kas infak');
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
    setForm({ description: '', type: 'Masuk', amountRaw: '', amountDisplay: '', date: new Date().toISOString().split('T')[0] });
    setIsOpen(true);
  };

  const handleOpenEdit = (r: InfakRecord) => {
    setIsEditMode(true);
    setEditId(r._id);
    const formattedDate = new Date(r.date).toISOString().split('T')[0];
    const formattedAmount = new Intl.NumberFormat('id-ID').format(r.amount);
    setForm({ description: r.description, type: r.type, amountRaw: r.amount.toString(), amountDisplay: formattedAmount, date: formattedDate });
    setIsOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(form.amountRaw);
    if (!form.description || isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const endpoint = isEditMode ? `/infak/${editId}` : '/infak';
      const method = isEditMode ? 'PUT' : 'POST';
      await fetchAPI(endpoint, { method, body: JSON.stringify({ ...form, amount: parsedAmount }) });
      setIsOpen(false);
      loadInfakData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan catatan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForwardToTreasurer = async (id: string, type: 'Masuk' | 'Keluar', desc: string) => {
    const confirmMsg = type === 'Masuk' 
      ? `Setorkan dana iuran "${desc}" ini ke Bendahara untuk disahkan masuk brankas?`
      : `Ajukan permohonan pencairan dana "${desc}" ini ke Bendahara?`;

    if (window.confirm(confirmMsg)) {
      try {
        await fetchAPI(`/infak/${id}/deposit`, { method: 'PUT' });
        loadInfakData();
      } catch (err: any) {
        alert(err.message || 'Gagal meneruskan berkas');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus rekaman catatan kas infak ini?')) {
      try {
        await fetchAPI(`/infak/${id}`, { method: 'DELETE' });
        loadInfakData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus');
      }
    }
  };

  // TAMBAHAN: Fungsi Eksport Data ke Spreadsheet Excel
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) return alert('Tidak ada data untuk diexport.');
    const excelData = filteredRecords.map((r, index) => ({
      'No': index + 1,
      'Tanggal': new Date(r.date).toLocaleDateString('id-ID'),
      'Nominal Kas (Rp)': r.amount,
      'Aliran Arus': r.type === 'Masuk' ? 'Uang Masuk (Debit)' : 'Penyaluran (Kredit)',
      'Keterangan / Alokasi': r.description,
      'Status Audit': r.status,
      'Pencatat Sistem': r.createdBy?.fullName
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kas_Infak');
    XLSX.writeFile(workbook, `Laporan_Kas_Infak_Kurban.xlsx`);
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  if (isLoading) return <div className="p-4 text-center text-slate-600 animate-pulse">Membuka lembar pertanggungjawaban infak...</div>;

  const isInfakManager = userRole === 'Infak';

  const totalIn = records.filter(r => r.type === 'Masuk' && r.status === 'Lunas').reduce((sum, r) => sum + r.amount, 0);
  const totalOut = records.filter(r => r.type === 'Keluar' && r.status === 'Lunas').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Kas Infak & Sosial Kurban</h1>
          <p className="text-sm text-slate-600 mt-1">Laporan transparansi dana umat, iuran kurban bulanan, dan penyaluran sosial warga.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Tombol Cetak Excel */}
          <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
            Export Excel
          </button>
          {isInfakManager && (
            <button onClick={handleOpenCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:bg-indigo-700 transition-colors">
              + Catat Mutasi Infak
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Finansial */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Saldo Bersih Sah (Brankas)</p>
          <p className="text-2xl font-semibold mt-1 text-slate-800">{formatRupiah(totalIn - totalOut)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Pemasukan Lunas</p>
          <p className="text-2xl font-semibold mt-1 text-emerald-600">{formatRupiah(totalIn)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Pengeluaran Disetujui</p>
          <p className="text-2xl font-semibold mt-1 text-red-600">{formatRupiah(totalOut)}</p>
        </div>
      </div>

      {/* Filter Kontrol */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="text-sm font-medium text-slate-700">Filter Pencatatan:</div>
        <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="Semua">All Aliran Dana</option>
          <option value="Masuk">Uang Masuk</option>
          <option value="Keluar">Uang Keluar</option>
        </select>
        <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
          <option value="">Semua Bulan</option>
          {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
        <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="">Semua Tahun</option>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tabel Utama Kas */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Tanggal</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Nominal</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Jenis</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Keterangan / Alokasi</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Status Otorisasi</th>
              {isInfakManager && <th className="px-6 py-4 text-right text-slate-700 font-semibold">Aksi Operasional</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">Belum ada rekaman pembukuan infak pada periode ini.</td>
              </tr>
            ) : (
              filteredRecords.map(row => (
                <tr key={row._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-600 font-mono">{new Date(row.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                  <td className={`px-6 py-4 font-semibold ${row.type === 'Masuk' ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(row.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${row.type === 'Masuk' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {row.type === 'Masuk' ? 'Debit' : 'Kredit'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-800 font-medium truncate max-w-xs" title={row.description}>{row.description}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      row.status === 'Lunas' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      row.status === 'Menunggu Konfirmasi' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' : 
                      row.status === 'Ditolak' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                      {row.status === 'Belum Disetor' && row.type === 'Keluar' ? 'Belum Diajukan' : row.status}
                    </span>
                  </td>
                  {isInfakManager && (
                    <td className="px-6 py-4 text-right space-x-2">
                      {/* REVISI UTAMA: Tombol aksi terbuka jika statusnya Belum Disetor ATAU Ditolak */}
                      {(row.status === 'Belum Disetor' || row.status === 'Ditolak') ? (
                        <>
                          <button onClick={() => handleForwardToTreasurer(row._id, row.type, row.description)} className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md text-xs font-medium transition-colors">
                            {row.type === 'Masuk' ? 'Setor' : 'Ajukan'}
                          </button>
                          <button onClick={() => handleOpenEdit(row)} className="px-2.5 py-1.5 bg-slate-100 text-amber-700 border border-slate-200 hover:bg-slate-200 rounded-md text-xs font-medium transition-colors">Edit</button>
                          <button onClick={() => handleDelete(row._id)} className="px-2.5 py-1.5 bg-slate-100 text-red-600 border border-slate-200 hover:bg-slate-200 rounded-md text-xs font-medium transition-colors">Hapus</button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500 italic font-medium select-none">Berkas Terkunci</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL INPUT MUTASI KAS */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">{isEditMode ? 'Edit Mutasi Infak' : 'Catat Kas Infak Baru'}</h3>
            </div>
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Aliran Arus Dana</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                  <option value="Masuk">Uang masuk (Debit)</option>
                  <option value="Keluar">Uang Keluar (Kredit)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                  <input required type="text" placeholder="Contoh: 50.000" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={form.amountDisplay} onChange={handleAmountChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Catatan</label>
                <textarea required rows={3} placeholder="Contoh: Pembelian sembako duka warga atau Iuran kurban bulanan" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 resize-none outline-none focus:border-indigo-500 font-normal" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting || !form.description || !form.amountRaw} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Memproses...' : 'Simpan Berkas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
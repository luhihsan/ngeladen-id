// frontend/app/dashboard/bekakas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';
import * as XLSX from 'xlsx';

interface Asset {
  _id: string;
  name: string;
  quantity: number;
  rentPrice: number;
}

interface RentedItem {
  asset: { _id: string; name: string; rentPrice: number } | string;
  quantity: number;
}

interface BekakasLog {
  _id: string;
  description: string;
  type: 'Masuk' | 'Keluar';
  amount: number;
  date: string;
  startDate: string;
  endDate: string;
  status: 'Belum Disetor' | 'Menunggu Konfirmasi' | 'Lunas' | 'Ditolak';
  renterName?: string;
  rentedItems: RentedItem[];
  receiptNumber?: string;
}

interface SelectedItemRow {
  assetId: string;
  quantity: number | string;
}

export default function BekakasManagementPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [logs, setLogs] = useState<BekakasLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<BekakasLog[]>([]);
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState<'inventaris' | 'keuangan'>('inventaris');
  const [isLoading, setIsLoading] = useState(true);

  // States Filter Jurnal Bekakas
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

  // States Modal Asset Form
  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({ name: '', quantity: '', rentPriceRaw: '', rentPriceDisplay: '' });

  // States Modal Transaksi Form
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logForm, setLogForm] = useState({ description: '', type: 'Masuk', amountRaw: '0', amountDisplay: '0', date: '', startDate: '', endDate: '', renterName: '' });
  const [rentedItems, setRentedItems] = useState<SelectedItemRow[]>([{ assetId: '', quantity: 1 }]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    setUserRole(role || '');
    loadBekakasData();
  }, []);

  // Penerapan Filter Waktu Bulan dan Tahun pada Log Keuangan Bekakas Pemuda
  useEffect(() => {
    let result = [...logs];
    if (filterMonth) result = result.filter(l => new Date(l.date).getMonth() + 1 === parseInt(filterMonth));
    if (filterYear) result = result.filter(l => new Date(l.date).getFullYear() === parseInt(filterYear));
    setFilteredLogs(result);
  }, [logs, filterMonth, filterYear]);

  useEffect(() => {
    if (logForm.type === 'Masuk') {
      let totalCost = 0;
      let descriptionParts: string[] = [];

      rentedItems.forEach(item => {
        const targetAsset = assets.find(a => a._id === item.assetId);
        if (targetAsset) {
          const qty = typeof item.quantity === 'string' ? (parseInt(item.quantity) || 0) : item.quantity;
          totalCost += targetAsset.rentPrice * qty;
          descriptionParts.push(`${targetAsset.name} (${qty} Unit)`);
        }
      });

      setLogForm(prev => ({
        ...prev,
        amountRaw: totalCost.toString(),
        amountDisplay: new Intl.NumberFormat('id-ID').format(totalCost),
        description: descriptionParts.length > 0 
          ? `Sewa Alat Pemuda c/o ${prev.renterName || 'Warga'}: ${descriptionParts.join(', ')}` 
          : prev.description
      }));
    }
  }, [rentedItems, logForm.renterName, logForm.type, assets]);

  const loadBekakasData = async () => {
    try {
      const [assetsData, logsData] = await Promise.all([
        fetchAPI('/bekakas/assets', { method: 'GET' }),
        fetchAPI('/bekakas/logs', { method: 'GET' })
      ]);
      setAssets(assetsData);
      setLogs(logsData);
    } catch (err) {
      alert('Gagal memuat manifes aset pengurus bekakas pemuda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssetModal = () => {
    setAssetForm({ name: '', quantity: '', rentPriceRaw: '', rentPriceDisplay: '' }); 
    setIsAssetOpen(true);
  };

  const handleAssetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const formattedValue = rawValue ? new Intl.NumberFormat('id-ID').format(Number(rawValue)) : '';
    setAssetForm({ ...assetForm, rentPriceRaw: rawValue, rentPriceDisplay: formattedValue });
  };

  const handleOpenLogModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setLogForm({ description: '', type: 'Masuk', amountRaw: '0', amountDisplay: '0', date: today, startDate: today, endDate: today, renterName: '' });
    setRentedItems([{ assetId: '', quantity: 1 }]); 
    setIsLogOpen(true);
  };

  const handleAddRowItem = () => {
    setRentedItems([...rentedItems, { assetId: '', quantity: 1 }]);
  };

  const handleRemoveRowItem = (index: number) => {
    if (rentedItems.length === 1) return;
    setRentedItems(rentedItems.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof SelectedItemRow, value: string) => {
    const updated = [...rentedItems];
    if (field === 'quantity') {
      updated[index].quantity = value === '' ? '' : (parseInt(value) || 0);
    } else {
      updated[index].assetId = value;
    }
    setRentedItems(updated);
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchAPI('/bekakas/assets', {
        method: 'POST',
        body: JSON.stringify({ name: assetForm.name, quantity: parseInt(assetForm.quantity), rentPrice: parseFloat(assetForm.rentPriceRaw) })
      });
      setIsAssetOpen(false);
      loadBekakasData();
    } catch (err) { alert('Gagal menyimpan alat.'); } finally { setIsSubmitting(false); }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        description: logForm.description,
        type: logForm.type,
        amount: parseFloat(logForm.amountRaw),
        date: logForm.date,
        startDate: logForm.type === 'Masuk' ? logForm.startDate : null,
        endDate: logForm.type === 'Masuk' ? logForm.endDate : null,
        renterName: logForm.type === 'Masuk' ? logForm.renterName : '',
        rentedItems: logForm.type === 'Masuk' 
          ? rentedItems.map(item => ({ asset: item.assetId, quantity: typeof item.quantity === 'string' ? 1 : item.quantity })) 
          : []
      };
      await fetchAPI('/bekakas/logs', { method: 'POST', body: JSON.stringify(payload) });
      setIsLogOpen(false);
      loadBekakasData();
    } catch (err) { alert('Gagal menyimpan log keuangan.'); } finally { setIsSubmitting(false); }
  };

  const handleForwardToTreasurer = async (id: string, type: string) => {
    const msg = type === 'Masuk' ? 'Setorkan laporan sewa alat ini ke Bendahara Pemuda?' : 'Ajukan klaim dana perawatan alat ke Bendahara Pemuda?';
    if (window.confirm(msg)) {
      try {
        await fetchAPI(`/bekakas/logs/${id}/deposit`, { method: 'PUT' });
        loadBekakasData();
      } catch (err: any) { alert(err.message || 'Gagal menyetorkan nota.'); }
    }
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  if (isLoading) return <div className="p-4 text-center text-slate-500 animate-pulse">Menyinkronkan data inventaris bekakas pemuda...</div>;
  const isBekakasManager = userRole === 'Bekakas';

  const hasStockViolation = logForm.type === 'Masuk' && rentedItems.some(item => {
    const asset = assets.find(a => a._id === item.assetId);
    const qty = typeof item.quantity === 'string' ? 0 : item.quantity;
    return asset ? qty > asset.quantity : false;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Manajemen Aset & Perlengkapan Pemuda</h1>
          <p className="text-sm text-slate-600 mt-0.5">Pengelolaan inventaris barang pemuda, administrasi penyewaan warga, dan pelaporan keuangan terpusat.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {activeTab === 'keuangan' && (
            <button onClick={handleExportExcel} className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">Export Excel</button>
          )}
          {isBekakasManager && (
            <button onClick={activeTab === 'inventaris' ? handleOpenAssetModal : handleOpenLogModal} className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
              {activeTab === 'inventaris' ? 'Tambah Aset Baru' : 'Terbitkan Nota Sewa'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab('inventaris')} className={`px-4 py-2.5 text-sm transition-colors border-b-2 ${activeTab === 'inventaris' ? 'font-medium border-indigo-600 text-indigo-600' : 'font-normal border-transparent text-slate-600 hover:text-slate-900'}`}>Inventaris Aset Pemuda</button>
        <button onClick={() => setActiveTab('keuangan')} className={`px-4 py-2.5 text-sm transition-colors border-b-2 ${activeTab === 'keuangan' ? 'font-medium border-indigo-600 text-indigo-600' : 'font-normal border-transparent text-slate-600 hover:text-slate-900'}`}>Buku Kas & Riwayat Nota</button>
      </div>

      {activeTab === 'inventaris' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assets.map(a => {
            const activeRentals = logs.filter(l => 
              l.type === 'Masuk' && 
              l.status === 'Lunas' &&
              l.rentedItems.some(ri => (typeof ri.asset === 'object' ? ri.asset._id : ri.asset) === a._id)
            );

            return (
              <div key={a._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-medium text-slate-900 text-base border-b border-slate-100 pb-2">{a.name}</h4>
                  <div className="text-sm text-slate-600 space-y-1 mt-2">
                    <p>Total Stok Gudang: <span className="font-semibold text-slate-900">{a.quantity} Unit</span></p>
                    <p>Tarif Harga Sewa: <span className="font-semibold text-indigo-600">{formatRupiah(a.rentPrice)} / unit</span></p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-lg">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Status Distribusi:</p>
                  {activeRentals.length === 0 ? (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">Seluruh unit tersedia di gudang pemuda</p>
                  ) : (
                    <div className="space-y-1 mt-1 max-h-24 overflow-y-auto pr-1">
                      {activeRentals.map(l => {
                        const rowAsset = l.rentedItems.find(ri => (typeof ri.asset === 'object' ? ri.asset._id : ri.asset) === a._id);
                        return (
                          <p key={l._id} className="text-xs text-slate-700">
                            • Keluar <span className="font-semibold">{rowAsset?.quantity} unit</span> c/o {l.renterName} (s.d. {new Date(l.endDate).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit'})})
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'keuangan' && (
        <div className="space-y-4">
          {/* Kontrol Filter Waktu Seragam */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="text-sm font-medium text-slate-700">Filter Pencatatan:</div>
            <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
              <option value="">Semua Bulan</option>
              {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
            <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none font-normal focus:border-indigo-500" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="">Semua Tahun</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Tanggal</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">No. Invoice</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Total Biaya</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Masa Sewa Alat</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Rincian Nota</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Status Pembukuan</th>
                  {isBekakasManager && <th className="px-6 py-4 text-right font-semibold text-slate-700">Otorisasi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-medium">Tidak ada rekaman transaksi sewa pada periode filter ini.</td>
                  </tr>
                ) : (
                  filteredLogs.map(row => (
                    <tr key={row._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-600">{new Date(row.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                      <td className="px-6 py-4 text-xs font-semibold font-mono text-slate-700">{row.receiptNumber || '—'}</td>
                      <td className={`px-6 py-4 font-semibold ${row.type === 'Masuk' ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(row.amount)}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {row.startDate ? `${new Date(row.startDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})} - ${new Date(row.endDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium truncate max-w-xs" title={row.description}>{row.description}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          row.status === 'Lunas' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                          row.status === 'Menunggu Konfirmasi' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' : 
                          row.status === 'Ditolak' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>{row.status}</span>
                      </td>
                      {isBekakasManager && (
                        <td className="px-6 py-4 text-right">
                          {(row.status === 'Belum Disetor' || row.status === 'Ditolak') ? (
                            <button onClick={() => handleForwardToTreasurer(row._id, row.type)} className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md text-xs font-medium transition-colors">Setor</button>
                          ) : <span className="text-xs text-slate-400 italic select-none">Terkunci</span>}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL BUAT ASET BARU */}
      {isAssetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50"><h3 className="text-lg font-semibold text-slate-900">Registrasi Inventaris Alat Pemuda</h3></div>
            <form onSubmit={handleAssetSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Barang / Perkakas</label>
                <input required type="text" placeholder="Contoh: Piring Makan Melamin" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal" value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Unit Tersedia</label>
                  <input required type="number" placeholder="500" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal" value={assetForm.quantity} onChange={e => setAssetForm({ ...assetForm, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Harga Sewa / Unit (Rp)</label>
                  <input required type="text" placeholder="5.000" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal" value={assetForm.rentPriceDisplay} onChange={handleAssetPriceChange} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAssetOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting || !assetForm.name || !assetForm.rentPriceRaw} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Simpan Aset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOTA SEWA SCROLLABLE CONTAINER */}
      {isLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-xl shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50"><h3 className="text-lg font-semibold text-slate-900">Penerbitan Nota Sewa Alat Pemuda</h3></div>
            
            <form onSubmit={handleLogSubmit} className="p-5 max-h-[70vh] overflow-y-auto space-y-4 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Klasifikasi Pendanaan</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal" value={logForm.type} onChange={e => setLogForm({ ...logForm, type: e.target.value as any, amountRaw: '0', amountDisplay: '0', description: '' })}>
                    <option value="Masuk">Penyewaan Aset Pemuda (Saldo Masuk)</option>
                    <option value="Keluar">Biaya Servis / Perawatan Aset Pemuda (Saldo Keluar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Buku</label>
                  <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal" value={logForm.date} onChange={e => setLogForm({ ...logForm, date: e.target.value })} />
                </div>
              </div>

              {logForm.type === 'Masuk' ? (
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penyewa</label>
                      <input required type="text" placeholder="Bpk. Anto" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal" value={logForm.renterName} onChange={e => setLogForm({ ...logForm, renterName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mulai Sewa</label>
                      <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal" value={logForm.startDate} onChange={e => setLogForm({ ...logForm, startDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Selesai Sewa</label>
                      <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal" value={logForm.endDate} onChange={e => setLogForm({ ...logForm, endDate: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Daftar Pinjaman Alat Pemuda & Cek Stok</label>
                    {rentedItems.map((item, index) => {
                      const selectedAsset = assets.find(a => a._id === item.assetId);
                      const currentQty = typeof item.quantity === 'string' ? 0 : item.quantity;
                      const isOverStock = selectedAsset ? currentQty > selectedAsset.quantity : false;
                      
                      return (
                        <div key={index} className="flex items-start gap-2">
                          <div className="flex-1">
                            <select 
                              required 
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal" 
                              value={item.assetId} 
                              onChange={e => handleRowChange(index, 'assetId', e.target.value)}
                            >
                              <option value="">-- Pilih Perlengkapan --</option>
                              {assets.map(a => {
                                const isAlreadySelected = rentedItems.some((row, rowIdx) => row.assetId === a._id && rowIdx !== index);
                                
                                return (
                                  <option key={a._id} value={a._id} disabled={isAlreadySelected}>
                                    {a.name} {isAlreadySelected ? '(Sudah Dipilih)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                            {selectedAsset && (
                              <p className={`text-[11px] mt-1 font-medium ${isOverStock ? 'text-red-600' : 'text-slate-600'}`}>
                                Stok aktual gudang: {selectedAsset.quantity} unit {isOverStock && ' (⚠️ Ketersediaan unit tidak mencukupi!)'}
                              </p>
                            )}
                          </div>
                          <div className="w-24">
                            <input required type="number" min={1} placeholder="Qty" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal" value={item.quantity} onChange={e => handleRowChange(index, 'quantity', e.target.value)} />
                          </div>
                          <button type="button" onClick={() => handleRemoveRowItem(index)} className="px-3 py-2 bg-white border border-slate-300 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors" disabled={rentedItems.length === 1}>Hapus</button>
                        </div>
                      );
                    })}
                    <button type="button" onClick={handleAddRowItem} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">+ Tambah Baris Alat</button>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-600 font-medium">Total Akumulasi Biaya Sewa:</span>
                    <span className="text-lg font-semibold text-slate-900">{formatRupiah(Number(logForm.amountRaw) || 0)}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nominal Pengeluaran Kas Pemuda (Rp)</label>
                  <input required type="text" placeholder="Contoh: 15.000" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none font-normal" value={logForm.amountDisplay} onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setLogForm({ ...logForm, amountRaw: raw, amountDisplay: raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '' });
                  }} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Catatan Pembukuan</label>
                <textarea required rows={2} placeholder="Keterangan alokasi pendanaan..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 resize-none outline-none font-normal" value={logForm.description} onChange={e => setLogForm({ ...logForm, description: e.target.value })} />
              </div>

              {hasStockViolation && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 font-medium">
                  Gagal memproses: Jumlah permintaan sewa alat tertentu melebihi kapasitas unit aktual di gudang pemuda.
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsLogOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting || hasStockViolation || !logForm.description || !logForm.amountRaw} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">Simpan Berkas</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function handleExportExcel() {
    if (filteredLogs.length === 0) return alert('Tidak ada data.');
    const excelData = filteredLogs.map((l, index) => ({
      'No': index + 1,
      'Tanggal': new Date(l.date).toLocaleDateString('id-ID'),
      'Rincian Transaksi': l.description,
      'Jenis': l.type === 'Masuk' ? 'Sewa Masuk' : 'Biaya Keluar',
      'Total Biaya (Rp)': l.amount,
      'Masa Sewa': l.startDate ? `${new Date(l.startDate).toLocaleDateString('id-ID')} s.d ${new Date(l.endDate).toLocaleDateString('id-ID')}` : '-',
      'No. Nota': l.receiptNumber || '-',
      'Status': l.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kas_Bekakas');
    XLSX.writeFile(workbook, `Laporan_Kas_Seksi_Bekakas_Pemuda.xlsx`);
  }
}
// frontend/app/dashboard/agenda/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/utils/api';

interface Agenda {
  _id: string;
  title: string;
  date: string;
  type: 'Kerja Bakti' | 'Sinoman' | 'Laden Masjid' | 'Lainnya';
  location: string;
  description: string;
  status: 'Aktif' | 'Selesai';
  fineAmount: number;
}

export default function AgendaKegiatanPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [filteredAgendas, setFilteredAgendas] = useState<Agenda[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'Aktif' | 'Selesai'>('Aktif');
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
  
  const [form, setForm] = useState({ title: '', date: '', type: 'Kerja Bakti', location: '', description: '', fineAmountRaw: '', fineAmountDisplay: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    setUserRole(role || '');
    loadAgendas();
  }, []);

  useEffect(() => {
    let result = agendas.filter(a => a.status === activeTab);
    if (filterMonth) result = result.filter(a => new Date(a.date).getMonth() + 1 === parseInt(filterMonth));
    if (filterYear) result = result.filter(a => new Date(a.date).getFullYear() === parseInt(filterYear));
    setFilteredAgendas(result);
  }, [agendas, activeTab, filterMonth, filterYear]);

  const loadAgendas = async () => {
    try {
      const data = await fetchAPI('/agendas', { method: 'GET' });
      setAgendas(data);
    } catch (err: any) { 
      alert('Gagal memuat agenda'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleFineAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const formattedValue = rawValue ? new Intl.NumberFormat('id-ID').format(Number(rawValue)) : '';
    setForm({ ...form, fineAmountRaw: rawValue, fineAmountDisplay: formattedValue });
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setForm({ title: '', date: '', type: 'Kerja Bakti', location: '', description: '', fineAmountRaw: '', fineAmountDisplay: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (agenda: Agenda) => {
    setIsEditMode(true);
    setEditId(agenda._id);
    const formattedDate = new Date(agenda.date).toISOString().split('T')[0];
    const fineRaw = agenda.fineAmount ? agenda.fineAmount.toString() : '';
    const fineDisp = fineRaw ? new Intl.NumberFormat('id-ID').format(agenda.fineAmount) : '';
    
    setForm({
      title: agenda.title, date: formattedDate, type: agenda.type, location: agenda.location, description: agenda.description,
      fineAmountRaw: fineRaw, fineAmountDisplay: fineDisp
    });
    setIsOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = isEditMode ? `/agendas/${editId}` : '/agendas';
      const method = isEditMode ? 'PUT' : 'POST';
      const payload = {
        ...form,
        fineAmount: form.fineAmountRaw ? parseInt(form.fineAmountRaw) : 0
      };

      await fetchAPI(endpoint, { method, body: JSON.stringify(payload) });
      setIsOpen(false);
      loadAgendas();
    } catch (err: any) { 
      alert('Gagal menyimpan agenda'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleMarkComplete = async (id: string) => {
    if (window.confirm('Tandai kegiatan ini sudah selesai?')) {
      try { 
        await fetchAPI(`/agendas/${id}/complete`, { method: 'PUT' }); 
        loadAgendas(); 
      } catch (err: any) { 
        alert('Gagal menyelesaikan'); 
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus agenda kegiatan ini?')) {
      try { 
        await fetchAPI(`/agendas/${id}`, { method: 'DELETE' }); 
        loadAgendas(); 
      } catch (err: any) { 
        alert('Gagal menghapus'); 
      }
    }
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  if (isLoading) return <div className="p-4 text-center text-slate-700 animate-pulse">Menghubungkan data agenda...</div>;
  const isKetua = ['Ketua', 'Wakil Ketua'].includes(userRole);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Agenda Kegiatan Non-Rutin</h1>
          <p className="text-sm text-slate-600 mt-1">Pusat penugasan sinoman, kerja bakti, dan laden masjid warga.</p>
        </div>
        {isKetua && (
          <button onClick={handleOpenCreate} className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:bg-indigo-700 transition-colors">
            + Buat Agenda Baru
          </button>
        )}
      </div>

      {/* Tabs Kategori Kontrol Status */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto whitespace-nowrap">
        <button onClick={() => setActiveTab('Aktif')} className={`px-4 py-3 text-sm transition-colors border-b-2 ${activeTab === 'Aktif' ? 'font-semibold border-indigo-600 text-indigo-700' : 'font-medium border-transparent text-slate-600 hover:text-slate-800'}`}>
          Agenda Berjalan / Aktif
        </button>
        <button onClick={() => setActiveTab('Selesai')} className={`px-4 py-3 text-sm transition-colors border-b-2 ${activeTab === 'Selesai' ? 'font-semibold border-indigo-600 text-indigo-700' : 'font-medium border-transparent text-slate-600 hover:text-slate-800'}`}>
          Riwayat Selesai
        </button>
      </div>

      {/* Kontrol Dropdown Filter Periode */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="text-sm font-medium text-slate-700">Filter Periode:</div>
        <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-normal outline-none focus:border-indigo-500" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
          <option value="">Semua Bulan</option>
          {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
        <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-normal outline-none focus:border-indigo-500" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="">Semua Tahun</option>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Grid Utama Manifes Agenda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgendas.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-600 col-span-full text-sm font-medium">Tidak ada agenda kegiatan tercatat pada periode ini.</div>
        ) : (
          filteredAgendas.map(agenda => (
            <div key={agenda._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold text-xs rounded-md uppercase tracking-wide">{agenda.type}</span>
                  <span className="text-xs font-mono font-medium text-slate-600">📅 {new Date(agenda.date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg leading-snug">{agenda.title}</h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium flex items-center gap-1">📍 Lokasi: {agenda.location}</p>
                  
                  {/* Informasi Denda Kehadiran */}
                  {agenda.fineAmount > 0 && (
                     <p className="text-xs text-red-600 mt-2 font-semibold bg-red-50 border border-red-100 px-2.5 py-1 rounded-md w-fit">⚠️ Denda Alpa: {formatRupiah(agenda.fineAmount)}</p>
                  )}
                  
                  {agenda.description && (
                    <p className="text-sm text-slate-700 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 font-normal italic leading-relaxed">
                      "{agenda.description}"
                    </p>
                  )}
                </div>
              </div>

              {/* Baris Kontrol Manajemen Ketua */}
              {isKetua && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                  <button onClick={() => handleDelete(agenda._id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-medium rounded-md transition-colors">Hapus</button>
                  <button onClick={() => handleOpenEdit(agenda)} className="px-3 py-1.5 text-amber-600 hover:bg-amber-50 text-xs font-medium rounded-md transition-colors">Edit</button>
                  {agenda.status === 'Aktif' && (
                    <button onClick={() => handleMarkComplete(agenda._id)} className="px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium rounded-lg shadow-sm transition-colors">
                      Selesai
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* --- MODAL DIALOG DATA (DIPASTIKAN 100% HIGHLIGHT KONTRAS & NO BOLD LEBAY) --- */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">{isEditMode ? 'Edit Agenda Kegiatan' : 'Buat Agenda Baru'}</h3>
              <p className="text-xs text-slate-600 mt-1">Data penugasan akan disinkronisasikan ke sistem pengurus</p>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Agenda / Acara</label>
                <input required type="text" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none text-slate-800 font-normal text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" placeholder="Contoh: Kerja Bakti Massal RT" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Kegiatan</label>
                  <input required type="date" className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg outline-none text-slate-800 font-normal text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Acara</label>
                  <select className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg outline-none text-slate-800 font-normal text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                    <option value="Kerja Bakti">Kerja Bakti</option>
                    <option value="Sinoman">Sinoman</option>
                    <option value="Laden Masjid">Laden Masjid</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Tempat</label>
                  <input required type="text" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none text-slate-800 font-normal text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" placeholder="Contoh: Gedung Balai RT" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Besaran Denda (Rp)</label>
                  <input type="text" placeholder="Kosongkan jika tidak ada" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none text-slate-800 font-normal text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={form.fineAmountDisplay} onChange={handleFineAmountChange} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instruksi Tambahan (Opsional)</label>
                <textarea rows={2} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none font-normal text-slate-800 text-sm resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" placeholder="Contoh: Wajib membawa peralatan kebersihan masing-masing" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Memproses...' : 'Simpan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
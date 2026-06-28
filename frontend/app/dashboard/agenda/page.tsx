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
}

export default function AgendaKegiatanPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [filteredAgendas, setFilteredAgendas] = useState<Agenda[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- State Navigasi & Filter ---
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

  // --- State Modal Form CRUD ---
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState({ title: '', date: '', type: 'Kerja Bakti', location: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const role = JSON.parse(localStorage.getItem('userInfo') || '{}').role;
    setUserRole(role || '');
    loadAgendas();
  }, []);

  useEffect(() => {
    let result = agendas.filter(a => a.status === activeTab);

    if (filterMonth) {
      result = result.filter(a => new Date(a.date).getMonth() + 1 === parseInt(filterMonth));
    }
    if (filterYear) {
      result = result.filter(a => new Date(a.date).getFullYear() === parseInt(filterYear));
    }

    setFilteredAgendas(result);
  }, [agendas, activeTab, filterMonth, filterYear]);

  const loadAgendas = async () => {
    try {
      const data = await fetchAPI('/agendas', { method: 'GET' });
      setAgendas(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat agenda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setForm({ title: '', date: '', type: 'Kerja Bakti', location: '', description: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (agenda: Agenda) => {
    setIsEditMode(true);
    setEditId(agenda._id);
    // Format tanggal YYYY-MM-DD agar dibaca element HTML input date
    const formattedDate = new Date(agenda.date).toISOString().split('T')[0];
    setForm({
      title: agenda.title,
      date: formattedDate,
      type: agenda.type,
      location: agenda.location,
      description: agenda.description
    });
    setIsOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = isEditMode ? `/agendas/${editId}` : '/agendas';
      const method = isEditMode ? 'PUT' : 'POST';

      await fetchAPI(endpoint, { method, body: JSON.stringify(form) });
      setIsOpen(false);
      loadAgendas();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan agenda');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkComplete = async (id: string) => {
    if (window.confirm('Apakah anda yakin agenda sudah selesai?')) {
      try {
        await fetchAPI(`/agendas/${id}/complete`, { method: 'PUT' });
        loadAgendas();
      } catch (err: any) {
        alert(err.message || 'Gagal menyelesaikan agenda');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus lembar lempar agenda kegiatan ini?')) {
      try {
        await fetchAPI(`/agendas/${id}`, { method: 'DELETE' });
        loadAgendas();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus');
      }
    }
  };

  if (isLoading) return <div className="p-4 text-slate-500 animate-pulse">Menghubungkan data agenda...</div>;

  const isKetua = ['Ketua', 'Wakil Ketua'].includes(userRole);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda Kegiatan Non-Rutin</h1>
          <p className="text-sm text-slate-500">Pusat penugasan sinoman, kerja bakti, dan laden masjid. Terintegrasi ke seksi Kedisiplinan.</p>
        </div>
        {isKetua && (
          <button onClick={handleOpenCreate} className="w-full sm:w-auto px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 transition-all">
            + Buat Agenda Baru
          </button>
        )}
      </div>

      {/* TABS KATEGORI STATUS */}
      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab('Aktif')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'Aktif' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Agenda Berjalan / Aktif
        </button>
        <button onClick={() => setActiveTab('Selesai')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'Selesai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Riwayat Selesai
        </button>
      </div>

      {/* PANEL KONTROL FILTER BULAN & TAHUN */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="text-sm font-bold text-slate-700">Filter Periode:</div>
        <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium outline-none" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
          <option value="">Semua Bulan</option>
          {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
        <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium outline-none" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="">Semua Tahun</option>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* GRID DAFTAR AGENDA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgendas.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 col-span-full text-sm">Tidak ada agenda penugasan tercatat pada periode ini.</div>
        ) : (
          filteredAgendas.map(agenda => (
            <div key={agenda._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold text-[10px] rounded-lg tracking-wider uppercase">{agenda.type}</span>
                  <span className="text-xs font-mono font-bold text-slate-400">📅 {new Date(agenda.date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-snug">{agenda.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1">📍 Lokasi: {agenda.location}</p>
                  {agenda.description && <p className="text-sm text-slate-600 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium italic">"{agenda.description}"</p>}
                </div>
              </div>

              {/* BARIS AKSI KONTROL KETUA */}
              {isKetua && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                  <button onClick={() => handleDelete(agenda._id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors">Hapus</button>
                  <button onClick={() => handleOpenEdit(agenda)} className="px-3 py-1.5 text-amber-600 hover:bg-amber-50 text-xs font-bold rounded-lg transition-colors">Edit</button>
                  {agenda.status === 'Aktif' && (
                    <button onClick={() => handleMarkComplete(agenda._id)} className="px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-xl transition-all shadow-sm">
                      Selesai
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* --- MODAL FORM CRUD (Teks dipastikan 100% HITAM / SLATE-900) --- */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">{isEditMode ? 'Edit Agenda Kegiatan' : 'Buat Agenda Baru'}</h3>
              <p className="text-xs text-slate-400 mt-1">Data penugasan akan terekam ke sistem administrasi organisasi</p>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Nama Agenda / Kegiatan</label>
                <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 placeholder-slate-400 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" placeholder="Contoh: Sambatan Rumah Pak RT" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Tanggal Eksekusi</label>
                  <input required type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Kategori Acara</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                    <option value="Kerja Bakti">Kerja Bakti</option>
                    <option value="Sinoman">Sinoman</option>
                    <option value="Laden Masjid">Laden Masjid</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Lokasi Tempat</label>
                <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 placeholder-slate-400 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" placeholder="Contoh: Rumah Keluarga Pak RW" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Instruksi Tambahan Warga</label>
                <textarea rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-900 placeholder-slate-400 text-sm resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" placeholder="Contoh: Wajib membawa cangkul atau pakaian rapi" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Memproses...' : (isEditMode ? 'Simpan Perubahan' : 'Terbitkan Agenda')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// backend/src/controllers/activityController.js
const Meeting = require('../models/Meeting');
const { GroupLegi, KumpulanLegi } = require('../models/Discipline');
const Agenda = require('../models/Agenda');

const getAllActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const userGender = req.user.gender;

    // 1. Ambil data kelompok keanggotaan user yang sedang login
    const userGroup = await GroupLegi.findOne({ members: userId }).lean();

    // 2. Ambil seluruh data master secara paralel
    const [meetings, kumpulanLegi, agendas] = await Promise.all([
      Meeting.find().lean(),
      KumpulanLegi.find().populate('assignedGroup', 'name').lean(),
      Agenda.find().lean()
    ]);

    // 3. Mapping data Rapat dari Sekretaris (Rapat Rutin & Rapat Insidental)
    const mappedMeetings = meetings.map(m => ({
      id: m._id,
      title: m.title,
      date: m.date,
      category: m.isRoutine ? 'Rapat Rutin' : 'Rapat Insidental', // KATEGORI RESMI
      host: m.host || 'Ditentukan kemudian',
      description: m.notes ? m.notes.replace(/<[^>]*>/g, '').slice(0, 150) : 'Agenda pertemuan resmi organisasi.',
      allowedGender: 'Semua'
    }));

    // 4. Mapping data Kumpulan Minggu Legi dari Seksi Kedisiplinan
    const isManagement = ['Ketua', 'Wakil Ketua', 'Kedisiplinan', 'Sekretaris', 'Bendahara'].includes(userRole);
    
    // Filter privasi: Anggota biasa hanya melihat jadwal kelompoknya sendiri
    const filteredLegi = kumpulanLegi.filter(kl => {
      if (isManagement) return true;
      return userGroup && kl.assignedGroup && kl.assignedGroup._id.toString() === userGroup._id.toString();
    });

    const mappedLegi = filteredLegi.map(kl => ({
      id: kl._id,
      title: `Kumpulan Minggu Legi: ${kl.assignedGroup?.name || 'Semua Kelompok'}`,
      date: kl.date,
      category: 'Kumpulan Minggu Legi', // KATEGORI RESMI
      host: kl.location || 'Balai RT / Tempat Petugas',
      description: '', 
      allowedGender: 'Laki-laki'
    }));

    // 5. Mapping data Agenda dari Ketua (Agenda Kemasyarakatan)
    const mappedAgendas = agendas.map(a => ({
      id: a._id,
      title: a.title,
      date: a.date,
      category: 'Agenda Kemasyarakatan', // KATEGORI RESMI
      host: a.location || 'Lokasi Kondisional Lapangan',
      description: a.description || 'Kegiatan kemasyarakatan dan gotong royong warga.',
      allowedGender: 'Semua'
    }));

    // Satukan semua sumber agenda dan urutkan secara kronologis berdasarkan tanggal terdekat
    const unifiedTimeline = [...mappedMeetings, ...mappedLegi, ...mappedAgendas].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.json({
      success: true,
      userGender,
      activities: unifiedTimeline
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal merangkum data linimasa kegiatan', error: error.message });
  }
};

module.exports = { getAllActivities };
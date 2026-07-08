// backend/src/controllers/activityController.js
const Meeting = require('../models/Meeting');
const { KumpulanLegi } = require('../models/Discipline'); // Berdasarkan struktur repo lu[cite: 2]
const Agenda = require('../models/Agenda'); // Diimpor dinamis dari temuan internal[cite: 2]

const getAllActivities = async (req, res) => {
  try {
    const userGender = req.user.gender; // Ambil gender untuk validasi khusus laden pria[cite: 2]

    // Jalankan query secara paralel agar performa server kencang
    const [meetings, kumpulanLegi, agendas] = await Promise.all([
      Meeting.find().lean(),
      KumpulanLegi.find().populate('assignedGroup', 'name').lean(), // Populasikan nama kelompok legi[cite: 2]
      Agenda.find().lean()
    ]);

    // 1. Map data Rapat (Dari Sekretaris)
    const mappedMeetings = meetings.map(m => ({
      id: m._id,
      title: m.title,
      date: m.date,
      category: m.isRoutine ? 'Rapat Rutin' : 'Rapat Insidental',
      host: m.host || 'Ditentukan kemudian',
      description: 'Diharapkan hadir membawa buku iuran kas wajib warga.',
      allowedGender: 'Semua'
    }));

    // 2. Map data Kumpulan Minggu Legi (Dari Seksi Kedisiplinan)[cite: 2]
    const mappedLegi = kumpulanLegi.map(kl => ({
      id: kl._id,
      title: `Kumpulan Minggu Legi: ${kl.assignedGroup?.name || 'Semua Kelompok'}`,
      date: kl.date,
      category: 'Minggu Legi',
      host: kl.location || 'Balai RT / Tempat Petugas',
      description: `Jadwal giliran laden wajib ronda srawung pemuda kampung.`,
      allowedGender: 'Laki-laki' // Aturan internal: Laden minggu legi dikhususkan pria
    }));

    // 3. Map data Agenda Tambahan Non-Rutin (Dari Ketua)[cite: 2]
    const mappedAgendas = agendas.map(a => ({
      id: a._id,
      title: a.title,
      date: a.date,
      category: 'Agenda Ketua',
      host: a.location || 'Kondisional Lapangan',
      description: a.description || 'Kegiatan gotong royong non-rutin pemuda RT.',
      allowedGender: 'Semua'
    }));

    // Satukan seluruh array dan urutkan berdasarkan tanggal terdekat (Chronological Sorting)
    const unifiedTimeline = [...mappedMeetings, ...mappedLegi, ...mappedAgendas].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.json({
      success: true,
      userGender,
      activities: unifiedTimeline
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal merangkum linimasa kegiatan', error: error.message });
  }
};

module.exports = { getAllActivities };
// backend/src/controllers/meetingController.js
const Meeting = require('../models/Meeting');
const User = require('../models/User');

// Mendapatkan semua rapat
const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ date: 1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data rapat', error: error.message });
  }
};

// Membuat rapat baru
const createMeeting = async (req, res) => {
  const { title, date, isRoutine, host } = req.body;
  try {
    const meeting = await Meeting.create({ title, date, isRoutine, host, createdBy: req.user._id });
    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat rapat', error: error.message });
  }
};

// Update Notulensi
const addNotes = async (req, res) => {
  const { notes } = req.body;
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, { notes }, { new: true });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambah notulensi', error: error.message });
  }
};

// Logika Roulette/Randomizer
const getRandomHost = async (req, res) => {
  try {
    // 1. Ambil seluruh daftar pengguna/warga yang berstatus Aktif
    const activeUsers = await User.find({ status: 'Aktif' });
    if (activeUsers.length === 0) {
      return res.status(400).json({ message: 'Tidak ada anggota aktif di database' });
    }

    // 2. Ambil daftar nama host unik yang sudah pernah ketempatan rapat sebelumnya
    const usedHosts = await Meeting.find({ host: { $ne: null, $ne: '' } }).distinct('host');

    // 3. Saring anggota aktif yang namanya BELUM PERNAH ada di daftar usedHosts
    let eligibleUsers = activeUsers.filter(user => !usedHosts.includes(user.fullName));

    // 4. FALLBACK: Jika semua anggota sudah pernah ketempatan secara rata,
    //    reset putaran (semua anggota aktif berhak masuk undian roulette lagi)
    if (eligibleUsers.length === 0) {
      eligibleUsers = activeUsers;
    }

    // 5. Pilih satu pemenang secara acak murni dan adil
    const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
    const selectedHost = eligibleUsers[randomIndex].fullName;

    res.json({ host: selectedHost });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengacak undian ketempatan', error: error.message });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Agenda rapat tidak ditemukan' });
    }

    await meeting.deleteOne();
    res.json({ success: true, message: 'Agenda rapat berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus agenda rapat', error: error.message });
  }
};

// Pastikan deleteMeeting di-export di paling bawah file
module.exports = { getMeetings, createMeeting, addNotes, getRandomHost, deleteMeeting };
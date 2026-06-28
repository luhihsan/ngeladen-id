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
    // Ambil semua anggota yang statusnya Aktif
    const users = await User.find({ status: 'Aktif' }).select('fullName');
    if (users.length === 0) return res.status(404).json({ message: 'Tidak ada anggota aktif' });
    
    // Algoritma Randomize
    const randomIndex = Math.floor(Math.random() * users.length);
    const selectedHost = users[randomIndex];
    
    res.json({ host: selectedHost.fullName });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengacak jadwal', error: error.message });
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
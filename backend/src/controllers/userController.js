// backend/src/controllers/userController.js
const User = require('../models/User');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ fullName: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pengguna', error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  const { status, statusReason } = req.body;

  try {
    if (!['Aktif', 'Pasif', 'Keluar'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    // Menggunakan findByIdAndUpdate agar jauh lebih aman dan tidak men-trigger hook password
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status, statusReason: statusReason || '' },
      { new: true } // Mengembalikan data terbaru setelah di-update
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      status: updatedUser.status,
      statusReason: updatedUser.statusReason,
      message: `Status berhasil diubah menjadi ${updatedUser.status}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengubah status', error: error.message });
  }
};

const issueSP = async (req, res) => {
  const { spNumber, reason } = req.body;
  const fileUrl = req.file ? `/uploads/sp/${req.file.filename}` : null;

  try {
    const newSP = { spNumber, reason, fileUrl, createdAt: new Date() };

    // $push otomatis membuatkan array jika data User lama belum memilikinya
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { suratPeringatan: newSP } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.status(201).json({ 
      message: 'Surat Peringatan beserta dokumen berhasil diterbitkan', 
      suratPeringatan: updatedUser.suratPeringatan 
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menerbitkan SP', error: error.message });
  }
};

module.exports = { getAllUsers, updateUserStatus, issueSP };
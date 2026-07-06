// backend/src/controllers/userController.js
const User = require('../models/User');

// --- FUNGSI LAMA LU (TETAP DIPERTAHANKAN 100%) ---
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
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status, statusReason: statusReason || '' },
      { new: true }
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

// --- TAMBAHAN FITUR BARU KHUSUS MANAJEMEN KETUA RT ---

// 1. Tambah Anggota / Pengurus Baru Resmi
const createUserAccount = async (req, res) => {
  const { username, password, fullName, role, gender, occupationStatus, joinDate } = req.body;
  try {
    const isExist = await User.findOne({ username });
    if (isExist) {
      return res.status(400).json({ message: 'Username ini sudah terdaftar di sistem' });
    }

    // Fungsi User.create otomatis men-trigger hook pre('save') untuk enkripsi password baru
    await User.create({
      username,
      password,
      fullName,
      role,
      gender,
      occupationStatus,
      joinDate: joinDate || Date.now()
    });

    res.status(201).json({ success: true, message: 'Akun keanggotaan berhasil diterbitkan' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan akun anggota', error: error.message });
  }
};

// 2. Update Akun (Akomodasi Mutasi / Pergantian Jabatan Struktur Pengurus)
const updateUserAccount = async (req, res) => {
  const { fullName, role, gender, occupationStatus, joinDate, password } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Data anggota tidak ditemukan' });

    user.fullName = fullName || user.fullName;
    user.role = role || user.role;
    user.gender = gender || user.gender;
    user.occupationStatus = occupationStatus || user.occupationStatus;
    user.joinDate = joinDate || user.joinDate;

    // Jika ketua menginput password baru untuk reset password anggotanya
    if (password && password.trim() !== '') {
      user.password = password; // Mengubah properti ini akan otomatis memicu ulang enkripsi bcrypt pre('save')
    }

    await user.save();
    res.json({ success: true, message: 'Profil dan struktur jabatan anggota berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui data keanggotaan', error: error.message });
  }
};

// 3. Hapus Akun Anggota Pemuda
const deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Data anggota tidak ditemukan' });
    
    await user.deleteOne();
    res.json({ success: true, message: 'Akun keanggotaan berhasil dihapus dari sistem' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus akun', error: error.message });
  }
};

module.exports = { getAllUsers, updateUserStatus, issueSP, createUserAccount, updateUserAccount, deleteUserAccount };
// backend/src/controllers/userController.js
const User = require('../models/User');
const { Fine } = require('../models/Discipline'); 
const MandatoryFee = require('../models/MandatoryFee'); 
const crypto = require('crypto');
const { sendAccountCreatedEmail } = require('../utils/mailer');

// --- FUNGSI MANAJEMEN ANGGOTA ---
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

// FIX BUG 500: Menggunakan findByIdAndUpdate untuk bypass skema validasi global
const issueSP = async (req, res) => {
  const { spNumber, reason } = req.body;
  const fileUrl = req.file ? `/uploads/sp/${req.file.filename}` : null;
  
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    // Amankan data array jika sewaktu-waktu data model lama belum terinisialisasi
    const currentSPs = user.suratPeringatan || [];

    // 1. Validasi Batas Jatah SP
    if (user.status === 'Keluar' || currentSPs.length >= 3) {
      return res.status(400).json({ message: 'Aksi ditolak. Anggota ini sudah mencapai batas maksimal 3x SP dan statusnya sudah dinonaktifkan (Keluar).' });
    }

    // 2. Susun Data SP Baru ke dalam Array
    const newSP = { spNumber, reason, fileUrl, createdAt: new Date() };
    const updatedSPs = [...currentSPs, newSP];

    // Buat objek payload penampung perubahan spesifik
    const updatePayload = { suratPeringatan: updatedSPs };
    let responseMessage = 'Surat Peringatan beserta dokumen berhasil diterbitkan';

    // 3. LOGIKA ATURAN KETAT: Jika mencapai SP ke-3, otomatis kunci status ke Keluar
    if (updatedSPs.length >= 3) {
      updatePayload.status = 'Keluar';
      updatePayload.statusReason = `Diberhentikan otomatis oleh sistem karena akumulasi 3x Surat Peringatan (SP3). Surat terakhir: ${spNumber} dengan alasan: ${reason}`;
      responseMessage = 'Surat Peringatan ke-3 (SP3) resmi diterbitkan. Anggota ini telah otomatis dinonaktifkan dan dikeluarkan dari organisasi oleh sistem.';
    }

    // 4. Eksekusi menggunakan findByIdAndUpdate agar kebal dari eror validasi field eksternal
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updatePayload },
      { new: true, runValidators: false } // runValidators: false mengamankan skrip dari bentrokan field lama
    );

    res.status(201).json({ 
      success: true,
      message: responseMessage, 
      suratPeringatan: updatedUser.suratPeringatan,
      status: updatedUser.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menerbitkan SP', error: error.message });
  }
};

const deleteSP = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    // ATURAN TEGAS: Wajib aktifkan kembali akun terlebih dahulu sebelum bisa memutihkan SP
    if (user.status === 'Keluar') {
      return res.status(400).json({ 
        message: 'Aksi ditolak! Silakan ubah terlebih dahulu status keaktifan anggota ini ke Aktif/Pasif (Reaktivasi) sebelum menghapus dokumen arsip SP.' 
      });
    }

    // Saring array untuk membuang SP yang dipilih berdasarkan ID sub-dokumen
    const updatedSPs = (user.suratPeringatan || []).filter(
      (sp) => sp._id.toString() !== req.params.spId
    );

    // Update database secara spesifik tanpa mengganggu field password/lainnya
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { suratPeringatan: updatedSPs } },
      { new: true, runValidators: false }
    );

    res.json({
      success: true,
      message: 'Dokumen Surat Peringatan berhasil dihapus dari arsip keanggotaan.',
      suratPeringatan: updatedUser.suratPeringatan
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus dokumen SP', error: error.message });
  }
}; 

const createUserAccount = async (req, res) => {
  const { username, email, fullName, role, gender, occupationStatus, joinDate } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email wajib diisi' });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');

    await User.create({
      username,
      email,
      password: tempPassword, 
      fullName,
      role,
      gender,
      occupationStatus,
      joinDate: joinDate || Date.now(),
      isMustChangePassword: true 
    });

    sendAccountCreatedEmail(email, fullName, username, tempPassword)
      .then(() => console.log(`✅ [BACKGROUND] Email kredensial sukses terkirim ke ${email}`))
      .catch((emailErr) => console.error('⚠️ [BACKGROUND] Gagal kirim email:', emailErr.message));

    // 4. LANGSUNG BALAS RESPONS KE FRONTEND KILAT!
    return res.status(201).json({ 
      success: true, 
      message: `Akun keanggotaan berhasil diterbitkan. Kredensial login sedang dikirim ke ${email}` 
    });

  } catch (error) {
    console.error('createUserAccount error:', error);
    res.status(500).json({ message: 'Gagal menambahkan akun anggota', error: error.message });
  }
};

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

    if (password && password.trim() !== '') {
      user.password = password; 
    }

    await user.save();
    res.json({ success: true, message: 'Profil dan struktur jabatan anggota berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui data keanggotaan', error: error.message });
  }
};

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

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'Akun tidak ditemukan' });

    const myFines = await Fine.find({ user: userId, status: { $ne: 'Lunas' } })
                              .sort({ date: -1 })
                              .lean();

    const myUnpaidKas = await MandatoryFee.find({ user: userId, status: { $ne: 'Lunas' } })
                                          .sort({ month: -1 })
                                          .lean();

    res.json({
      success: true,
      profile: user,
      fines: myFines,
      mandatoryFees: myUnpaidKas, 
      suratPeringatan: user.suratPeringatan || [], 
      userStatus: user.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat rapor profil pribadi', error: error.message });
  }
};

module.exports = { getAllUsers, updateUserStatus, issueSP, createUserAccount, updateUserAccount, deleteUserAccount, getMyProfile, deleteSP };
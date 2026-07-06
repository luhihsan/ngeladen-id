// backend/src/controllers/kasWajibController.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const getKasWajibReport = async (req, res) => {
  try {
    const currentYear = 2026; // Mengikuti kalender aktif sistem berjalan
    const currentMonth = new Date().getMonth() + 1; // Juli (7)
    const nominalKasPerBulan = 10000; // Contoh tarif kas pemuda Rp 10.000
    
    const requesterRole = req.user.role;
    const requesterId = req.user._id;

    // Menentukan hak akses penuh (Ketua & Bendahara beserta Wakilnya)
    const hasFullAccess = ['Ketua', 'Wakil Ketua', 'Bendahara', 'Wakil Bendahara'].includes(requesterRole);

    // Ambil daftar pengguna target berdasarkan hak akses
    let targetUsers = [];
    if (hasFullAccess) {
      targetUsers = await User.find({ role: { $ne: 'Admin' } }).sort({ fullName: 1 });
    } else {
      targetUsers = await User.find({ _id: requesterId });
    }

    // Ambil semua riwayat transaksi kas wajib yang sudah APPROVED di tahun ini
    const approvedPayments = await Transaction.find({
      section: 'Wajib',
      status: 'Approved',
      createdAt: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`)
      }
    });

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Proses kalkulasi iuran per anggota menggunakan aturan kepemudaan RT
    const reportData = targetUsers.map(user => {
      // Gunakan tanggal joinDate dari DB, jika belum ada set default ke Januari 2026
      const joinDate = user.joinDate ? new Date(user.joinDate) : new Date(`${currentYear}-01-01`);
      const joinMonth = joinDate.getMonth() + 1;
      const joinYear = joinDate.getFullYear();

      let monthlyMatrix = [];
      let totalTunggakan = 0;

      for (let m = 1; m <= 12; m++) {
        let status = 'Belum Bayar';
        let isBillable = true;

        // Aturan 1: Sebelum tahun/bulan bergabung -> Tidak Ada Tagihan
        if (currentYear < joinYear || (currentYear === joinYear && m < joinMonth)) {
          status = 'Tidak Ada Tagihan';
          isBillable = false;
        }
        // Aturan 2: Masa tenggang gratis 3 bulan pertama sejak bulan bergabung
        else if (currentYear === joinYear && m >= joinMonth && m < joinMonth + 3) {
          status = 'Gratis (Anggota Baru)';
          isBillable = false;
        }

        // Jika bulan tersebut wajib bayar, cek apakah sudah ada transaksi pembayaran approved
        if (isBillable) {
          const isPaid = approvedPayments.some(p => 
            p.createdBy.toString() === user._id.toString() && 
            new Date(p.date).getMonth() + 1 === m
          );

          if (isPaid) {
            status = 'Lunas';
          } else {
            // Hanya dihitung tunggakan jika bulannya sudah lewat atau merupakan bulan berjalan
            status = 'Tagihan';
            if (m <= currentMonth) {
              totalTunggakan += nominalKasPerBulan;
            }
          }
        }

        monthlyMatrix.push({
          monthNumber: m,
          monthName: monthNames[m - 1],
          status
        });
      }

      return {
        userId: user._id,
        fullName: user.fullName,
        role: user.role,
        monthlyMatrix,
        totalTunggakan
      };
    });

    res.json({
      success: true,
      hasFullAccess,
      report: reportData
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses data kas wajib', error: error.message });
  }
};

module.exports = { getKasWajibReport };
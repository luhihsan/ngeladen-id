// backend/src/controllers/mandatoryFeeController.js
const MandatoryFee = require('../models/MandatoryFee');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const getFeeMatrix = async (req, res) => {
  const { year } = req.query; 
  const targetYear = year || new Date().getFullYear().toString();

  try {
    const users = await User.find({ status: 'Aktif' }).select('fullName occupationStatus').sort({ fullName: 1 });
    const fees = await MandatoryFee.find({
      period: { $regex: `^${targetYear}-` }
    });

    const matrix = users.map(user => {
      const userPayments = {};
      for (let m = 1; m <= 12; m++) {
        const monthStr = m.toString().padStart(2, '0');
        userPayments[`${targetYear}-${monthStr}`] = false;
      }

      fees.filter(f => f.user.toString() === user._id.toString()).forEach(f => {
        userPayments[f.period] = true;
      });

      return {
        _id: user._id,
        fullName: user.fullName,
        occupationStatus: user.occupationStatus,
        payments: userPayments
      };
    });

    res.json(matrix);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const payMandatoryFee = async (req, res) => {
  const { userId, period } = req.body; 
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const dateObj = new Date(`${period}-01`);
    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long' });
    const yearName = dateObj.getFullYear();
    const feeLog = await MandatoryFee.create({
      user: userId,
      period,
      amount: 10000,
      createdBy: req.user._id
    });

    await Transaction.create({
      description: `Kas Wajib Bulanan: ${monthName} ${yearName} (${user.fullName})`,
      type: 'Masuk',
      amount: 10000,
      section: 'Umum',
      status: 'Approved', 
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Kas wajib berhasil didebit ke jurnal utama', data: feeLog });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Anggota sudah melunasi kas pada bulan tersebut' });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFeeMatrix, payMandatoryFee };
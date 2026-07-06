// backend/src/controllers/transactionController.js
const Transaction = require('../models/Transaction');

// 1. AMBIL JURNAL + KALKULASI RINGKASAN TERPUSAT PER SEKSI (APPROVED ONLY)
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).populate('createdBy', 'fullName role');
    const approvedTransactions = await Transaction.find({ status: 'Approved' });
    
    // TAMBAHAN: Daftarkan pos bekakas ke kontainer akuntansi pusat
    let global = { masuk: 0, keluar: 0, saldo: 0 };
    let umum = { masuk: 0, keluar: 0, saldo: 0 };
    let infak = { masuk: 0, keluar: 0, saldo: 0 };
    let kedisiplinan = { masuk: 0, keluar: 0, saldo: 0 };
    let bekakas = { masuk: 0, keluar: 0, saldo: 0 }; // Pos baru

    approvedTransactions.forEach(t => {
      const nominal = Number(t.amount) || 0;
      if (t.type === 'Masuk') global.masuk += nominal;
      if (t.type === 'Keluar') global.keluar += nominal;

      if (t.section === 'Umum') {
        if (t.type === 'Masuk') umum.masuk += nominal;
        if (t.type === 'Keluar') umum.keluar += nominal;
      } else if (t.section === 'Infak') {
        if (t.type === 'Masuk') infak.masuk += nominal;
        if (t.type === 'Keluar') infak.keluar += nominal;
      } else if (t.section === 'Kedisiplinan') {
        if (t.type === 'Masuk') kedisiplinan.masuk += nominal;
        if (t.type === 'Keluar') kedisiplinan.keluar += nominal;
      } else if (t.section === 'Bekakas') { // Filter pos baru
        if (t.type === 'Masuk') bekakas.masuk += nominal;
        if (t.type === 'Keluar') bekakas.keluar += nominal;
      }
    });

    global.saldo = global.masuk - global.keluar;
    umum.saldo = umum.masuk - umum.keluar;
    infak.saldo = infak.masuk - infak.keluar;
    kedisiplinan.saldo = kedisiplinan.masuk - kedisiplinan.keluar;
    bekakas.saldo = bekakas.masuk - bekakas.keluar;

    res.json({ transactions, summary: { global, umum, infak, kedisiplinan, bekakas } });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 2. BUAT TRANSAKSI DARI BENDAHARA (AUTO-APPROVED)
const createTransaction = async (req, res) => {
  const { description, type, amount, section } = req.body;
  try {
    const transaction = await Transaction.create({
      description,
      type,
      amount: Number(amount),
      section: section || 'Umum',
      status: 'Approved', 
      createdBy: req.user._id
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mencatat transaksi', error: error.message });
  }
};

// 3. EDIT DATA KAS TRANSAKSI
const updateTransaction = async (req, res) => {
  const { description, type, amount, section } = req.body;
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

    transaction.description = description || transaction.description;
    transaction.type = type || transaction.type;
    transaction.amount = amount ? Number(amount) : transaction.amount;
    transaction.section = section || transaction.section;

    await transaction.save();
    res.json({ success: true, message: 'Transaksi diperbarui', data: transaction });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui transaksi', error: error.message });
  }
};

// 4. HAPUS DATA KAS TRANSAKSI
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    await transaction.deleteOne();
    res.json({ success: true, message: 'Transaksi dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus transaksi', error: error.message });
  }
};

// 5. OTORISASI VALIDASI KAS PENDING (ACC / REJECT)
const validateTransaction = async (req, res) => {
  const { status } = req.body;
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

    transaction.status = status;

    // Otomatis cetak nomor Nota Keluar Pusat jika disetujui & jenisnya Kredit
    if (status === 'Approved' && transaction.type === 'Keluar') {
      const count = await Transaction.countDocuments({ type: 'Keluar', receiptNumber: { $ne: null } });
      const uniqueId = Date.now().toString().slice(-4);
      transaction.receiptNumber = `NK-${transaction.section.toUpperCase()}-${uniqueId}-${count + 1}`;
    }

    await transaction.save();

    // SINKRONISASI RELASI 1: Kas Kedisiplinan (Denda)
    if (transaction.fineRef) {
      const { Fine } = require('../models/Discipline');
      await Fine.findByIdAndUpdate(transaction.fineRef, { status: status === 'Approved' ? 'Lunas' : 'Belum Bayar' });
    }

    // SINKRONISASI RELASI 2: Kas Infak & Kurban
    if (transaction.section === 'Infak') {
      const InfakKurban = require('../models/InfakKurban');
      await InfakKurban.findOneAndUpdate(
        { amount: transaction.amount, type: transaction.type, status: 'Menunggu Konfirmasi' },
        { status: status === 'Approved' ? 'Lunas' : 'Ditolak' }
      );
    }

    // TAMBAHAN RELASI 3: SINKRONISASI COK KAS SEKSI BEKAKAS (DENGAN ID REFERENSI MUTLAK)
    if (transaction.section === 'Bekakas') {
      const BekakasLog = require('../models/BekakasLog');
      const logStatusUpdate = status === 'Approved' ? 'Lunas' : 'Ditolak';
      
      let receiptNo = null;
      if (status === 'Approved') {
        const countLog = await BekakasLog.countDocuments({ receiptNumber: { $ne: null } });
        receiptNo = `NOTA-BKKS-${Date.now().toString().slice(-4)}-${countLog + 1}`;
      }

      await BekakasLog.findOneAndUpdate(
        { amount: transaction.amount, status: 'Menunggu Konfirmasi' },
        { status: logStatusUpdate, receiptNumber: receiptNo }
      );
    }

    res.json({ success: true, message: `Otorisasi berkas kas seksi tuntas diperbarui: ${status}` });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction, validateTransaction };
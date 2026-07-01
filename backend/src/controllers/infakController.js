// backend/src/controllers/infakController.js
const InfakKurban = require('../models/InfakKurban');
const Transaction = require('../models/Transaction');

const getInfakRecords = async (req, res) => {
  try {
    const records = await InfakKurban.find().sort({ date: -1 }).populate('createdBy', 'fullName role');
    res.json(records);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createInfakRecord = async (req, res) => {
  const { description, type, amount, date } = req.body;
  try {
    const record = await InfakKurban.create({
      description, type, amount, date,
      status: 'Belum Disetor', 
      createdBy: req.user._id
    });
    res.status(201).json(record);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateInfakRecord = async (req, res) => {
  const { description, type, amount, date } = req.body;
  try {
    const record = await InfakKurban.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Data tidak ditemukan' });
    
    if (record.status === 'Lunas' || record.status === 'Menunggu Konfirmasi') {
      return res.status(400).json({ message: 'Data yang sedang dikonfirmasi atau sudah lunas tidak boleh diubah' });
    }

    record.description = description || record.description;
    record.type = type || record.type;
    record.amount = amount || record.amount;
    record.date = date || record.date;

    await record.save();
    res.json({ success: true, data: record });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteInfakRecord = async (req, res) => {
  try {
    const record = await InfakKurban.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Data tidak ditemukan' });
    
    if (record.status === 'Lunas' || record.status === 'Menunggu Konfirmasi') {
      return res.status(400).json({ message: 'Data tidak boleh dihapus' });
    }

    await record.deleteOne();
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const depositInfakToTreasurer = async (req, res) => {
  try {
    const record = await InfakKurban.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Data tidak ditemukan' });
    if (record.status !== 'Belum Disetor' && record.status !== 'Ditolak') {
      return res.status(400).json({ message: 'Kas sudah berada dalam antrean atau sudah lunas' });
    }

    record.status = 'Menunggu Konfirmasi';
    await record.save();

    await Transaction.create({
      description: record.type === 'Masuk' ? `Setoran Kas Infak: ${record.description}` : `Pengajuan Dana Infak: ${record.description}`,
      type: record.type, 
      amount: record.amount,
      section: 'Infak',
      status: 'Pending',
      createdBy: req.user._id
    });

    res.json({ success: true, message: 'Berkas mutasi infak berhasil diteruskan ke Bendahara' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getInfakRecords, createInfakRecord, updateInfakRecord, deleteInfakRecord, depositInfakToTreasurer };
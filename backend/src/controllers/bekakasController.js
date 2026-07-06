const Asset = require('../models/Asset');
const BekakasLog = require('../models/BekakasLog');
const Transaction = require('../models/Transaction');

// --- MANAJEMEN ASET / INVENTARIS BARANG ---
const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find().sort({ name: 1 });
    res.json(assets);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createAsset = async (req, res) => {
  try {
    const asset = await Asset.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(asset);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: asset });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteAsset = async (req, res) => {
  try {
    await Asset.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Aset dihapus dari inventaris' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getBekakasLogs = async (req, res) => {
  try {
    const logs = await BekakasLog.find()
      .sort({ date: -1 })
      .populate('rentedItems.asset', 'name rentPrice');
    res.json(logs);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

const createBekakasLog = async (req, res) => {
  try {
    const log = await BekakasLog.create({ ...req.body, status: 'Belum Disetor', createdBy: req.user._id });
    res.status(201).json(log);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteBekakasLog = async (req, res) => {
  try {
    const log = await BekakasLog.findById(req.params.id);
    if (log.status === 'Lunas' || log.status === 'Menunggu Konfirmasi') {
      return res.status(400).json({ message: 'Berkas dalam antrean/lunas tidak boleh dihapus' });
    }
    await log.deleteOne();
    res.json({ success: true, message: 'Catatan keuangan dihapus' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const depositToTreasurer = async (req, res) => {
  try {
    const log = await BekakasLog.findById(req.params.id);
    if (log.status !== 'Belum Disetor' && log.status !== 'Ditolak') {
      return res.status(400).json({ message: 'Berkas sudah berada dalam antrean' });
    }

    log.status = 'Menunggu Konfirmasi';
    await log.save();

    // Kirim antrean transaksi ke Bendahara Pusat dengan menyisipkan ID referensi log bekakas
    await Transaction.create({
      description: log.type === 'Masuk' ? `Sewa Alat RT: ${log.description}` : `Biaya Perawatan Aset: ${log.description}`,
      type: log.type,
      amount: log.amount,
      section: 'Bekakas',
      status: 'Pending',
      bekakasLogRef: log._id, // KUNCI SAFE: Mencegah race condition pencocokan nominal
      createdBy: req.user._id
    });

    res.json({ success: true, message: 'Nota kas berhasil diteruskan ke Bendahara' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getAssets, createAsset, updateAsset, deleteAsset, getBekakasLogs, createBekakasLog, deleteBekakasLog, depositToTreasurer };
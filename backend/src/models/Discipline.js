// backend/src/models/Discipline.js
const mongoose = require('mongoose');

// Skema Kelompok Minggu Legi
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Skema Denda & Catatan Kedisiplinan
const fineSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Belum Bayar', 'Menunggu Konfirmasi', 'Lunas'], default: 'Belum Bayar' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Skema Kumpulan Minggu Legi (Baru)
const kumpulanLegiSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  location: { type: String, required: true },
  assignedGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupLegi', required: true },
  status: { type: String, enum: ['Aktif', 'Selesai'], default: 'Aktif' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const GroupLegi = mongoose.model('GroupLegi', groupSchema);
const Fine = mongoose.model('Fine', fineSchema);
const KumpulanLegi = mongoose.model('KumpulanLegi', kumpulanLegiSchema);

module.exports = { GroupLegi, Fine, KumpulanLegi };
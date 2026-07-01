// backend/src/models/InfakKurban.js
const mongoose = require('mongoose');

const infakKurbanSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Masuk', 'Keluar'], required: true },
  amount: { type: Number, required: true, min: [0, 'Nominal tidak boleh negatif'] },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Belum Disetor', 'Menunggu Konfirmasi', 'Lunas', 'Ditolak'], 
    default: 'Belum Disetor' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('InfakKurban', infakKurbanSchema);
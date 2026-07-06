// backend/src/models/BekakasLog.js
const mongoose = require('mongoose');

const bekakasLogSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Masuk', 'Keluar'], required: true }, 
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  startDate: { type: Date, default: null }, 
  endDate: { type: Date, default: null },   
  status: { 
    type: String, 
    enum: ['Belum Disetor', 'Menunggu Konfirmasi', 'Lunas', 'Ditolak'], 
    default: 'Belum Disetor' 
  },
  renterName: { type: String, default: '' },
  rentedItems: [{
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  receiptNumber: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('BekakasLog', bekakasLogSchema);
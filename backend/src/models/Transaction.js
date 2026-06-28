// backend/src/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Masuk', 'Keluar'], required: true },
  amount: { type: Number, required: true, min: [0, 'Jumlah uang tidak boleh negatif'] },
  section: { type: String, enum: ['Umum', 'Kedisiplinan', 'Infak', 'Bekakas', 'Lainnya'], default: 'Umum' },
  receiptNumber: { type: String, default: null },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
  fineRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Fine', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
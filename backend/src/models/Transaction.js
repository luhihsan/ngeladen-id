// backend/src/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Masuk', 'Keluar'], // Masuk = Debit, Keluar = Kredit
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Jumlah uang tidak boleh negatif'],
  },
  section: {
    type: String,
    enum: ['Umum', 'Kedisiplinan', 'Infak', 'Bekakas', 'Lainnya'],
    default: 'Umum', // Menentukan kas ini milik alokasi seksi mana
  },
  receiptNumber: {
    type: String, // Otomatis di-generate jika tipe transaksi adalah 'Keluar' (Nota Keluar)
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Melacak bendahara/pengurus mana yang menginput data
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
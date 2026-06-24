const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  // Menyimpan ID pengirim, tapi opsional (bisa disembunyikan di UI jika isAnonymous true)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Suggestion', suggestionSchema);
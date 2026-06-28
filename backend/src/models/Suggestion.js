const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  content: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['Pending', 'Selesai'], default: 'Pending' },
  response: { type: String, default: '' }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Suggestion', suggestionSchema);
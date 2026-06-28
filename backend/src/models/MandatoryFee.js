// backend/src/models/MandatoryFee.js
const mongoose = require('mongoose');

const mandatoryFeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true }, 
  amount: { type: Number, default: 10000 },
  paidAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

mandatoryFeeSchema.index({ user: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('MandatoryFee', mandatoryFeeSchema);
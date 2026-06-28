// backend/src/models/Meeting.js
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  isRoutine: { type: Boolean, default: false },
  notes: { type: String, default: '' }, 
  host: { type: String, default: '' }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
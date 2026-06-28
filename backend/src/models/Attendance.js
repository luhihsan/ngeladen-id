// backend/src/models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  type: { type: String, enum: ['Agenda', 'KumpulanLegi'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Bisa ID Agenda atau ID KumpulanLegi
  records: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Hadir', 'Alpa', 'Izin'], default: 'Alpa' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
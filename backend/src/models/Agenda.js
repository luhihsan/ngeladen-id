// backend/src/models/Agenda.js
const mongoose = require('mongoose');

const agendaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  type: { 
    type: String, 
    enum: ['Sinoman', 'Kerja Bakti', 'Laden Masjid', 'Lainnya'], 
    required: true 
  },
  location: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Aktif', 'Selesai'], default: 'Aktif' }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Agenda', agendaSchema);
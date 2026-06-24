// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Skema untuk detail Surat Peringatan
const spSchema = new mongoose.Schema({
  spNumber: { type: String, required: true },
  reason: { type: String, required: true },
  fileUrl: { type: String }, // Menyimpan path/URL file Word/PDF
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Kedisiplinan', 'Infak', 'Bekakas', 'Anggota'],
    default: 'Anggota',
  },
  status: {
    type: String,
    enum: ['Aktif', 'Pasif', 'Keluar'], // Penambahan status Keluar
    default: 'Aktif',
  },
  statusReason: {
    type: String, // Contoh: "Magang 6 bulan" atau "Sudah menikah"
    default: '',
  },
  suratPeringatan: {
    type: [spSchema],
    default: [],
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const spSchema = new mongoose.Schema({
  spNumber: { type: String, required: true },
  reason: { type: String, required: true },
  fileUrl: { type: String }, 
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
    enum: ['Aktif', 'Pasif', 'Keluar'], 
    default: 'Aktif',
  },
  statusReason: {
    type: String, 
    default: '',
  },
  gender: {
    type: String,
    enum: ['Laki-laki', 'Perempuan'],
    required: true,
    default: [],
  },
  suratPeringatan: {
    type: [spSchema],
    default: [],
  },
  occupationStatus: {
  type: String,
  enum: ['Pelajar/Mahasiswa', 'Bekerja'],
  default: [],
  },
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
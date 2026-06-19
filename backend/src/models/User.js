// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    enum: ['Ketua', 'Sekretaris', 'Bendahara', 'Kedisiplinan', 'Infak', 'Bekakas', 'Anggota'],
    default: 'Anggota',
  },
  status: {
    type: String,
    enum: ['Aktif', 'Pasif'],
    default: 'Aktif',
  }
}, { timestamps: true });

/**
 * Middleware Pre-Save (Mongoose Hook)
 * Bertugas melakukan hashing pada password sebelum disimpan ke database
 * untuk mencegah kebocoran kredensial (plaintext password).
 */
userSchema.pre('save', async function (next) {
  // Jika password tidak diubah, lanjutkan tanpa hashing ulang
  if (!this.isModified('password')) {
    next();
  }
  // Generate salt dan hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Method untuk membandingkan password input dengan hash di database.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
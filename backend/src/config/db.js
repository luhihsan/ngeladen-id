// backend/src/config/db.js
const mongoose = require('mongoose');

/**
 * Menginisialisasi koneksi ke MongoDB.
 * Menggunakan pendekatan async/await untuk error handling yang lebih baik.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error Database Connection: ${error.message}`);
    process.exit(1); // Hentikan server jika database gagal terkoneksi
  }
};

module.exports = connectDB;
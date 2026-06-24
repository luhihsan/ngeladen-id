require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 1. IMPORT ROUTER YANG UDAH LU BIKIN
const authRoutes = require('./src/routes/authRoutes'); // Pastikan path-nya sesuai dengan letak folder lu

const app = express();

app.use(cors());
app.use(express.json());

// 2. DAFTARKAN ROUTER KE EXPRESS
// Ini artinya semua request ke /api/auth akan diarahkan ke authRoutes
app.use('/api/auth', authRoutes);

console.log("Mencoba connect ke:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
  family: 4, 
  serverSelectionTimeoutMS: 5000, 
})
.then(() => {
  console.log("✅ Mantap! Database Mongoose berhasil connect!");
})
.catch((err) => {
  console.error("❌ Gagal connect database:", err.message);
});

// 3. NYALAKAN SERVER AGAR LISTEN DI PORT 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server backend berhasil jalan dan siap menerima request di port ${PORT}`);
});
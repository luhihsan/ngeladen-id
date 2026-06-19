// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');

// Inisialisasi koneksi Database
connectDB();

const app = express();

// Middleware dasar
app.use(cors()); // Mengizinkan request dari frontend
app.use(express.json()); // Mem-parsing body JSON

// Mendaftarkan Routes
app.use('/api/auth', authRoutes);

// Endpoint Health Check
app.get('/', (req, res) => {
  res.send('Ngeladen API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
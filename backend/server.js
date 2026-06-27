require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const path = require('path');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const suggestionRoutes = require('./src/routes/suggestionRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/transactions', transactionRoutes);

console.log("Mencoba connect ke:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
  family: 4, 
  serverSelectionTimeoutMS: 5000, 
})
.then(() => {
  console.log("Mongoose berhasil connect!");
})
.catch((err) => {
  console.error("❌ Gagal connect database:", err.message);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server backend berhasil jalan dan siap menerima request di port ${PORT}`);
});
// backend/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware untuk memastikan user sudah login (memiliki token JWT yang valid).
 */
const protect = async (req, res, next) => {
  let token;

  // Mengecek apakah request memiliki header Authorization berawalan "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Mengambil token saja (membuang kata "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Verifikasi token menggunakan Secret Key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Mencari user di database berdasarkan ID di dalam token, tapi password tidak dibawa
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Loloskan ke controller selanjutnya
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Akses ditolak, token tidak valid atau kadaluarsa' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Akses ditolak, tidak ada token' });
  }
};

/**
 * Middleware untuk RBAC (Role-Based Access Control).
 * Menerima array role yang diizinkan (contoh: ['Bendahara', 'Ketua']).
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    // Jika role user saat ini tidak ada di daftar yang diizinkan
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Akses ditolak. Jabatan ${req.user.role} tidak memiliki izin ke halaman ini` 
      });
    }
    next(); // Loloskan jika role sesuai
  };
};

module.exports = { protect, authorizeRole };
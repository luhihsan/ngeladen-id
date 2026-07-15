// backend/src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Utility untuk men-generate JWT Token.
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register user baru
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { username, password, fullName, role, gender, occupationStatus } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    const user = await User.create({
      username,
      password,
      fullName,
      role,
      gender,            
      occupationStatus  
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Data user tidak valid' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Auth user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    // Validasi eksistensi user dan kecocokan password hash
    if (user && (await user.matchPassword(password))) {
      
      // --- LOGIKA CEKAL AKSES AUTO-KICK JIKA STATUS KELUAR / SP3 ---
      if (user.status === 'Keluar') {
        // Cek apakah di-kick akibat akumulasi jatah 3x Surat Peringatan (SP3)
        if (user.suratPeringatan && user.suratPeringatan.length >= 3) {
          return res.status(403).json({ 
            message: 'Akses ditolak! Anda telah diberhentikan dari organisasi karena telah mencapai batas maksimal 3x Surat Peringatan (SP3).' 
          });
        }
        // Penolakan standar status keluar non-SP
        return res.status(403).json({ 
          message: 'Akses ditolak! Status keanggotaan Anda saat ini telah dinonaktifkan (Keluar).' 
        });
      }
      // --- AKHIR LOGIKA CEKAL AKSES ---

      res.json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Username atau password salah' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = { registerUser, loginUser };
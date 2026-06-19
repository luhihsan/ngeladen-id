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
 * @access  Public (Nantinya bisa dibatasi hanya Ketua yang bisa create)
 */
const registerUser = async (req, res) => {
  const { username, password, fullName, role } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    const user = await User.create({
      username,
      password,
      fullName,
      role
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
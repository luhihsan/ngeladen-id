const express = require('express');
const { createSuggestion, getSuggestions } = require('../controllers/suggestionController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Semua fungsi butuh token login
router.use(protect);

// Semua anggota bisa mengirim saran
router.post('/', createSuggestion);

// Hanya Ketua dan Wakil Ketua yang bisa membaca saran
router.get('/', authorizeRole('Ketua', 'Wakil Ketua'), getSuggestions);

module.exports = router;
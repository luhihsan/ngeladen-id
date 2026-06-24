const Suggestion = require('../models/Suggestion');

/**
 * @desc    Mengirim masukan/saran baru
 * @route   POST /api/suggestions
 * @access  Private (Semua anggota login bisa mengirim)
 */
const createSuggestion = async (req, res) => {
  const { content, isAnonymous } = req.body;
  try {
    const suggestion = await Suggestion.create({
      content,
      isAnonymous,
      // Jika anonim, ID pengirim tidak disave (atau disave tapi disembunyikan, ini pilihan desain. Kita pilih tidak disave agar benar-benar anonim)
      user: isAnonymous ? null : req.user._id, 
    });
    res.status(201).json(suggestion);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengirim masukan', error: error.message });
  }
};

/**
 * @desc    Melihat daftar masukan
 * @route   GET /api/suggestions
 * @access  Private (Hanya Ketua dan Wakil Ketua)
 */
const getSuggestions = async (req, res) => {
  try {
    // Populate untuk menarik nama pengirim (jika tidak anonim)
    const suggestions = await Suggestion.find()
      .populate('user', 'fullName role')
      .sort({ createdAt: -1 }); // Sorting dari yang terbaru
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil masukan', error: error.message });
  }
};

module.exports = { createSuggestion, getSuggestions };
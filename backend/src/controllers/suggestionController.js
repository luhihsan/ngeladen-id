const Suggestion = require('../models/Suggestion');

const createSuggestion = async (req, res) => {
  try {
    const { content, isAnonymous } = req.body;
    const suggestion = await Suggestion.create({
      content,
      isAnonymous,
      createdBy: req.user._id
    });
    res.status(201).json(suggestion);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengirim aspirasi', error: error.message });
  }
};

const getSuggestions = async (req, res) => {
  try {
    let query = {};
    const isKetua = ['Ketua', 'Wakil Ketua'].includes(req.user.role);
    
    // Jika bukan Ketua, HANYA BISA MELIHAT aspirasinya sendiri
    if (!isKetua) {
      query = { createdBy: req.user._id };
    }

    const suggestions = await Suggestion.find(query)
      .populate('createdBy', 'fullName role')
      .sort({ createdAt: -1 });

    // Format anonimitas agar nama pengirim tidak bocor ke Ketua jika diceklis
    const formatted = suggestions.map(s => {
      const doc = s.toJSON();
      if (doc.isAnonymous && isKetua) {
        doc.createdBy = { fullName: 'Anggota (Anonim)', role: 'Rahasia' };
      }
      return doc;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data aspirasi', error: error.message });
  }
};

const respondSuggestion = async (req, res) => {
  try {
    const { response } = req.body;
    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      { status: 'Selesai', response },
      { new: true }
    );
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menanggapi aspirasi', error: error.message });
  }
};

module.exports = { createSuggestion, getSuggestions, respondSuggestion };
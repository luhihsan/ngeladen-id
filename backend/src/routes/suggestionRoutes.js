const express = require('express');
const { createSuggestion, getSuggestions, respondSuggestion } = require('../controllers/suggestionController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/', createSuggestion);
router.get('/', getSuggestions);
router.put('/:id/respond', authorizeRole('Ketua', 'Wakil Ketua'), respondSuggestion); 

module.exports = router;
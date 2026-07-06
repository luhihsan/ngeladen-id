const express = require('express');
const router = express.Router();
const { getKasWajibReport } = require('../controllers/kasWajibController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/report', protect, getKasWajibReport);

module.exports = router;
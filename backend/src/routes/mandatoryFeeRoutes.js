// backend/src/routes/mandatoryFeeRoutes.js
const express = require('express');
const { getFeeMatrix, payMandatoryFee } = require('../controllers/mandatoryFeeController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect);
router.get('/matrix', getFeeMatrix);
router.post('/pay', authorizeRole('Bendahara', 'Wakil Bendahara'), payMandatoryFee);

module.exports = router;
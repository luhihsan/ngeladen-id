// backend/src/routes/transactionRoutes.js
const express = require('express');
const { createTransaction, getTransactions, updateTransaction, deleteTransaction } = require('../controllers/transactionController'); // Import fungsi baru
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getTransactions);
router.post('/', authorizeRole('Bendahara'), createTransaction);
router.put('/:id', authorizeRole('Bendahara'), updateTransaction);
router.delete('/:id', authorizeRole('Bendahara'), deleteTransaction);

module.exports = router;
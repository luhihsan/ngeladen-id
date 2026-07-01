const express = require('express');
const { getInfakRecords, createInfakRecord, updateInfakRecord, deleteInfakRecord, depositInfakToTreasurer } = require('../controllers/infakController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect);
router.get('/', getInfakRecords);
router.post('/', authorizeRole('Infak'), createInfakRecord);
router.put('/:id', authorizeRole('Infak'), updateInfakRecord);
router.delete('/:id', authorizeRole('Infak'), deleteInfakRecord);
router.put('/:id/deposit', authorizeRole('Infak'), depositInfakToTreasurer);

module.exports = router;
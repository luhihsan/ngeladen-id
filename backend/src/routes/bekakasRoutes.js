const express = require('express');
const { getAssets, createAsset, updateAsset, deleteAsset, getBekakasLogs, createBekakasLog, deleteBekakasLog, depositToTreasurer } = require('../controllers/bekakasController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/assets', getAssets);
router.get('/logs', getBekakasLogs);

router.post('/assets', authorizeRole('Bekakas'), createAsset);
router.put('/assets/:id', authorizeRole('Bekakas'), updateAsset);
router.delete('/assets/:id', authorizeRole('Bekakas'), deleteAsset);

router.post('/logs', authorizeRole('Bekakas'), createBekakasLog);
router.delete('/logs/:id', authorizeRole('Bekakas'), deleteBekakasLog);
router.put('/logs/:id/deposit', authorizeRole('Bekakas'), depositToTreasurer);

module.exports = router;
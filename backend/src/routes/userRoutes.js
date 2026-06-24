// backend/src/routes/userRoutes.js
const express = require('express');
const { getAllUsers, updateUserStatus, issueSP } = require('../controllers/userController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');
const { uploadSP } = require('../middlewares/uploadMiddleware'); // Import multer

const router = express.Router();

router.use(protect);
router.get('/', authorizeRole('Ketua', 'Wakil Ketua', 'Sekretaris', 'Kedisiplinan'), getAllUsers);
router.put('/:id/status', authorizeRole('Ketua', 'Wakil Ketua'), updateUserStatus);

// Sisipkan middleware uploadSP.single() di sini. 
// 'spDocument' adalah nama field dari FormData di frontend nanti.
router.post('/:id/sp', authorizeRole('Ketua', 'Wakil Ketua'), uploadSP.single('spDocument'), issueSP);

module.exports = router;
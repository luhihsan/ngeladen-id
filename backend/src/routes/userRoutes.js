// backend/src/routes/userRoutes.js
const express = require('express');
const { getAllUsers, updateUserStatus, issueSP, createUserAccount, updateUserAccount, deleteUserAccount } = require('../controllers/userController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');
const { uploadSP } = require('../middlewares/uploadMiddleware'); 

const router = express.Router();

router.use(protect);

// Rute lama tetap aman utuh
router.get('/', authorizeRole('Ketua', 'Wakil Ketua', 'Sekretaris', 'Kedisiplinan'), getAllUsers);
router.put('/:id/status', authorizeRole('Ketua', 'Wakil Ketua'), updateUserStatus);
router.post('/:id/sp', authorizeRole('Ketua', 'Wakil Ketua'), uploadSP.single('spDocument'), issueSP);

// Tambahan rute CRUD manajemen kepengurusan Ketua & Wakil Ketua
router.post('/', authorizeRole('Ketua', 'Wakil Ketua'), createUserAccount);
router.put('/:id', authorizeRole('Ketua', 'Wakil Ketua'), updateUserAccount);
router.delete('/:id', authorizeRole('Ketua', 'Wakil Ketua'), deleteUserAccount);

module.exports = router;
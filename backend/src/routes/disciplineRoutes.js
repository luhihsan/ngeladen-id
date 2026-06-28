// backend/src/routes/disciplineRoutes.js
const express = require('express');
const { 
  getGroups, createGroup, getFines, createFine, payFine,
  getKumpulanLegi, createKumpulanLegi, saveAttendance, getAttendanceData 
} = require('../controllers/disciplineController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/groups', getGroups);
router.get('/fines', getFines);
router.get('/kumpulan', getKumpulanLegi);
router.get('/attendance', getAttendanceData);

router.post('/groups', authorizeRole('Kedisiplinan'), createGroup);
router.post('/fines', authorizeRole('Kedisiplinan'), createFine);
router.post('/kumpulan', authorizeRole('Kedisiplinan'), createKumpulanLegi);
router.post('/attendance', authorizeRole('Kedisiplinan'), saveAttendance);
router.put('/fines/:id/pay', authorizeRole('Kedisiplinan'), payFine);

module.exports = router;
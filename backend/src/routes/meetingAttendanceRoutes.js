// backend/src/routes/meetingAttendanceRoutes.js
const express = require('express');
const router = express.Router();
const { saveMeetingAttendanceDraft, getMeetingAttendanceData } = require('../controllers/meetingAttendanceController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

router.use(protect);
router.get('/', authorizeRole('Ketua'), getMeetingAttendanceData);
router.post('/save', authorizeRole('Ketua'), saveMeetingAttendanceDraft);

module.exports = router;
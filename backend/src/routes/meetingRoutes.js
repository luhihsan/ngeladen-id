// backend/src/routes/meetingRoutes.js
const express = require('express');
const { getMeetings, createMeeting, addNotes, getRandomHost, deleteMeeting } = require('../controllers/meetingController'); // Tambah import deleteMeeting
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getMeetings);
router.get('/random-host', authorizeRole('Sekretaris'), getRandomHost);
router.post('/', authorizeRole('Sekretaris'), createMeeting);
router.put('/:id/notes', authorizeRole('Sekretaris'), addNotes);
router.delete('/:id', authorizeRole('Sekretaris'), deleteMeeting);

module.exports = router;
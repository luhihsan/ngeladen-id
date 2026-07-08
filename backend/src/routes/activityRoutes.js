// backend/src/routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const { getAllActivities } = require('../controllers/activityController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getAllActivities);

module.exports = router;
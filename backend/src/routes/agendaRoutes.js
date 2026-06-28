// backend/src/routes/agendaRoutes.js
const express = require('express');
const { getAgendas, createAgenda, updateAgenda, completeAgenda, deleteAgenda } = require('../controllers/agendaController');
const { protect, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getAgendas);

router.post('/', authorizeRole('Ketua', 'Wakil Ketua'), createAgenda);
router.put('/:id', authorizeRole('Ketua', 'Wakil Ketua'), updateAgenda);
router.put('/:id/complete', authorizeRole('Ketua', 'Wakil Ketua'), completeAgenda);
router.delete('/:id', authorizeRole('Ketua', 'Wakil Ketua'), deleteAgenda);

module.exports = router;
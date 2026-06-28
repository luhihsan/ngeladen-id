// backend/src/controllers/agendaController.js
const Agenda = require('../models/Agenda');

const getAgendas = async (req, res) => {
  try {
    const agendas = await Agenda.find().sort({ date: 1 }).populate('createdBy', 'fullName role');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processedAgendas = agendas.map(agenda => {
      const agendaDoc = agenda.toJSON();
      const agendaDate = new Date(agendaDoc.date);
      agendaDate.setHours(0, 0, 0, 0);

      if (agendaDate < today) {
        agendaDoc.status = 'Selesai';
      }
      return agendaDoc;
    });

    res.json(processedAgendas);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data agenda', error: error.message });
  }
};

const completeAgenda = async (req, res) => {
  try {
    const agenda = await Agenda.findById(req.params.id);
    if (!agenda) return res.status(404).json({ message: 'Agenda tidak ditemukan' });

    agenda.status = 'Selesai';
    await agenda.save();
    res.json({ success: true, message: 'Agenda berhasil ditandai selesai', data: agenda });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyelesaikan agenda', error: error.message });
  }
};

const deleteAgenda = async (req, res) => {
  try {
    const agenda = await Agenda.findById(req.params.id);
    if (!agenda) return res.status(404).json({ message: 'Agenda tidak ditemukan' });
    await agenda.deleteOne();
    res.json({ success: true, message: 'Agenda berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus agenda', error: error.message });
  }
};

const createAgenda = async (req, res) => {
  const { title, date, type, location, description, fineAmount } = req.body;
  try {
    const agenda = await Agenda.create({
      title, date, type, location, description, 
      fineAmount: fineAmount || 0, // Simpan denda, default 0
      createdBy: req.user._id
    });
    res.status(201).json(agenda);
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat agenda', error: error.message });
  }
};

const updateAgenda = async (req, res) => {
  const { title, date, type, location, description, fineAmount } = req.body;
  try {
    const agenda = await Agenda.findById(req.params.id);
    if (!agenda) return res.status(404).json({ message: 'Agenda tidak ditemukan' });

    agenda.title = title || agenda.title;
    agenda.date = date || agenda.date;
    agenda.type = type || agenda.type;
    agenda.location = location || agenda.location;
    agenda.description = description !== undefined ? description : agenda.description;
    agenda.fineAmount = fineAmount !== undefined ? fineAmount : agenda.fineAmount;

    await agenda.save();
    res.json({ success: true, message: 'Agenda berhasil diperbarui', data: agenda });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui agenda', error: error.message });
  }
};

module.exports = { getAgendas, createAgenda, updateAgenda, completeAgenda, deleteAgenda };
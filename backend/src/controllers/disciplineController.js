// backend/src/controllers/disciplineController.js
const { GroupLegi, Fine, KumpulanLegi } = require('../models/Discipline');
const Transaction = require('../models/Transaction');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ================= KELOMPOK LEGI =================
const getGroups = async (req, res) => {
  try {
    const groups = await GroupLegi.find().populate('members', 'fullName');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const group = await GroupLegi.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= DENDA & ABSENSI =================
const getFines = async (req, res) => {
  try {
    const fines = await Fine.find().populate('user', 'fullName').sort({ date: -1 });
    res.json(fines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createFine = async (req, res) => {
  try {
    const fine = await Fine.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(fine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const payFine = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id).populate('user', 'fullName');
    if (!fine) return res.status(404).json({ message: 'Data denda tidak ditemukan' });
    if (fine.status !== 'Belum Bayar') return res.status(400).json({ message: 'Denda sudah diproses' });

    fine.status = 'Menunggu Konfirmasi';
    await fine.save();

    await Transaction.create({
      description: `Setoran Denda: ${fine.reason} (${fine.user.fullName})`,
      type: 'Masuk',
      amount: fine.amount,
      section: 'Kedisiplinan',
      status: 'Pending',
      fineRef: fine._id,
      createdBy: req.user._id
    });

    res.json({ success: true, message: 'Setoran diteruskan ke Bendahara' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= KUMPULAN MINGGU LEGI =================
const getKumpulanLegi = async (req, res) => {
  try {
    const list = await KumpulanLegi.find().populate('assignedGroup', 'name').sort({ date: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createKumpulanLegi = async (req, res) => {
  try {
    const kumpulan = await KumpulanLegi.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(kumpulan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveAttendance = async (req, res) => {
  const { type, refId, records, eventTitle } = req.body; 
  try {
    const attendance = await Attendance.findOneAndUpdate(
      { type, refId },
      { records },
      { new: true, upsert: true }
    );

    const alpaRecords = records.filter(r => r.status === 'Alpa');
    
    if (alpaRecords.length > 0) {
      // Ambil data Agenda jika tipe absensinya adalah Agenda Ketua
      let agendaData = null;
      if (type === 'Agenda') {
        const Agenda = require('../models/Agenda');
        agendaData = await Agenda.findById(refId);
      }

      for (const record of alpaRecords) {
        const user = await require('../models/User').findById(record.user);
        let amountToFine = 0;
        let reason = '';

        if (type === 'KumpulanLegi') {
          amountToFine = user.occupationStatus === 'Pelajar/Mahasiswa' ? 15000 : 25000;
          reason = `Alpa Kumpulan Minggu Legi: ${eventTitle}`;
        } else if (type === 'Agenda' && agendaData && agendaData.fineAmount > 0) {
          // Gunakan nominal denda yang sudah disetting Ketua
          amountToFine = agendaData.fineAmount;
          reason = `Alpa Agenda Ketua: ${eventTitle}`;
        }

        if (amountToFine > 0) {
          await Fine.findOneAndUpdate(
            { user: user._id, reason: reason, status: 'Belum Bayar' },
            { amount: amountToFine, date: new Date(), createdBy: req.user._id },
            { upsert: true }
          );
        }
      }
    }

    res.json({ success: true, message: 'Absensi direkam dan denda (jika ada) otomatis diterbitkan', data: attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAttendanceData = async (req, res) => {
  try {
    const data = await Attendance.findOne({ type: req.query.type, refId: req.query.refId });
    res.json(data || { records: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getGroups, createGroup, getFines, createFine, payFine,
  getKumpulanLegi, createKumpulanLegi, saveAttendance, getAttendanceData 
};
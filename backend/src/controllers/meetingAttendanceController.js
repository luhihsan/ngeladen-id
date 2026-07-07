// backend/src/controllers/meetingAttendanceController.js
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// 1. Menyimpan draf rekapitulasi absensi sebelum dikunci resmi
const saveMeetingAttendanceDraft = async (req, res) => {
  const { meetingId, records } = req.body;
  try {
    // Cari atau buat baru lembar absensi tipe Agenda polimorfik bawaan reponya
    const attendance = await Attendance.findOneAndUpdate(
      { type: 'Agenda', refId: meetingId },
      { records },
      { new: true, upsert: true }
    );

    res.json({ 
      success: true, 
      message: 'Draf absensi rapat rutin berhasil disimpan', 
      data: attendance 
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan draf absensi', error: error.message });
  }
};

// 2. Mengambil data absensi yang sudah tersimpan sebelumnya (jika ada)
const getMeetingAttendanceData = async (req, res) => {
  const { meetingId } = req.query;
  try {
    const attendance = await Attendance.findOne({ type: 'Agenda', refId: meetingId });
    res.json(attendance || { records: [] });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data absensi', error: error.message });
  }
};

module.exports = { saveMeetingAttendanceDraft, getMeetingAttendanceData };
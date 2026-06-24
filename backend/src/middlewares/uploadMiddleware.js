// backend/src/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Konfigurasi tempat penyimpanan dan penamaan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/sp/'); // Simpan di folder ini
  },
  filename: function (req, file, cb) {
    // Format nama file: SP-timestamp-namaasli.pdf
    cb(null, `SP-${Date.now()}-${path.extname(file.originalname)}`);
  }
});

// Filter khusus dokumen (Word & PDF)
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /doc|docx|pdf/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  // Mengecek mime type
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file dokumen (.doc, .docx, .pdf) yang diizinkan!'));
  }
};

const uploadSP = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit maksimal 5MB
  fileFilter: fileFilter
});

module.exports = { uploadSP };
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  pool: true,
  host: 'smtp.gmail.com', // <-- HARUS KETIK LANGSUNG 'smtp.gmail.com'
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER, // nilainya nurihsankh29@gmail.com dari .env
    pass: process.env.SMTP_PASS, // nilainya App Password 16 digit dari .env
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Verifikasi koneksi saat server dinyalakan
transporter.verify((error) => {
  if (error) {
    console.error('❌ [SMTP ERROR] Gagal terhubung ke Gmail SMTP:', error.message);
  } else {
    console.log('✅ [SMTP SUCCESS] Layanan pengirim email siap!');
  }
});

const sendAccountCreatedEmail = async (toEmail, name, username, tempPassword) => {
  const mailOptions = {
    from: `"Ngeladen.id Admin" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Aktivasi Akun Baru - Ngeladen.id',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #4f46e5;">Halo, ${name}!</h2>
        <p>Selamat! Akun Anda untuk mengakses platform <b>Ngeladen.id</b> telah berhasil dibuat oleh Ketua.</p>
        <p>Berikut adalah kredensial login sementara Anda:</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><b>Username:</b> ${username}</p>
          <p style="margin: 5px 0;"><b>Password Sementara:</b> <code style="font-size: 16px; color: #d97706; font-weight: bold;">${tempPassword}</code></p>
        </div>
        <p>Silakan gunakan kredensial di atas untuk login pertama kali. <b>Demi keamanan, Anda disarankan untuk segera mengganti password setelah berhasil masuk ke sistem.</b></p>
        <br/>
        <p>Salam,<br/>Tim Pengurus Ngeladen.id</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = { sendAccountCreatedEmail };
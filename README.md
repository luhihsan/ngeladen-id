# ngeladen.id - Sistem Manajemen & Administrasi Organisasi[cite: 1]

**ngeladen.id** adalah platform web *full-stack* yang dirancang untuk mendigitalisasi seluruh proses administrasi, pengelolaan keuangan, pencatatan aset, serta pemantauan kedisiplinan dalam suatu organisasi atau komunitas secara terpusat[cite: 1]. Terinspirasi dari kata bahasa Jawa *"ngeladen"* yang berarti melayani, platform ini dibangun untuk membantu para pengurus (Ketua, Sekretaris, Bendahara) memberikan pelayanan administrasi yang transparan, akurat, dan terintegrasi kepada seluruh anggotanya[cite: 1].

---

## 🎨 Gambaran Umum Sistem

Sistem ini menggunakan arsitektur modern berbasis pemisahan fungsi (*Decoupled Architecture*), di mana bagian *Frontend* (antarmuka pengguna) dan *Backend* (pemrosesan data dan API) berjalan secara independen namun saling berkomunikasi secara *real-time*[cite: 1]. 

Dengan pendekatan ini, sistem mampu menyajikan performa yang responsif, manajemen beban server yang efisien, serta skalabilitas tinggi untuk pengembangan fitur di masa mendatang[cite: 1].

---

## 🚀 Penjelasan Fitur & Modul Utama

Sistem **ngeladen.id** dibagi menjadi beberapa modul fungsional berbasis hak akses (*Multi-role*) yang disesuaikan dengan struktur kepengurusan organisasi[cite: 1]:

### 1. 🔐 Autentikasi & Otorisasi Berbasis Peran (*Multi-Role Auth*)
* **Sistem Login Keamanan Tinggi:** Proses masuk yang dilindungi dengan enkripsi kata sandi untuk mencegah akses tidak sah[cite: 1].
* **Manajemen Hak Akses Dinamis:** Memisahkan batasan fitur dan dashboard secara spesifik untuk **Ketua**, **Sekretaris**, **Bendahara**, dan **Anggota**[cite: 1].

### 2. 💼 Modul Keuangan & Kas (Bendahara)
* **Manajemen Kas Wajib:** Bendahara dapat mengelola, memantau, dan mencatat tagihan kas wajib berkala untuk setiap anggota[cite: 1].
* **Pencatatan Infak Khusus:** Pencatatan dana sukarela dari anggota maupun donatur luar, termasuk pelacakan program khusus seperti Infak Kurban[cite: 1].
* **Arus Transaksi:** Pencatatan menyeluruh untuk setiap pengeluaran dan pemasukan kas organisasi demi menjamin transparansi[cite: 1].

### 3. 📊 Modul Kedisiplinan & Kehadiran (Sekretaris & Ketua)
* **Presensi Pertemuan:** Pencatatan kehadiran digital saat rapat, koordinasi, atau kegiatan resmi organisasi[cite: 1].
* **Perhitungan Denda Otomatis:** Sistem akan menghitung denda secara otomatis bagi anggota yang terlambat atau tidak hadir tanpa keterangan yang valid[cite: 1].
* **Manajemen Kelompok:** Pengelompokan anggota ke dalam tim kerja atau divisi tertentu agar alokasi tugas lebih teratur[cite: 1].

### 4. 📦 Modul Inventaris & Bekakas (Fasilitator/Logistik)
* **Pencatatan Aset:** Pendataan barang milik organisasi beserta kode unik, nama, dan jumlahnya[cite: 1].
* **Log Peminjaman Bekakas:** Pelacakan keluar-masuk barang, mencakup siapa yang meminjam, tanggal kembali, serta status kondisi kelayakan barang[cite: 1].

### 5. 📅 Agenda & Notulensi Digital (Sekretariat)
* **Pengumuman Agenda:** Penjadwalan rapat atau acara organisasi agar anggota mendapatkan informasi terkini[cite: 1].
* **Rich Text Editor untuk Notulen:** Pengurus dapat mengetik notulensi hasil rapat langsung di dalam sistem menggunakan editor teks kaya (*Rich Text Editor*) yang dinamis dan rapi[cite: 1].

### 6. 📥 Kotak Saran & Ekspor Laporan
* **Kotak Saran Terstruktur:** Anggota dapat memberikan aspirasi, kritik, atau masukan secara langsung tanpa perlu proses birokrasi yang rumit[cite: 1].
* **Ekspor Dokumen ke Excel:** Kemudahan mengunduh rekapitulasi data (seperti daftar denda, presensi, dan kas) langsung ke berkas format spreadsheet (`.xlsx`) demi kebutuhan pelaporan offline[cite: 1].

---

## 🛠️ Detail Tech Stack yang Digunakan

Proyek ini dibangun menggunakan kombinasi teknologi modern, tangguh, serta memiliki komunitas pengembang yang sangat luas:

### 💻 Frontend (Antarmuka Pengguna)
* **Next.js (App Router):** Framework React tingkat lanjut yang mendukung *routing* dinamis berbasis folder, rendering cepat, serta optimasi aset bawaan[cite: 1].
* **React & TypeScript:** Membuat antarmuka menjadi reaktif sekaligus memastikan tipe data aman (*type-safe*) sejak tahap penulisan kode[cite: 1].
* **Tailwind CSS:** Framework CSS berbasis utilitas untuk mendesain tampilan dashboard yang modern, responsif, dan ringan tanpa menulis banyak baris CSS manual[cite: 1].
* **TipTap Editor:** Pustaka editor teks kaya berbasis *prosemirror* yang disematkan langsung pada modul sekretariat untuk penulisan notulensi rapat[cite: 1].
* **SheetJS (xlsx):** Pustaka untuk konversi dan pembuatan berkas Excel langsung dari sisi browser[cite: 1].

### ⚙️ Backend (Server & Database)
* **Node.js & Express.js:** Lingkungan eksekusi JavaScript di sisi server dan framework minimalis untuk mengelola lalu lintas RESTful API dengan performa tinggi[cite: 1].
* **MongoDB & Mongoose:** Database NoSQL berbasis dokumen yang sangat fleksibel, digabungkan dengan Mongoose sebagai ODM (*Object Data Modeling*) untuk mendefinisikan skema data yang ketat[cite: 1].
* **JSON Web Token (JWT):** Metode pertukaran data otentikasi yang aman dan tidak memerlukan penyimpanan sesi (*stateless*)[cite: 1].
* **Bcrypt.js:** Algoritma hashing satu arah untuk mengamankan kata sandi pengguna sebelum disimpan ke database[cite: 1].
* **Multer:** Middleware khusus untuk menangani unggahan file bukti administrasi dan dokumen lainnya[cite: 1].

## 🧪 Quality Assurance & Test Automation Showcase (Playwright)

Sebagai bagian dari standardisasi kualitas perangkat lunak dan keandalan sistem, proyek ini mengimplementasikan **Automated End-to-End (E2E) Testing** menggunakan **Playwright Framework** dengan pendekatan berbasis industri.

### 🎯 Strategi & Pendekatan Pengujian

1. **Role-Based Access Control (RBAC) Validation:**
   Memastikan batasan hak akses antar peran (*Ketua, Sekretaris, Bendahara, Anggota*) bekerja dengan benar pada tingkat antarmuka pengguna, mencegah kebocoran data (*data leakage*) atau eskalasi hak akses (*privilege escalation*).
2. **Reusabilitas State Autentikasi (`storageState`):**
   Untuk mengoptimalkan efisiensi waktu eksekusi pengujian, sistem memanfaatkan fitur *global setup* Playwright. Sesi login untuk masing-masing peran disimpan ke dalam bentuk *state JSON*, sehingga test case selanjutnya tidak perlu melakukan proses login berulang kali.
3. **Multi-Browser & Cross-Browser Testing:**
   Skenario pengujian dijalankan pada *engine* browser utama industri untuk mendeteksi inkonsistensi UI/UX:
   * **Chromium** (Google Chrome, Microsoft Edge)
   * **Firefox** (Mozilla Firefox)
   * **Webkit** (Apple Safari)

### 📋 Cakupan Skenario Uji (Test Suites & Specs Coverage)

Pengujian otomatis mencakup seluruh alur bisnis krusial yang terbagi ke dalam repositori berkas spesifikasi pengujian berikut:

* **`login.spec.ts` (Authentication & Security):**
  * *Positive Case:* Validasi keberhasilan proses login dengan kredensial yang valid serta pengalihan halaman (*redirection*) ke dashboard yang sesuai.
  * *Negative Case:* Pengujian dengan kata sandi salah, format email tidak valid, dan verifikasi munculnya pesan error (*alert*) yang informatif bagi pengguna.
* **`ketua-module.spec.ts` & `sekretaris-module.spec.ts` (Governance Control):**
  * Validasi alur persetujuan atau pembuatan kebijakan administrasi oleh Ketua.
  * Pengujian modul manajemen anggota dan pembuatan kelompok kerja oleh Sekretaris.
* **`bendahara-module.spec.ts` (Financial Core):**
  * Pengujian alur input transaksi kas masuk/keluar, validasi kalkulasi saldo total secara dinamis, dan pemutakhiran data secara *real-time*.
* **`infak-module.spec.ts` (Special Funding):**
  * Validasi pencatatan dana infak program khusus (seperti alokasi dana kurban) dan akurasi riwayat kontribusi donatur.
* **`kedisiplinan-module.spec.ts` (Attendance & Fines Logic):**
  * **Uji Logika Bisnis:** Pengujian validasi kalkulasi denda otomatis ketika status presensi anggota diubah menjadi 'Terlambat' atau 'Alpa'.
  * Memastikan akumulasi nilai denda per anggota terhitung secara presisi tanpa pembulatan yang salah.
* **`bekakas-dashboard.spec.ts` (Inventory Logistics):**
  * Pengujian siklus hidup barang/aset: Penambahan barang baru $\rightarrow$ Log Peminjaman $\rightarrow$ Perubahan Status Ketersediaan $\rightarrow$ Log Pengembalian Aset.
* **`agenda-module.spec.ts` (Secretariat Workflow):**
  * Pengujian pembuatan jadwal agenda baru serta interaksi fungsionalitas komponen *Rich Text Editor (TipTap)* saat menyimpan notulensi rapat ke database.

### 🛠️ QA Best Practices & Pengurangan *Flakiness*
* **Robust Locators:** Mengutamakan penggunaan pencari berbasis teks dan aksesibilitas (`page.getByRole`, `page.getByText`) alih-alih menggunakan *hardcoded* CSS/XPath Selector yang rapuh terhadap perubahan desain layout.
* **Auto-waiting:** Memanfaatkan kemampuan alami Playwright untuk menunggu elemen siap berinteraksi (*actionability checks*) guna meminimalkan kegagalan uji akibat keterlambatan respons jaringan server (*flaky tests*).
* **Rich Reporting & Debugging Artifacts:** Konfigurasi pengujian diatur untuk merekam data debug lengkap saat terjadi kegagalan uji di server CI:
  * **Playwright Trace Viewer:** Rekaman jejak eksekusi baris kode demi investigasi mendalam (*post-mortem analysis*).
  * **Video & Screenshots on Failure:** Bukti visual instan ketika terjadi *assertion error*.

### 🔄 Integrasi CI/CD Pipeline (GitHub Actions)
Setiap kali ada pemutakhiran kode (*Push* atau *Pull Request*) ke repositori utama, alur kerja **GitHub Actions Workflow (`playwright.yml`)** akan otomatis terpicu untuk:
1. Melakukan instalasi seluruh dependensi lingkungan (*Environment Setup*).
2. Menjalankan server lokal secara paralel.
3. Mengeksekusi seluruh *test suites* E2E Playwright secara terisolasi.
4. Mengunggah *HTML Test Report* sebagai artefak kerja untuk dianalisis oleh tim QA.
---

## 📂 Struktur Direktori Utama

Berikut adalah gambaran ringkas struktur file di dalam repositori ini:

```text
ngeladen-id/
├── backend/               # Kode sumber server API (Node.js & Express)[cite: 1]
│   ├── src/
│   │   ├── controllers/   # Logika bisnis penanganan request (Kas, Presensi, User, dll)[cite: 1]
│   │   ├── middlewares/   # Lapisan keamanan token (JWT) & filter file upload[cite: 1]
│   │   ├── models/        # Definisi struktur data MongoDB menggunakan Mongoose[cite: 1]
│   │   └── routes/        # Jalur endpoint API yang dapat diakses oleh Frontend[cite: 1]
│   └── server.js          # File utama untuk menjalankan server backend[cite: 1]
├── frontend/              # Kode sumber aplikasi web pengguna (Next.js)[cite: 1]
│   ├── app/               # Struktur halaman web (Halaman login & panel dashboard)[cite: 1]
│   ├── public/            # File aset statis seperti logo, gambar, dan ikon[cite: 1]
│   └── utils/             # Fungsi utilitas pembantu, termasuk konfigurasi koneksi API[cite: 1]
└── e2e-tests/             # Skenario otomatis pengujian fungsionalitas sistem (Playwright)[cite: 1]

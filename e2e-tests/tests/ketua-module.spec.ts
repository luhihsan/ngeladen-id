// e2e-tests/tests/ketua-module.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.use({ baseURL: 'http://localhost:3000' });

test.describe('Modul Ketua: Manajemen Anggota & Kotak Masukan', () => {
  // Setup: Membuat file dummy PDF secara otomatis sebelum test berjalan
  const dummyFilePath = path.join(__dirname, 'dummy-sp.pdf');

  test.beforeAll(() => {
    fs.writeFileSync(dummyFilePath, 'Ini adalah file dokumen SP dummy untuk keperluan Automated QA Testing.');
  });

  // Teardown: Menghapus file dummy setelah semua test selesai
  test.afterAll(() => {
    if (fs.existsSync(dummyFilePath)) {
      fs.unlinkSync(dummyFilePath);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Robot akan melakukan login sebagai Ketua sebelum setiap test
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('rafly_ketua');
    await page.getByPlaceholder('Masukan Password').fill('12345678');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');
  });

  test('Positive: Harus bisa mengirim Aspirasi Anonim dari Dashboard', async ({ page }) => {
    // Mengisi form saran
    await page.getByPlaceholder('Tuliskan saran, kritik, atau ide kegiatan di sini...').fill('Test masukan otomatis dari Playwright QA.');
    
    // Centang opsi anonim
    await page.getByLabel('Kirim sebagai Anonim').check();
    
    // Submit
    await page.getByRole('button', { name: 'Kirim Sekarang' }).click();

    // Verifikasi alert sukses muncul
    const successMessage = page.getByText('Terima kasih! Aspirasi Anda berhasil dikirim ke Ketua.');
    await expect(successMessage).toBeVisible();
  });

  test('Positive: Harus bisa mengubah status anggota menjadi Pasif', async ({ page }) => {
    await page.goto('/dashboard/anggota');

    // Klik tombol "Ubah Status" pada user pertama di list
    await page.locator('button:has-text("Ubah Status")').first().click();

    // Memastikan Modal Terbuka
    await expect(page.getByText('Ubah Status Anggota')).toBeVisible();

    // Pilih status 'Pasif'
    await page.locator('select').selectOption('Pasif');

    // Isi alasan
    await page.getByPlaceholder('Contoh: Magang di Jakarta 6 bulan').fill('Cuti Sistem (Automated QA)');

    // Klik simpan
    await page.getByRole('button', { name: 'Simpan Status' }).click();

    // Memastikan modal tertutup setelah sukses
    await expect(page.getByText('Ubah Status Anggota')).toBeHidden();
  });

  test('Positive: Harus bisa menerbitkan SP dengan upload file', async ({ page }) => {
    await page.goto('/dashboard/anggota');

    // Klik tombol "Terbitkan SP" pada user pertama
    await page.locator('button:has-text("Terbitkan SP")').first().click();

    // Memastikan Modal Terbuka
    await expect(page.locator('h3:has-text("Terbitkan Surat Peringatan")')).toBeVisible();

    // Isi Form SP
    await page.getByPlaceholder('Contoh: SP/RT01/001').fill(`SP/QA/${Date.now()}`);
    await page.getByPlaceholder('Contoh: Tidak hadir kerja bakti').fill('Pelanggaran Test Automation Playwright');

    // Upload File Dummy
    await page.locator('input[type="file"]').setInputFiles(dummyFilePath);

    // Submit
    await page.getByRole('button', { name: 'Terbitkan SP' }).click();

    // Memastikan modal tertutup (berarti API sukses merespons 201)
    await expect(page.locator('h3:has-text("Terbitkan Surat Peringatan")')).toBeHidden();
  });
});
// e2e-tests/tests/bendahara-module.spec.ts
import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3000' });

test.describe('Modul Bendahara: Manajemen Keuangan AD/ART', () => {
  
  test.beforeEach(async ({ page }) => {
    // Asumsi kita menggunakan akun Budi (Bendahara)
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('budi_bendahara');
    await page.getByPlaceholder('Masukan Password').fill('password123'); // Sesuaikan dengan password aslimu
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');
    
    // Navigasi ke halaman keuangan
    await page.goto('/dashboard/keuangan');
    await expect(page.locator('h1:has-text("Manajemen Keuangan AD/ART")')).toBeVisible();
  });

  test('Positive: Bendahara bisa mencatat uang MASUK (Debit)', async ({ page }) => {
    await page.getByRole('button', { name: '+ Catat Arus Kas' }).click();
    
    // Pastikan modal terbuka
    await expect(page.locator('h3:has-text("Catat Kas Baru")')).toBeVisible();

    // Isi Form Debit
    await page.locator('select').first().selectOption('Masuk');
    await page.getByPlaceholder('Contoh: 50.000').fill('150000'); 
    await page.locator('select').nth(1).selectOption('Umum'); 
    await page.getByPlaceholder('Contoh: Iuran bulanan').fill('Iuran Kas Pemuda Budi (QA Test)');

    await page.getByRole('button', { name: 'Simpan Kas' }).click();

    // Verifikasi data muncul di tabel (cari berdasarkan deskripsi)
    await expect(page.getByText('Iuran Kas Pemuda Budi (QA Test)')).toBeVisible();
    await expect(page.locator('td').filter({ hasText: 'Rp 150.000' }).first()).toBeVisible();
  });

  test('Positive: Bendahara bisa mencatat uang KELUAR (Kredit) & Otomatis Terbit Nota', async ({ page }) => {
    await page.getByRole('button', { name: '+ Catat Arus Kas' }).click();
    
    // Isi Form Kredit
    await page.locator('select').first().selectOption('Keluar');
    await page.getByPlaceholder('Contoh: 50.000').fill('25000'); 
    await page.locator('select').nth(1).selectOption('Bekakas'); 
    await page.getByPlaceholder('Contoh: Iuran bulanan').fill('Beli Sapu Lidi (QA Test)');

    await page.getByRole('button', { name: 'Simpan Kas' }).click();

    // Verifikasi deskripsi muncul
    await expect(page.getByText('Beli Sapu Lidi (QA Test)')).toBeVisible();
    
    // Verifikasi Nota otomatis ter-generate (mencari teks yang mengandung "NOTA/OUT")
    const notaLocator = page.locator('p', { hasText: /NOTA\/OUT/ }).first();
    await expect(notaLocator).toBeVisible();
  });

  test('Positive: Tombol Export Excel berfungsi', async ({ page }) => {
    // Memastikan tombol render dan bisa diklik (Playwright akan otomatis menangani dialog download)
    const exportBtn = page.getByRole('button', { name: 'Export Excel' });
    await expect(exportBtn).toBeVisible();
    
    // Cek apakah trigger download tidak error
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click()
    ]);
    
    expect(download.suggestedFilename()).toContain('Laporan_Kas');
  });
});
// e2e-tests/tests/kedisiplinan-module.spec.ts
import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3000' });

test.describe('Modul Kedisiplinan: Manajemen Kelompok & Absensi', () => {

  test('Positive: Seksi Kedisiplinan Bisa Mengelola Absensi & Denda', async ({ page }) => {
    // 1. Login sebagai Kedisiplinan
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('intan_disiplin'); 
    await page.getByPlaceholder('Masukan Password').fill('12345678');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');

    // 2. Akses halaman Kedisiplinan
    await page.goto('/dashboard/kedisiplinan');
    await expect(page.locator('h1:has-text("Biro Kedisiplinan & Laden")')).toBeVisible();

    // 3. Tes Simpan Absensi (Otomatis memicu denda Alpa)
    await page.click('button:has-text("Absensi Sesi Kegiatan")');
    
    // Cari agenda pertama dan buka absennya
    const btnBukaAbsen = page.locator('button:has-text("Buka Absen")').first();
    await expect(btnBukaAbsen).toBeVisible();
    await btnBukaAbsen.click();

    // Klik hadir semua
    await page.click('button:has-text("Hadir Semua")');
    
    // Simpan data & tekan OK di alert konfirmasi
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Simpan & Kunci")');
    
    // 4. Input Denda Manual
    await page.click('button:has-text("💰 Buku Denda")');
    await page.click('button:has-text("+ Input Denda Manual")');
    
    // Isi form denda manual
    await page.locator('select').first().selectOption({ index: 1 }); // Pilih orang pertama
    await page.getByPlaceholder('10.000').fill('15000');
    await page.locator('input[type="date"]').fill('2026-10-10');
    await page.getByPlaceholder('Tulis alasan denda...').fill('Terlambat datang kerja bakti (QA Test)');
    await page.click('button:has-text("Simpan Catatan")');

    // Verifikasi muncul di tabel
    await expect(page.getByText('Terlambat datang kerja bakti (QA Test)')).toBeVisible();
  });
});
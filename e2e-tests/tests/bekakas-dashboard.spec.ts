// e2e-tests/tests/bekakas-only.spec.ts
import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3000' });

test.describe('Modul Bekakas Pemuda: Alur Manajemen Inventaris & Nota Sewa', () => {

  test('Skenario Sukses: Tambah Mangkok, Terbitkan Sewa, Ajukan Setoran, dan ACC Bendahara', async ({ page }) => {
    
    // 1. LOGIN SEBAGAI PENGURUS BEKAKAS
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('arya_bekakas'); 
    await page.getByPlaceholder('Masukan Password').fill('12345678');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');

    // 2. TAMBAH ASET MANGKOK BARU DI TAB INVENTARIS
    await page.goto('/dashboard/bekakas');
    await page.click('button:has-text("Tambah Aset Baru")');
    
    await page.getByPlaceholder('Contoh: Piring Makan Melamin').fill('Mangkok');
    await page.getByPlaceholder('500').fill('200'); // Jumlah unit stok
    await page.getByPlaceholder('5.000').fill('1000'); // Tarif sewa per unit
    await page.click('button:has-text("Simpan Aset")');

    // Verifikasi aset Mangkok berhasil nampang di daftar gudang
    await expect(page.getByText('Mangkok')).toBeVisible();

    // 3. TERBITKAN NOTA SEWA MULTI-ITEM MENGGUNAKAN MANGKOK
    await page.click('button:has-text("Buku Kas & Riwayat Nota")');
    await page.click('button:has-text("Terbitkan Nota Sewa")');

    await page.getByPlaceholder('Bpk. Anto').fill('Galuh (Test Mangkok)');
    
    // Pilih select option Mangkok (index 1 karena index 0 adalah Klasifikasi Aliran Dana)
    await page.locator('form select').nth(1).selectOption({ label: 'Mangkok' });
    await page.getByPlaceholder('Qty').fill('50');
    await page.click('button:has-text("Simpan Berkas")');

    // Verifikasi deskripsi nota otomatis tersusun rapi di tabel
    await expect(page.getByText('Sewa Alat Pemuda c/o Galuh (Test Mangkok): Mangkok (50 Unit)')).toBeVisible();

    // 4. AJUKAN NOTA KAS KE BENDAHARA PUSAT
    page.once('dialog', dialog => dialog.accept()); // Handle confirm window otomatis klik OK
    await page.click('button:has-text("Setor")');
    await expect(page.getByText('Menunggu Konfirmasi')).toBeVisible();

    // 5. LOGIN SEBAGAI BENDAHARA UNTUK MELAKUKAN ACC VALIDASI
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('budi_bendahara'); // Sesuaikan dengan seed data username Bendahara Anda
    await page.getByPlaceholder('Masukan Password').fill('password123');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');

    // Buka buku otorisasi keuangan pusat
    await page.goto('/dashboard/keuangan');
    await expect(page.getByText('Sewa Alat Pemuda c/o Galuh (Test Mangkok): Mangkok (50 Unit)')).toBeVisible();

    // Jalankan eksekusi klik ACC / Sahkan
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("ACC / Sahkan")');

    // 6. VERIFIKASI AKHIR
    // Pastikan data berhasil turun secara resmi ke dalam tabel Buku Jurnal Umum Kas Sah
    await expect(page.locator('table')).toContainText('Sewa Alat Pemuda c/o Galuh (Test Mangkok): Mangkok (50 Unit)');
  });
});
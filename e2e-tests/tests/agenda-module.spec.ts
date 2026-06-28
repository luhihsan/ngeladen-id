// e2e-tests/tests/agenda-module.spec.ts
import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3000' });

test.describe('Modul Ketua & Kedisiplinan: Manajemen Agenda Non-Rutin', () => {

  test('Positive: Ketua bisa CRUD & Menyelesaikan Agenda Manual', async ({ page }) => {
    // 1. Login Ketua
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('rafly_ketua'); 
    await page.getByPlaceholder('Masukan Password').fill('12345678');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');

    // 2. Navigasi ke Modul Agenda
    await page.goto('/dashboard/agenda');
    await expect(page.locator('h1:has-text("Agenda Kegiatan Non-Rutin")')).toBeVisible();

    // 3. Create Agenda Baru
    await page.getByRole('button', { name: '+ Buat Agenda Baru' }).click();
    await page.getByPlaceholder('Contoh: Sambatan Rumah Pak RT').fill('Sinoman Pernikahan Agus (QA Test)');
    await page.locator('input[type="date"]').fill('2026-10-12'); 
    await page.locator('select').first().selectOption('Kerja Bakti');
    await page.getByPlaceholder('Contoh: Rumah Keluarga Pak RW').fill('Gedung Serbaguna RT 02');
    await page.getByRole('button', { name: 'Terbitkan Agenda' }).click();

    // Verifikasi Muncul
    await expect(page.getByText('Sinoman Pernikahan Agus (QA Test)')).toBeVisible();

    // 4. Edit (Update) Agenda
    await page.locator('button:has-text("Edit")').first().click();
    await page.getByPlaceholder('Contoh: Sambatan Rumah Pak RT').fill('Sinoman Pernikahan Agus & Siti (QA Edit)');
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
    await expect(page.getByText('Sinoman Pernikahan Agus & Siti (QA Edit)')).toBeVisible();

    // 5. Tandai Selesai Manual
    page.on('dialog', dialog => dialog.accept()); // Automate browser alert
    await page.locator('button:has-text("Selesai")').first().click();

    // Pindah ke tab Selesai untuk verifikasi data berpindah tempat
    await page.click('button:has-text("Riwayat Selesai")');
    await expect(page.getByText('Sinoman Pernikahan Agus & Siti (QA Edit)')).toBeVisible();
  });
});
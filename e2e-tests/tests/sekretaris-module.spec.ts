import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3000' });

test.describe('Modul Sekretariat: Validasi Multi-Role & Hak Akses', () => {

  test('Positive: Sisi Sekretaris - Bisa Mengelola Jadwal & Notulensi', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('gita_sekre'); 
    await page.getByPlaceholder('Masukan Password').fill('12345678');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/dashboard/sekretariat');
    await expect(page.getByRole('button', { name: '+ Jadwalkan Rapat' })).toBeVisible();
  });

  test('Security Check: Sisi Ketua - Hanya Bisa Memantau (Read-Only)', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('rafly_ketua'); 
    await page.getByPlaceholder('Masukan Password').fill('12345678');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/dashboard/sekretariat');
    await expect(page.locator('h3:has-text("Agenda Rapat Organisasi")')).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Jadwalkan Rapat' })).toBeHidden();
    await expect(page.locator('button:has-text("Isi Notulensi")')).toBeHidden();
    await expect(page.locator('button:has-text("Hapus Rapat")')).toBeHidden();
  });
});
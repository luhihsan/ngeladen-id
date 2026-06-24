// e2e-tests/tests/login.spec.ts
import { test, expect } from '@playwright/test';

// Set base URL agar tidak perlu nulis localhost terus
test.use({ baseURL: 'http://localhost:3000' });

test.describe('Authentication Flow & UI Validations', () => {
  
  test('Negative: Harus memunculkan error jika kredensial salah', async ({ page }) => {
    await page.goto('/login');

    // Mengisi input berdasarkan placeholder yang kita buat di UI
    await page.getByPlaceholder('Masukkan username').fill('user_ngasal');
    await page.getByPlaceholder('Masukan Password').fill('password_salah');
    
    // Klik tombol login
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();

    // Memastikan alert error muncul
    const errorMessage = page.locator('.text-red-600');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Kredensial tidak valid. Silakan periksa kembali.');
    
    // Memastikan URL tidak berpindah (masih di halaman login)
    await expect(page).toHaveURL(/.*login/);
  });

  test('Positive: Harus berhasil login dan masuk ke dashboard', async ({ page }) => {
    await page.goto('/login');

    // Menggunakan akun yang baru kita daftarkan di database tadi
    await page.getByPlaceholder('Masukkan username').fill('budi_bendahara');
    await page.getByPlaceholder('Masukan Password').fill('password123');
    
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();

    // Robot akan menunggu sampai navigasi URL berubah menjadi /dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Mengecek apakah localStorage menyimpan data user
    const userInfo = await page.evaluate(() => localStorage.getItem('userInfo'));
    expect(userInfo).not.toBeNull();
    expect(JSON.parse(userInfo as string).username).toBe('budi_bendahara');
  });

  test('UI Element: Toggle show/hide password harus berfungsi', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.getByPlaceholder('Masukan Password');
    await passwordInput.fill('rahasia123');
    
    // Secara default, tipe input harus 'password'
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Klik tombol ikon mata (berada di dalam input relative)
    await page.locator('button[type="button"]').click();

    // Tipe input harus berubah menjadi 'text' agar tulisan terlihat
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
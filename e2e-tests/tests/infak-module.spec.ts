// e2e-tests/tests/infak-module.spec.ts
import { test, expect, Page } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3000' });

// Fungsi pembantu untuk membaca saldo dari UI dan mengubahnya menjadi angka murni
async function getWalletBalance(page: Page): Promise<number> {
  // Mengambil elemen <p> yang berada tepat di bawah tulisan "Total Saldo Sah Kas"
  const balanceText = await page.locator('p:has-text("Total Saldo Sah Kas") + p').innerText();
  // Membersihkan Rp, titik, dan spasi. Contoh: "Rp 200.000" -> 200000
  return parseInt(balanceText.replace(/[^0-9]/g, ''), 10);
}

test.describe('Modul Infak & Kurban: Alur Sinkronisasi Brankas Dua Lapis', () => {

  test('Skenario Sukses: Pemasukan Infak Di-ACC & Saldo Pusat Otomatis Bertambah', async ({ page }) => {
    const NOMINAL_INFAK = 100000; // Rp 100.000

    // 1. CEK SALDO AWAL BENDAHARA
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('budi_bendahara');
    await page.getByPlaceholder('Masukan Password').fill('password123');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');
    await page.goto('/dashboard/keuangan');
    
    const saldoAwal = await getWalletBalance(page);
    console.log(`[REPORT] Saldo Awal Brankas RT: Rp ${saldoAwal.toLocaleString('id-ID')}`);

    // 2. LOGIN SEBAGAI PENGURUS INFAK & INPUT KAS MASUK
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('mutia_infak'); 
    await page.getByPlaceholder('Masukan Password').fill('12345678');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/dashboard/infak');
    await page.click('button:has-text("+ Catat Mutasi Infak")');
    await page.locator('form select').selectOption('Masuk'); // Debit
    await page.getByPlaceholder('Contoh: 50.000').fill(NOMINAL_INFAK.toString());
    await page.getByPlaceholder('Contoh: Pembelian sembako duka warga atau Iuran kurban bulanan').fill('Infak Kumpulan Rutin Warga (QA Debit Test)');
    await page.click('button:has-text("Simpan Berkas")');

    // Ajukan ke Bendahara
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Setor")');
    await expect(page.getByText('Menunggu Konfirmasi')).toBeVisible();

    // 3. BENDAHARA ACC & VERIFIKASI SALDO KAS WAJIB BERTAMBAH
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('budi_bendahara');
    await page.getByPlaceholder('Masukan Password').fill('password123');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');
    await page.goto('/dashboard/keuangan');

    // Validasi Klik ACC / Sahkan
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("ACC / Sahkan")');

    // Ambil Saldo Akhir
    const saldoAkhir = await getWalletBalance(page);
    console.log(`[REPORT] Saldo Akhir Setelah ACC Infak: Rp ${saldoAkhir.toLocaleString('id-ID')}`);

    // VALIDASI AUDIT MATEMATIKA: Saldo Akhir harus bertambah pas Rp 100.000
    expect(saldoAkhir).toBe(saldoAwal + NOMINAL_INFAK);
  });

  test('Skenario Negatif: Pengeluaran Kurban Ditolak Bendahara & Saldo Pusat Tetap Utuh', async ({ page }) => {
    const NOMINAL_PENARIKAN = 50000; // Rp 50.000

    // 1. CEK SALDO SEBELUM OPERASI
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('budi_bendahara');
    await page.getByPlaceholder('Masukan Password').fill('password123');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');
    await page.goto('/dashboard/keuangan');
    
    const saldoSebelumDitolak = await getWalletBalance(page);

    // 2. LOGIN SEBAGAI INFAK & INPUT PENGELUARAN SOSIAL (KREDIT)
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('mutia_infak'); 
    await page.getByPlaceholder('Masukan Password').fill('12345678');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/dashboard/infak');
    await page.click('button:has-text("+ Catat Mutasi Infak")');
    await page.locator('form select').selectOption('Keluar'); // Kredit
    await page.getByPlaceholder('Contoh: 50.000').fill(NOMINAL_PENARIKAN.toString());
    await page.getByPlaceholder('Contoh: Pembelian sembako duka warga atau Iuran kurban bulanan').fill('Pembelian Terpal Kurban (QA Negative Test)');
    await page.click('button:has-text("Simpan Berkas")');

    // Ajukan berkas
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Ajukan")');

    // 3. LOGIN BENDAHARA & KLIK TOLAK (REJECT)
    await page.goto('/login');
    await page.getByPlaceholder('Masukkan Username').fill('budi_bendahara');
    await page.getByPlaceholder('Masukan Password').fill('password123');
    await page.getByRole('button', { name: 'Masuk ke Sistem' }).click();
    await page.waitForURL('**/dashboard');
    await page.goto('/dashboard/keuangan');

    // Bendahara Menolak Pengajuan Dana
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Tolak")');

    // 4. VERIFIKASI PERTAHANAN BRANKAS: Saldo tidak boleh berubah sedikitpun!
    const saldoSesudahDitolak = await getWalletBalance(page);
    console.log(`[REPORT] Proteksi Dua Lapis Sukses. Saldo Tetap: Rp ${saldoSesudahDitolak.toLocaleString('id-ID')}`);
    
    expect(saldoSesudahDitolak).toBe(saldoSebelumDitolak);
  });
});
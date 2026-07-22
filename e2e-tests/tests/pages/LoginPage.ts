import { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly passwordToggleBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByPlaceholder('Masukkan username');
    this.passwordInput = page.getByPlaceholder('Masukan Password');
    this.loginButton = page.getByRole('button', { name: 'Masuk ke Sistem' });
    this.errorMessage = page.locator('.text-red-600');
    this.passwordToggleBtn = page.locator('button[type="button"]');
  }

  // Aksi navigasi ke halaman login
  async goto() {
    await this.page.goto('/login');
  }

  // Aksi alur login kombinasi mengisi input dan klik button
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
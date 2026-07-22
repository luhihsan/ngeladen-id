import { test, expect } from '@playwright/test';
import { LoginPage } from '../tests/pages/LoginPage';


test.describe('Authentication Flow & UI Validations (Refactored with POM)', () => {

  test('Positive: Harus berhasil login dan masuk ke dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const username = process.env.VALID_USERNAME_KETUA || 'rafly_ketua';
    const password = process.env.VALID_PASSWORD_KETUA || '12345678';
    
    await loginPage.login(username, password);

    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    
    const userInfo = await page.evaluate(() => localStorage.getItem('userInfo'));
    expect(userInfo).not.toBeNull();
    expect(JSON.parse(userInfo as string).username).toBe(username);
  });
  
  test('Negative: Harus memunculkan error jika kredensial salah', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('user_ngasal', 'password_salah');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Username atau password salah');
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('UI Element: Toggle show/hide password harus berfungsi', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.passwordInput.fill('12345678');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    await loginPage.passwordToggleBtn.click();

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
  });
});
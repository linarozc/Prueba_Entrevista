import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/signup');
});

test.describe('Testing Signup', () => {
    test('Debería crear una nueva cuenta correctamente', async ({ page }) => {
        const randomUsername = 'testuser' + Math.floor(Math.random() * 10000);
        const testuser1 = randomUsername;

        await page.fill('input[name="username"]', testuser1);
        await page.fill('input[name="password"]', 'testpassword');
        await page.fill('input[name="confirmPassword"]', 'testpassword');
        
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('http://localhost:4200/posts', { timeout: 40000 });
    });

    test('Datos Vacios', async ({ page }) => {
        await page.fill('input[name="username"]', '');
        await page.fill('input[name="password"]', '');
        await page.fill('input[name="confirmPassword"]', '');

        await page.click('button[type="submit"]');

        const errorUsername = await page.locator('text="String must contain at least 3 character(s)"').isVisible();
        const errorPassword = await page.locator('text="String must contain at least 8 character(s)"');
        const errorConfirmPassword = await page.locator('text="String must contain at least 8 character(s)"');

        await expect(errorUsername).toBeTruthy();
        await expect(errorPassword).toBeTruthy();
        await expect(errorConfirmPassword).toBeTruthy();
    });

    test('Password no son iguales', async ({ page }) => {
        await page.fill('input[name="username"]', 'testuser');
        await page.fill('input[name="password"]', '123456789');
        await page.fill('input[name="confirmPassword"]', '987654321');

        const errorConfirmPassword = await page.locator('text="Passwords don\'t match"').isVisible();

        await expect(errorConfirmPassword).toBeTruthy();
    });
});
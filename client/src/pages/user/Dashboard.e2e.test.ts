import { test, expect } from '@playwright/test';

// Use the stored authentication state
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Authenticated tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/');

        // Ensure user dropdown is clickable and visible
        const userButton = page.getByRole('button', { name: /Test User/i });
        await expect(userButton).toBeVisible();
        await userButton.click();

        // Navigate to Dashboard
        await page.getByRole('link', { name: 'Dashboard' }).click();

        // Wait for the orders page to fully load
        await expect(page).toHaveURL('http://localhost:3000/dashboard/user');
    });

    test.afterEach(async ({ page }) => {
        // Return to HomePage
        const homeLink = page.getByRole('link', { name: 'Home' });
        await expect(homeLink).toBeVisible();
        await homeLink.click();

        // Confirm navigation success
        await expect(page).toHaveURL('http://localhost:3000/');
    });

    test('able to visit a protected resource after authentication', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/user');
        await expect(page).toHaveURL('http://localhost:3000/dashboard/user');
    });

    test('dashboard and all relevant fields are visible', async ({ page }) => {
        // Assert Dashboard component
        const dashboardText = [
            'Dashboard',
            'Profile',
            'Orders',
            'Test User',
            'test@test.com',
            'test st',
        ];
        for (const text of dashboardText) {
            await expect(page.getByRole('main')).toContainText(text);
        }
    });
});

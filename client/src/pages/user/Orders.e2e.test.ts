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

        // Navigate to Dashboard -> Orders
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Orders' }).click();

        // Wait for the orders page to fully load
        await expect(page).toHaveURL(/dashboard\/user\/orders/);
        await expect(page.getByRole('main')).toContainText('All Orders');
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

    test('able to view the orders made by this user', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('All Orders');

        // Assert table attributes
        const tableAttributes = ['#', 'Status', 'Buyer', 'date', 'Payment', 'Quantity'];
        for (const text of tableAttributes) {
            await expect(page.locator('thead')).toContainText(text);
        }

        // Assert order attributes
        const rowValues = ['1', 'Not Process', 'Test User', 'a few seconds ago', 'Failed', '3'];
        for (const text of rowValues) {
            await expect(page.locator('tbody')).toContainText(text);
        }

        // Assert data displayed under Order #1
        await expect(page.getByRole('img', { name: 'NUS T-shirt' })).toBeVisible();
        await expect(page.getByRole('img', { name: 'Laptop' }).first()).toBeVisible();
        await expect(page.getByRole('img', { name: 'Laptop' }).nth(1)).toBeVisible();

        await expect(page.getByText('NUS T-shirt', { exact: true })).toBeVisible();
        await expect(page.getByRole('main')).toContainText('NUS T-shirt');
        await expect(page.getByRole('main')).toContainText('Laptop');
        await expect(page.getByRole('main')).toContainText('Plain NUS T-shirt for sale');
        await expect(page.getByRole('main')).toContainText('Price : 4.99');
        await expect(page.getByRole('main')).toContainText('A powerful laptop');
        await expect(page.getByRole('main')).toContainText('Price : 1499.99');
    });
});

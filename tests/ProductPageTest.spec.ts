import { test, expect } from '@playwright/test';

test('Admin can create a product and verify it appears + is editable', async ({
    page,
}) => {
    // Login to account as admin
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page
        .getByRole('textbox', { name: 'Enter Your Email' })
        .fill('admin@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page
        .getByRole('textbox', { name: 'Enter Your Password' })
        .fill('test123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Go to Create Product link
    await page.getByRole('button', { name: 'Test Admin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Create Product' }).click();

    // Fill up Create Product page
    await page.locator('#rc_select_0').click();
    await page.getByTitle('Electronics').locator('div').click();
    await page.getByRole('textbox', { name: 'Enter name' }).click();
    await page.getByRole('textbox', { name: 'Enter name' }).fill('Big TV');
    await page.getByRole('textbox', { name: 'Enter name' }).press('Tab');
    await page
        .getByRole('textbox', { name: 'Enter description' })
        .fill('Big TV description');
    await page.getByRole('textbox', { name: 'Enter description' }).press('Tab');
    await page.getByPlaceholder('Enter price').fill('1200');
    await page.getByPlaceholder('Enter price').press('Tab');
    await page.getByPlaceholder('Enter quantity').fill('40');
    await page.getByPlaceholder('Enter quantity').press('Tab');
    await page
        .locator('div')
        .filter({ hasText: /^Select shipping$/ })
        .nth(1)
        .click();
    await page.getByText('Yes').click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    // Redirect to homepage, homepage should contain Big TV/description
    await expect(page.getByRole('main')).toContainText('Big TV');
    await expect(page.getByRole('main')).toContainText('Big TV description');

    // Clicking on the Big TV card should lead to Update Product page containing the
    // Big TV's description
    await page.getByRole('link', { name: 'Big TV Big TV Big TV' }).click();
    await expect(page.locator('h1')).toContainText('Update Product');
    await expect(page.getByPlaceholder('Enter description')).toContainText(
        'Big TV description'
    );
    await expect(page.getByRole('main')).toContainText('yes');
});

test('Non-admin should not be able to create a product', async ({ page }) => {
    // Login as non-admin
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page
        .getByRole('textbox', { name: 'Enter Your Email' })
        .fill('test@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).press('Tab');
    await page
        .getByRole('textbox', { name: 'Enter Your Password' })
        .fill('test123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Go to dashboard
    await page.getByRole('button', { name: 'Test User' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();

    // Non-admin should not be able to create a product (Create Product link missing)
    const createProductLink = page.getByRole('link', {
        name: 'Create Product',
    });
    await expect(
        createProductLink,
        'Non-admin should not see Create Product'
    ).toHaveCount(0);

    // Non-admin should still see Profile and Orders page
    await expect(page.getByRole('main')).toContainText('Profile');
    await expect(page.getByRole('main')).toContainText('Orders');
});

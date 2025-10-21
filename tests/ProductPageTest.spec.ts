import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

// reset test data before each test
test.beforeEach(async ({ request }) => {
    const response = await request.post(
        'http://localhost:6060/api/v1/test/reset'
    );
    expect(response.ok()).toBeTruthy();
});

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

test('Non-admin should not be able to create/update a product', async ({
    page,
}) => {
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

test('Non-logged in user should be redirected to login page when accessing admin dashboard', async ({
    page,
}) => {
    // Don't login, go to admin dashboard
    await page.goto('http://localhost:3000/dashboard/admin/products');

    // Should show redirect text
    await expect(page.getByRole('heading')).toContainText(
        'redirecting to you in'
    );

    // Wait for the redirect to complete
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login$/);

    // Verify login page loaded
    await expect(page.getByRole('main')).toContainText('LOGIN FORM');
});

test('Logged in non-admin user should be redirected to homepage when accessing admin dashboard', async ({
    page,
}) => {
    // Login as non-admin
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page
        .getByRole('textbox', { name: 'Enter Your Email' })
        .fill('test@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page
        .getByRole('textbox', { name: 'Enter Your Password' })
        .fill('test123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Ensure user is logged in first
    await expect(page.getByRole('button', { name: 'Test User' })).toHaveCount(
        1
    );

    // Go to admin dashboard
    await page.goto('http://localhost:3000/dashboard/admin/products');

    // Should show redirect text
    await expect(page.getByRole('heading')).toContainText(
        'redirecting to you in'
    );

    // Wait for the redirect to complete
    await page.waitForURL('http://localhost:3000/');
    await expect(page).toHaveURL('http://localhost:3000/');

    // Verify home page loaded
    await expect(page.getByRole('main')).toContainText('All Products');
});

test('Admin should be able to update a product', async ({ page }) => {
    // Login as admin user
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page
        .getByRole('textbox', { name: 'Enter Your Email' })
        .fill('admin@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page
        .getByRole('textbox', { name: 'Enter Your Password' })
        .fill('test123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Check that original page has "The Law of Contract in Singapore" book
    await expect(page.getByRole('main')).toContainText(
        'The Law of Contract in Singapore'
    );
    await expect(page.getByRole('main')).toContainText('$54.99');
    await expect(page.getByRole('main')).toContainText(
        'A bestselling book in Singapore...'
    );

    // Go to product admin page
    await page.getByRole('button', { name: 'Test Admin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Products' }).click();

    // Check that "The Law of Contract in Singapore" is in the product admin page
    await expect(page.getByRole('main')).toContainText(
        'The Law of Contract in Singapore'
    );
    await expect(page.getByRole('main')).toContainText(
        'A bestselling book in Singapore'
    );
    await page.getByRole('link', { name: 'The Law of Contract in' }).click();

    // Check that initial form fields are hydrated
    await expect(page.getByRole('textbox', { name: 'Enter name' })).toHaveValue(
        'The Law of Contract in Singapore'
    );
    await expect(
        page.getByRole('textbox', { name: 'Enter description' })
    ).toHaveValue('A bestselling book in Singapore');
    await expect(page.getByPlaceholder('Enter price')).toHaveValue('54.99');

    // Update form fields
    await page.getByRole('textbox', { name: 'Enter name' }).click();
    await page
        .getByRole('textbox', { name: 'Enter name' })
        .fill('The Good Law of Contract in Singapore');
    await page.getByRole('textbox', { name: 'Enter description' }).click();
    await page
        .getByRole('textbox', { name: 'Enter description' })
        .fill('An actual bestselling book in Singapore');
    await page.getByPlaceholder('Enter price').click();
    await page.getByPlaceholder('Enter price').fill('44.99');

    // Sanity check: Form fields are filled up
    await expect(page.getByRole('textbox', { name: 'Enter name' })).toHaveValue(
        'The Good Law of Contract in Singapore'
    );
    await expect(
        page.getByRole('textbox', { name: 'Enter description' })
    ).toHaveValue('An actual bestselling book in Singapore');
    await expect(page.getByPlaceholder('Enter price')).toHaveValue('44.99');

    // Click on "Update Product" button
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();

    // Check that "The Good Law of Contract in Singapore" is in the product admin page
    await expect(page.getByRole('main')).toContainText(
        'The Good Law of Contract in Singapore'
    );
    await expect(page.getByRole('main')).toContainText(
        'An actual bestselling book in Singapore'
    );

    // Check that "The Good Law of Contract in Singapore" is in the homepage
    await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
    await expect(page.getByRole('main')).toContainText(
        'The Good Law of Contract in Singapore'
    );
    await expect(page.getByRole('main')).toContainText('$44.99');
    await expect(page.getByRole('main')).toContainText(
        'An actual bestselling book in Singapore...'
    );
});

test('Admin should be able to delete a product', async ({ page }) => {
    // Check if homepage contains "Novel"
    await page.goto('http://localhost:3000/');
    await expect(page.getByRole('main')).toContainText('Novel');
    await expect(page.getByRole('main')).toContainText('$14.99');
    await expect(page.getByRole('main')).toContainText(
        'A bestselling novel...'
    );

    // Login as admin
    await page.getByRole('link', { name: 'Login' }).click();
    await page
        .getByRole('textbox', { name: 'Enter Your Email' })
        .fill('admin@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).press('Tab');
    await page
        .getByRole('textbox', { name: 'Enter Your Password' })
        .fill('test123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Go to admin dashboard
    await page.getByRole('button', { name: 'Test Admin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Products' }).click();

    // Check that "Novel" is in admin dashboard product list
    await expect(page.getByRole('main')).toContainText('Novel');
    await expect(page.getByRole('main')).toContainText('A bestselling novel');
    await page.getByRole('link', { name: 'Novel Novel A bestselling' }).click();

    // Delete product, accept delete dialog
    page.once('dialog', async (dialog) => {
        console.log(`Dialog message: ${dialog.message()}`);
        await dialog.accept('Y');
    });
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();

    // Go back to admin products page, ensure "Novel" is no longer there
    await page.goto('http://localhost:3000/dashboard/admin/products');
    await expect(page.getByRole('main')).not.toContainText('Novel');
    await expect(page.getByRole('main')).not.toContainText(
        'A bestselling novel'
    );

    // Go back to homepage and ensure "Novel" is no longer there
    await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
    await expect(page.getByRole('main')).not.toContainText('Novel');
    await expect(page.getByRole('main')).not.toContainText('$14.99');
    await expect(page.getByRole('main')).not.toContainText(
        'A bestselling novel...'
    );
});

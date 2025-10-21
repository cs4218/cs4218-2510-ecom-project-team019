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

    // Go to Update Product page for Novel, ensuring fields are loaded and
    // allowing the "Novel" product to be deleted
    await page.getByRole('link', { name: 'Novel Novel A bestselling' }).click();
    await expect(page.getByRole('textbox', { name: 'Enter name' })).toHaveValue(
        'Novel'
    );

    // Delete product, accept delete dialog
    page.once('dialog', async (dialog) => {
        console.log(`Dialog message: ${dialog.message()}`);
        await dialog.accept('Y');
    });
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();

    // Deletion success toast should show up
    await expect(page.getByText(/product deleted successfully/i)).toBeVisible();

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

test('Admin should not be able to create a duplicate product', async ({
    page,
}) => {
    // Login to application
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page
        .getByRole('textbox', { name: 'Enter Your Email' })
        .fill('admin@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).press('Tab');
    await page
        .getByRole('textbox', { name: 'Enter Your Password' })
        .fill('test123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // The homepage should contain a "Novel"
    await expect(page.getByRole('main')).toContainText('Novel');

    // The admin products page should contain a "Novel" as well
    await page.getByRole('button', { name: 'Test Admin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page.getByRole('main')).toContainText('Novel');

    /* Go to "Create Product" to create a new "Novel", which should fail */

    // Go to "Create Product" page
    await page.getByRole('link', { name: 'Create Product' }).click();

    // Fill up fields of new "Novel"
    await page.locator('#rc_select_0').click();
    await page.getByTitle('Electronics').locator('div').click();
    await page.getByRole('textbox', { name: 'Enter name' }).click();
    await page.getByRole('textbox', { name: 'Enter name' }).fill('Novel');
    await page.getByRole('textbox', { name: 'Enter description' }).click();
    await page
        .getByRole('textbox', { name: 'Enter description' })
        .fill('This should fail');
    await page.getByPlaceholder('Enter price').click();
    await page.getByPlaceholder('Enter price').fill('3000');
    await page.getByPlaceholder('Enter quantity').click();
    await page.getByPlaceholder('Enter quantity').fill('20');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();

    // Create new "Novel" product
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    // Error toast should show up, showing that "Novel" product already exists
    await expect(page.getByText(/product already exists/i)).toBeVisible();
});

test('Admin should not be able to update a product to an existing product name', async ({
    page,
}) => {
    // Login to account
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page
        .getByRole('textbox', { name: 'Enter Your Email' })
        .fill('admin@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).press('Tab');
    await page
        .getByRole('textbox', { name: 'Enter Your Password' })
        .fill('test123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    /* We want to update "Novel" -> "The Law of Contract in Singapore", which should fail */

    // Ensure we have the two products: "The Law of Contract in Singapore" and "Novel" on homepage
    await expect(page.getByRole('main')).toContainText(
        'The Law of Contract in Singapore'
    );
    await expect(page.getByRole('main')).toContainText('Novel');

    // Ensure we have the two products: "The Law of Contract in Singapore" and "Novel"
    // on admin dashboard products page
    await page.getByRole('button', { name: 'Test Admin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page.getByRole('main')).toContainText(
        'The Law of Contract in Singapore'
    );
    await expect(page.getByRole('main')).toContainText('Novel');

    // Update "Novel" -> "The Law of Contract in Singapore"
    await page.getByRole('link', { name: 'Novel Novel A bestselling' }).click();
    await expect(page.getByRole('textbox', { name: 'Enter name' })).toHaveValue(
        'Novel'
    );
    await page.getByRole('textbox', { name: 'Enter name' }).click();
    await page
        .getByRole('textbox', { name: 'Enter name' })
        .fill('The Law of Contract in Singapore');
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();

    // Ensure toast error is created on product update
    await expect(
        page.getByText(/something went wrong when updating product/i)
    ).toBeVisible();

    // Ensure we still have the two products: "The Law of Contract in Singapore"
    // and "Novel" on admin dashboard products page
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page.getByRole('main')).toContainText('Novel');

    // Go back to homepage and ensure "Novel" and "The Law of Contract in Singapore"
    // are still present
    await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
    await expect(page.getByRole('main')).toContainText(
        'The Law of Contract in Singapore'
    );
    await expect(page.getByRole('main')).toContainText('Novel');
});

test('Admin should be able to update a product with name unchanged', async ({
    page,
}) => {
    // Login to account
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page
        .getByRole('textbox', { name: 'Enter Your Email' })
        .fill('admin@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).press('Tab');
    await page
        .getByRole('textbox', { name: 'Enter Your Password' })
        .fill('test123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    /* We want to update "The Law of Contract in Singapore" description but leave the name unchanged */

    // Ensure we have the product name and description on homepage
    await expect(page.getByRole('main')).toContainText(
        'The Law of Contract in Singapore'
    );
    await expect(page.getByRole('main')).toContainText(
        'A bestselling book in Singapore...'
    );

    // Ensure we have the product name and description on admin dashboard products page
    await page.getByRole('button', { name: 'Test Admin' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page.getByRole('main')).toContainText(
        'The Law of Contract in Singapore'
    );
    await expect(page.getByRole('main')).toContainText(
        'A bestselling book in Singapore'
    );

    // Update "The Law of Contract in Singapore" description
    await page.getByRole('link', { name: 'The Law of Contract in' }).click();

    await expect(page.getByRole('textbox', { name: 'Enter name' })).toHaveValue(
        'The Law of Contract in Singapore'
    );
    await expect(
        page.getByRole('textbox', { name: 'Enter description' })
    ).toHaveValue('A bestselling book in Singapore');

    await page.getByRole('textbox', { name: 'Enter description' }).click();
    await page
        .getByRole('textbox', { name: 'Enter description' })
        .fill('A very bestselling book in Singapore');
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();

    // Ensure we have the updated product description and same product name
    // on admin dashboard products page
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page.getByRole('main')).toContainText(
        'The Law of Contract in Singapore'
    );
    await expect(page.getByRole('main')).toContainText(
        'A very bestselling book in Singapore'
    );

    // Go back to homepage and ensure updated product description and
    // same product name are present
    await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
    await expect(page.getByRole('main')).toContainText(
        'The Law of Contract in Singapore'
    );
    await expect(page.getByRole('main')).toContainText(
        'A very bestselling book in Singapore'
    );
});

test('User should be able to view product details and related product details', async ({
    page,
}) => {
    // Look at "Smartphone" on homepage
    await page.goto('http://localhost:3000/');
    await expect(page.getByRole('main')).toContainText('Smartphone');
    await expect(page.getByRole('main')).toContainText('$999.99');
    await expect(page.getByRole('main')).toContainText(
        'A high-end smartphone...'
    );

    // Click on "More Details" button to go to ProductDetails page for "Smartphone"
    await page
        .locator('div:nth-child(4) > .card-body > div:nth-child(3) > button')
        .first()
        .click();
    await page.waitForURL('**/product/smartphone');
    await expect(page).toHaveURL(/\/product\/smartphone$/);

    // Check smartphone product details
    await expect(page.locator('h1')).toContainText('Product Details');
    await expect(page.getByRole('main')).toContainText('Name: Smartphone');
    await expect(page.getByRole('main')).toContainText(
        'Description: A high-end smartphone'
    );
    await expect(page.getByRole('main')).toContainText('Price: $999.99');
    await expect(page.getByRole('main')).toContainText('Category: Electronics');

    // Check smartphone similar product details
    await expect(page.getByRole('main')).toContainText('Similar Products ➡️');
    await expect(page.getByRole('main')).toContainText('Laptop');
    await expect(page.getByRole('main')).toContainText('$1,499.99');
    await expect(page.getByRole('main')).toContainText('A powerful laptop...');

    // Click on "More Details" button to go to ProductDetails page for "Laptop"
    await page.getByRole('button', { name: 'More Details' }).click();
    await page.waitForURL('**/product/laptop');
    await expect(page).toHaveURL(/\/product\/laptop$/);

    // Check laptop product details
    await expect(page.locator('h1')).toContainText('Product Details');
    await expect(page.getByRole('main')).toContainText('Name: Laptop');
    await expect(page.getByRole('main')).toContainText(
        'Description: A powerful laptop'
    );
    await expect(page.getByRole('main')).toContainText('Price: $1,499.99');
    await expect(page.getByRole('main')).toContainText('Category: Electronics');

    // Check smartphone similar product details
    await expect(page.getByRole('main')).toContainText('Similar Products ➡️');
    await expect(page.getByRole('main')).toContainText('Smartphone');
    await expect(page.getByRole('main')).toContainText('$999.99');
    await expect(page.getByRole('main')).toContainText(
        'A high-end smartphone...'
    );
});

test('User should be able to view products of a specific category and view product details', async ({
    page,
}) => {
    // Go to homepage
    await page.goto('http://localhost:3000/');

    // Go to all category listing page
    await page.getByRole('link', { name: 'Categories' }).click();
    await page.getByRole('link', { name: 'All Categories' }).click();
    await page.waitForURL('**/categories');
    await expect(page).toHaveURL(/\/categories$/);

    // Ensure there are 3 category listings: Electronics, Book, Clothing
    await expect(page.getByRole('main')).toContainText('Electronics');
    await expect(page.getByRole('main')).toContainText('Book');
    await expect(page.getByRole('main')).toContainText('Clothing');

    // Go to "Electronics" page to view products with "Electronics" category
    await page.getByRole('link', { name: 'Electronics' }).click();

    await page.waitForURL('**/category/electronics');
    await expect(page).toHaveURL(/\/category\/electronics$/);
    await expect(page.getByRole('main')).toContainText(
        'Category - Electronics'
    );
    await expect(page.locator('h6')).toContainText('2 results found');
    await expect(page.getByRole('main')).toContainText('Laptop');
    await expect(page.getByRole('main')).toContainText('$1,499.99');
    await expect(page.getByRole('main')).toContainText('A powerful laptop...');
    await expect(page.getByRole('main')).toContainText('Smartphone');
    await expect(page.getByRole('main')).toContainText('$999.99');
    await expect(page.getByRole('main')).toContainText(
        'A high-end smartphone...'
    );

    // Click on more details for "Laptop"
    await page.getByRole('button', { name: 'More Details' }).first().click();

    // Should go to product details page for "Laptop"
    await page.waitForURL('**/product/laptop');
    await expect(page).toHaveURL(/\/product\/laptop$/);
    await expect(page.locator('h1')).toContainText('Product Details');
    await expect(page.getByRole('main')).toContainText('Name: Laptop');
});

test('User should be able to directly navigate to category page', async ({
    page,
}) => {
    // Go to homepage
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Categories' }).click();

    // Go to "Clothing" page to view products with "Clothing" category
    await page.getByRole('link', { name: 'Clothing' }).click();

    await page.waitForURL('**/category/clothing');
    await expect(page).toHaveURL(/\/category\/clothing$/);

    await expect(page.getByRole('main')).toContainText('Category - Clothing');
    await expect(page.locator('h6')).toContainText('1 result found');
    await expect(page.getByRole('main')).toContainText('NUS T-shirt');
    await expect(page.getByRole('main')).toContainText('$4.99');
    await expect(page.getByRole('main')).toContainText(
        'Plain NUS T-shirt for sale...'
    );

    // Click on more details for "NUS T-shirt"
    await page.getByRole('button', { name: 'More Details' }).click();

    // Should go to product details page for "NUS T-shirt"
    await page.waitForURL('**/product/nus-tshirt');
    await expect(page).toHaveURL(/\/product\/nus-tshirt$/);
    await expect(page.locator('h1')).toContainText('Product Details');
    await expect(page.getByRole('main')).toContainText('Name: NUS T-shirt');
});

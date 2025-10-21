import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  // Login as admin before all tests
  page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test123');
  await page.getByRole('button', { name: 'LOGIN' }).click();
});

test.beforeEach(async () => {
  // Navigate to categories page before each test
  await page.goto('http://localhost:3000/categories');
});

test('should have a category page', async () => {
  // Verify that existing categories are displayed on the categories page
  await page.getByRole('link', { name: 'Categories' }).click();
  await page.getByRole('link', { name: 'All Categories' }).click();
  await expect(page.getByRole('link', { name: 'Electronics' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Clothing' })).toBeVisible();
});

test('should see newly created categories in all categories page and dropdown', async () => {
  // Create a new category
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test123');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.getByRole('button', { name: 'Test Admin' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Verify that the newly created category appears in the categories dropdown and all categories page
  await page.getByRole('link', { name: 'Categories' }).click();
  await expect(page.locator('#navbarTogglerDemo01').getByRole('link', { name: 'test category' })).toBeVisible();
  await page.getByRole('link', { name: 'All Categories' }).click();
  await expect(page.getByRole('link', { name: 'test category' })).toBeVisible();
  await page.getByRole('link', { name: 'test category' }).click();
  await expect(page.getByRole('heading', { name: 'Category - test category' })).toBeVisible();
});

test('should delete the newly created category from all categories page and dropdown', async () => {
  // Delete the newly created category
  await page.getByRole('button', { name: 'Test Admin' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('button', { name: 'Delete' }).nth(3).click();
  await expect(page.locator('div').filter({ hasText: 'Category is deleted' }).nth(4)).toBeVisible();
  // Verify that the deleted category no longer appears in the categories dropdown and all categories page
  await page.getByRole('link', { name: 'Categories' }).click();
  await expect(page.locator('#navbarTogglerDemo01').getByRole('link', { name: 'test category' })).toBeHidden();
  await page.getByRole('link', { name: 'All Categories' }).click();
  await expect(page.getByRole('link', { name: 'test category' })).toBeHidden();
});

test('should navigate to category page when a category is clicked', async () => {
  // Verify navigation to category pages
  await page.getByRole('link', { name: 'Electronics' }).click();
  await expect(page.getByRole('heading', { name: 'Category - Electronics' })).toBeVisible();
  await page.goto('http://localhost:3000/categories');
  await page.getByRole('link', { name: 'Book' }).click();
  await expect(page.getByRole('heading', { name: 'Category - Book' })).toBeVisible();
  await page.goto('http://localhost:3000/categories');
});

test('should display edited category name on category page', async () => {
  // Check the products of a current category
  await page.getByRole('link', { name: 'Clothing' }).click();
  await expect(page.getByText('Category - Clothing1 result')).toBeVisible();
  await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - img "NUS T-shirt"
    - heading "NUS T-shirt" [level=5]
    - heading /\\$\\d+\\.\\d+/ [level=5]
    - paragraph: Plain NUS T-shirt for sale...
    - button "More Details"
    `);

  // Edit the category name from admin dashboard
  await page.getByRole('button', { name: 'Test Admin' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('button', { name: 'Edit' }).nth(2).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill('Clothing edited');
  await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();

  // Verify that the edited category name is displayed on the category page
  await page.getByRole('link', { name: 'Categories' }).click();
  await expect(page.locator('#navbarTogglerDemo01').getByRole('link', { name: 'Clothing edited' })).toBeVisible();
  await page.getByRole('link', { name: 'Clothing edited' }).click();
  await expect(page.getByRole('heading', { name: 'Category - Clothing edited' })).toBeVisible();
  await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - img "NUS T-shirt"
    - heading "NUS T-shirt" [level=5]
    - heading /\\$\\d+\\.\\d+/ [level=5]
    - paragraph: Plain NUS T-shirt for sale...
    - button "More Details"
    `);
});

test('should be able to display many categories without UI issues', async () => {
  // Create many categories to test UI handling
  await page.getByRole('button', { name: 'Test Admin' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 1');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 2');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 3');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 4');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 5');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 6');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 7');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 8');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 9');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 10');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Verify that all newly created categories are displayed properly in the categories dropdown and all categories page
  await page.getByRole('link', { name: 'Categories' }).click();
  await expect(page.locator('#navbarTogglerDemo01')).toMatchAriaSnapshot(`
    - list:
      - listitem:
        - link "All Categories"
      - listitem:
        - link "Electronics"
      - listitem:
        - link "Book"
      - listitem:
        - link "Clothing"
      - listitem:
        - link "test category 1"
      - listitem:
        - link "test category 2"
      - listitem:
        - link "test category 3"
      - listitem:
        - link "test category 4"
      - listitem:
        - link "test category 5"
      - listitem:
        - link "test category 6"
      - listitem:
        - link "test category 7"
      - listitem:
        - link "test category 8"
      - listitem:
        - link "test category 9"
      - listitem:
        - link /test category \\d+/
    `);

  await page.getByRole('link', { name: 'All Categories' }).click();
  await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - link "Electronics"
    - link "Book"
    - link "Clothing"
    - link "test category 1"
    - link "test category 2"
    - link "test category 3"
    - link "test category 4"
    - link "test category 5"
    - link "test category 6"
    - link "test category 7"
    - link "test category 8"
    - link "test category 9"
    - link /test category \\d+/
    `);

  // Clean up by deleting the newly created categories
  await page.getByRole('button', { name: 'Test Admin' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('row', { name: 'test category 1 Edit Delete' }).getByRole('button').nth(1).click();
  await page.getByRole('row', { name: 'test category 2 Edit Delete' }).getByRole('button').nth(1).click();
  await page.getByRole('row', { name: 'test category 3 Edit Delete' }).getByRole('button').nth(1).click();
  await page.getByRole('row', { name: 'test category 4 Edit Delete' }).getByRole('button').nth(1).click();
  await page.getByRole('row', { name: 'test category 5 Edit Delete' }).getByRole('button').nth(1).click();
  await page.getByRole('row', { name: 'test category 6 Edit Delete' }).getByRole('button').nth(1).click();
  await page.getByRole('row', { name: 'test category 7 Edit Delete' }).getByRole('button').nth(1).click();
  await page.getByRole('row', { name: 'test category 8 Edit Delete' }).getByRole('button').nth(1).click();
  await page.getByRole('button', { name: 'Delete' }).nth(3).click();
  await page.getByRole('button', { name: 'Delete' }).nth(3).click();
});

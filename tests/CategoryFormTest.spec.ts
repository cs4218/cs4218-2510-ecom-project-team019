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

  // Navigate to create category page before all tests
  await page.getByRole('button', { name: 'Test Admin' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
});

test.beforeEach(async () => {
  // Ensure we are on the create category page before each test
  await page.goto('http://localhost:3000/dashboard/admin/create-category');
});

test('should display category creation form', async () => {
  // Verify that the category creation form is displayed and is initially empty
  await expect(page.getByRole('textbox', { name: 'Enter new category' })).toBeEmpty();
  await expect(page.getByRole('textbox', { name: 'Enter new category' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
});

test('should show categories previously added', async () => {
  // Verify that existing categories are displayed in the categories table
  await expect(page.getByRole('cell', { name: 'Electronics' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Book' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Clothing' })).toBeVisible();
});

test('should be able to create category as admin', async () => {
  // Create a new category and verify its creation
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category');
  await expect(page.getByRole('textbox', { name: 'Enter new category' })).toHaveValue('test category');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('test category is created')).toBeVisible();
  await page.locator('div').filter({ hasText: 'test category is created' }).nth(4).click();
  await expect(page.getByRole('cell', { name: 'test category' })).toBeVisible();
});

test('should edit category', async () => {
  // Edit the newly created category and verify the update
  await page.getByRole('button', { name: 'Edit' }).nth(3).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill('test category edited');
  await expect(page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' })).toHaveValue('test category edited');

  await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('div').filter({ hasText: 'test category edited is updated' }).nth(4)).toBeVisible();
  await expect(page.locator('tbody')).toContainText('test category edited');
});

test('should delete category', async () => {
  // Delete the newly edited category and verify its deletion
  await page.getByRole('button', { name: 'Delete' }).nth(3).click();
  await expect(page.locator('div').filter({ hasText: 'Category is deleted' }).nth(4)).toBeVisible();
  // Category should no longer be visible
  await expect(page.getByRole('cell', { name: 'test category' })).toBeHidden();
});

test('should handle duplicate category creation', async () => {
  // Attempt to create duplicate categories 
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 1');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('textbox', { name: 'Enter new category' })).toBeEmpty();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 1');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Verify that duplicate category creation is handled properly
  await expect(page.locator('div').filter({ hasText: 'Category already exists' }).nth(4)).toBeVisible();
});

test('should handle duplicate category editing', async () => {
  // Create a new category to test duplicate editing
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 2');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('div').filter({ hasText: 'test category 2 is created' }).nth(4)).toBeVisible();

  // Attempt to edit a category to a name that already exists
  await page.getByRole('button', { name: 'Edit' }).nth(4).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill('test category 1');
  await expect(page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' })).toHaveValue('test category 1');
  await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();

  // Verify that duplicate category editing is handled properly
  await expect(page.locator('div').filter({ hasText: 'Category already exists' }).nth(4)).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('cell', { name: 'test category 2' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'test category 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).nth(4).click();
  await page.getByRole('button', { name: 'Delete' }).nth(3).click();
});

test('should handle empty category name creation', async () => {
  // Attempt to create a category with an empty name
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Verify that empty category name creation is handled properly
  await expect(page.locator('div').filter({ hasText: 'Name is required' }).nth(4)).toBeVisible();
});

test('should not delete categories containing products', async () => {
  // Attempt to delete a category that contains products
  await page.getByRole('button', { name: 'Delete' }).first().click();
  // Verify that deletion is prevented and appropriate message is shown
  await expect(page.locator('div').filter({ hasText: /^Cannot delete category with existing products$/ }).nth(2)).toBeVisible();
});

import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('test123');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await page.getByRole('button', { name: 'Test Admin' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
});

test.afterAll(async () => {
  await page.getByRole('button', { name: 'Delete' }).nth(3).click();
});

test.beforeEach(async () => {
  await page.goto('http://localhost:3000/dashboard/admin/create-category');
});

test('should display category creation form', async () => {

  await expect(page.getByRole('textbox', { name: 'Enter new category' })).toBeEmpty();
  await expect(page.getByRole('textbox', { name: 'Enter new category' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
});

test('should show categories previously added', async () => {
  await expect(page.getByRole('cell', { name: 'Electronics' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Book' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Clothing' })).toBeVisible();
});

test('should create category', async () => {
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category');
  await expect(page.getByRole('textbox', { name: 'Enter new category' })).toHaveValue('test category');
  
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('test category is created')).toBeVisible();
  await page.locator('div').filter({ hasText: 'test category is created' }).nth(4).click();
  await expect(page.getByRole('cell', { name: 'test category' })).toBeVisible();
});

test('should edit category', async () => {
  await page.getByRole('button', { name: 'Edit' }).nth(3).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill('test category edited');
  await expect(page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' })).toHaveValue('test category edited');

  await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('div').filter({ hasText: 'test category edited is updated' }).nth(4)).toBeVisible();
  await expect(page.locator('tbody')).toContainText('test category edited');
});

test('should delete category', async () => {
  await page.getByRole('button', { name: 'Delete' }).nth(3).click();
  await expect(page.locator('div').filter({ hasText: 'Category is deleted' }).nth(4)).toBeVisible();
  // category no longer visible
  await expect(page.getByRole('cell', { name: 'test category' })).toBeHidden();
});

test('should handle duplicate category creation', async () => {
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 1');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('textbox', { name: 'Enter new category' })).toBeEmpty();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 1');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.locator('div').filter({ hasText: 'Category already exists' }).nth(4)).toBeVisible();
});

test('should handle duplicate category editing', async () => {
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category 2');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('div').filter({ hasText: 'test category 2 is created' }).nth(4)).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).nth(4).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill('test category 1');
  await expect(page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' })).toHaveValue('test category 1');
  await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();

  await expect(page.locator('div').filter({ hasText: 'Category already exists' }).nth(4)).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('cell', { name: 'test category 2' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'test category 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).nth(4).click();
  await page.getByRole('button', { name: 'Delete' }).nth(3).click();
});

test('should handle empty category name creation', async () => {
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.locator('div').filter({ hasText: 'Name is required' }).nth(4)).toBeVisible();
});

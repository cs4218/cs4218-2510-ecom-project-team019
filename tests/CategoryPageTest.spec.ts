import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('jy@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('jy');
  await page.getByRole('button', { name: 'LOGIN' }).click();
});

test('should have a category page', async () => {
  await page.getByRole('link', { name: 'Categories' }).click();
  await page.getByRole('link', { name: 'All Categories' }).click();
  await expect(page.getByRole('link', { name: 'Electronics' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Clothing' })).toBeVisible();
});

test('should see newly created categories in all categories page and dropdown', async () => {
  await page.getByRole('button', { name: 'jy' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill('test category');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('link', { name: 'Categories' }).click();
  await expect(page.locator('#navbarTogglerDemo01').getByRole('link', { name: 'test category' })).toBeVisible();
  await page.getByRole('link', { name: 'All Categories' }).click();

  await expect(page.getByRole('link', { name: 'test category' })).toBeVisible();
  await page.getByRole('link', { name: 'test category' }).click();
  await expect(page.getByRole('heading', { name: 'Category - test category' })).toBeVisible();
});

test('should delete the newly created category from all categories page and dropdown', async () => {
  await page.getByRole('button', { name: 'jy' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Create Category' }).click();
  await page.getByRole('button', { name: 'Delete' }).nth(3).click();
  await expect(page.locator('div').filter({ hasText: 'Category is deleted' }).nth(4)).toBeVisible();
  await page.getByRole('link', { name: 'Categories' }).click();
  await expect(page.locator('#navbarTogglerDemo01').getByRole('link', { name: 'test category' })).toBeHidden();
  await page.getByRole('link', { name: 'All Categories' }).click();
  await expect(page.getByRole('link', { name: 'test category' })).toBeHidden();
});

test('should navigate to category page when a category is clicked', async () => {
  await page.getByRole('link', { name: 'Electronics' }).click();
  await expect(page.getByRole('heading', { name: 'Category - Electronics' })).toBeVisible();
  await page.goto('http://localhost:3000/categories');
  await page.getByRole('link', { name: 'Book' }).click();
  await expect(page.getByRole('heading', { name: 'Category - Book' })).toBeVisible();
  await page.goto('http://localhost:3000/categories');
});

import { test, expect } from '@playwright/test';

// Use the stored authentication state
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Authenticated tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/');

        // Confirm navigation success
        await expect(page).toHaveURL('http://localhost:3000/');
    });

    test('able to visit a protected resource after authentication', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/user');
        await expect(page).toHaveURL('http://localhost:3000/dashboard/user');
    });

    test('navigation bar items are visible', async ({ page }) => {
        // Assert navigation bar items are visible
        await expect(page.getByRole('link', { name: '🛒 Virtual Vault' })).toBeVisible();
        await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Categories' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Test User' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Cart' })).toBeVisible();
        await expect(page.getByText('0', { exact: true })).toBeVisible();
        await expect(page.getByRole('img', { name: 'bannerimage' })).toBeVisible();
    });

    test('products are visible', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

        // Assert 6 images and 6 product titles are visible
        const strings = [
            'Novel',
            'The Law of Contract in',
            'NUS T-shirt',
            'Smartphone',
            'Laptop',
            'Textbook',
        ];
        for (const str of strings) {
            await expect(page.getByRole('img', { name: str })).toBeVisible();
            await expect(page.getByRole('heading', { name: str })).toBeVisible();
        }
    });

    test('filters are visible', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Filter By Category' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'RESET FILTERS' })).toBeVisible();

        // Assert categories filter
        const categories = ['Electronics', 'Book', 'Clothing'];
        for (const cat of categories) {
            await expect(page.getByRole('checkbox', { name: cat })).toBeVisible();
            await expect(page.getByRole('main')).toContainText(cat);
        }

        // Assert price filter
        const priceRanges = ['$0 to', '$20 to', '$40 to', '$60 to', '$80 to', '$100 or more'];
        for (const priceRange of priceRanges) {
            await expect(page.getByRole('checkbox', { name: priceRange })).toBeVisible();
        }

        const priceLabels = [
            '$0 to 19',
            '$20 to 39',
            '$40 to 59',
            '$60 to 79',
            '$80 to 99 ',
            '$100 or more',
        ];
        for (const priceLabel of priceLabels) {
            await expect(page.getByRole('main')).toContainText(priceLabel);
        }
    });

    test('Category filter works as intended', async ({ page }) => {
        // Check the 'Electronics' box
        await page.getByRole('checkbox', { name: 'Electronics' }).check();

        const allProducts = [
            'Novel',
            'The Law of Contract in',
            'NUS T-shirt',
            'Smartphone',
            'Laptop',
            'Textbook',
        ];

        const visibleProducts = ['Smartphone', 'Laptop'];

        const filteredProducts = ['Novel', 'The Law of Contract in', 'NUS T-shirt', 'Textbook'];

        for (const product of visibleProducts) {
            await expect(page.getByRole('img', { name: product })).toBeVisible();
            await expect(page.getByRole('heading', { name: product })).toBeVisible();
        }

        for (const product of filteredProducts) {
            await expect(page.getByRole('img', { name: product })).not.toBeVisible();
            await expect(page.getByRole('heading', { name: product })).not.toBeVisible();
        }

        // Uncheck the 'Electronics' box
        await page.getByRole('checkbox', { name: 'Electronics' }).uncheck();

        for (const product of allProducts) {
            await expect(page.getByRole('img', { name: product })).toBeVisible();
            await expect(page.getByRole('heading', { name: product })).toBeVisible();
        }
    });

    test('Price filter works as intended', async ({ page }) => {
        // Check the 2 boxes
        await page.getByRole('checkbox', { name: '$40 to' }).check();
        await page.getByRole('checkbox', { name: '$60 to' }).check();

        const allProducts = [
            'Novel',
            'The Law of Contract in',
            'NUS T-shirt',
            'Smartphone',
            'Laptop',
            'Textbook',
        ];

        const visibleProducts = ['Textbook', 'The Law of Contract in'];

        const filteredProducts = ['Novel', 'NUS T-shirt', 'Smartphone', 'Laptop'];

        for (const product of visibleProducts) {
            await expect(page.getByRole('img', { name: product })).toBeVisible();
            await expect(page.getByRole('heading', { name: product })).toBeVisible();
        }

        for (const product of filteredProducts) {
            await expect(page.getByRole('img', { name: product })).not.toBeVisible();
            await expect(page.getByRole('heading', { name: product })).not.toBeVisible();
        }

        // Uncheck both boxes
        await page.getByRole('checkbox', { name: '$40 to' }).uncheck();
        await page.getByRole('checkbox', { name: '$60 to' }).uncheck();

        for (const product of allProducts) {
            await expect(page.getByRole('img', { name: product })).toBeVisible();
            await expect(page.getByRole('heading', { name: product })).toBeVisible();
        }
    });

    test('Combination of category and filter works as intended', async ({ page }) => {
        // Check the 2 boxes
        await page.getByRole('checkbox', { name: 'Book' }).check();
        await page.getByRole('checkbox', { name: '$40 to' }).check();

        const allProducts = [
            'Novel',
            'The Law of Contract in',
            'NUS T-shirt',
            'Smartphone',
            'Laptop',
            'Textbook',
        ];

        const visibleProducts = ['The Law of Contract in'];

        const filteredProducts = ['Novel', 'NUS T-shirt', 'Smartphone', 'Laptop', 'Textbook'];

        for (const product of visibleProducts) {
            await expect(page.getByRole('img', { name: product })).toBeVisible();
            await expect(page.getByRole('heading', { name: product })).toBeVisible();
        }

        for (const product of filteredProducts) {
            await expect(page.getByRole('img', { name: product })).not.toBeVisible();
            await expect(page.getByRole('heading', { name: product })).not.toBeVisible();
        }

        // Uncheck both boxes
        await page.getByRole('checkbox', { name: 'Book' }).uncheck();
        await page.getByRole('checkbox', { name: '$40 to' }).uncheck();

        for (const product of allProducts) {
            await expect(page.getByRole('img', { name: product })).toBeVisible();
            await expect(page.getByRole('heading', { name: product })).toBeVisible();
        }
    });
});

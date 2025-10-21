import { test, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

// Purpose of this file: save auth in storageState, so that this state can be reused for all e2e tests that requires auth

/* Benefits of this approach:
    1. Log in only once for all your tests
    2. Each test gets its own page object (no sharing, which might result in unintended behaviour)
*/

test('authenticate user and save login state', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Use placeholder-based locators instead of role names
    await page.getByPlaceholder('Enter Your Email').fill('test@test.com');
    await page.getByPlaceholder('Enter Your Password').fill('test123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Wait for redirect and verify successful login
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 15000 });
    await expect(page.getByRole('list')).toContainText('Test User');

    // Save authenticated state for reuse
    await page.context().storageState({ path: authFile });
});

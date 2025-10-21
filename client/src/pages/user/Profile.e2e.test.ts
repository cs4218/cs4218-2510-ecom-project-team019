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

        // Navigate to Dashboard -> Profile
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Profile' }).click();

        // Wait for the profile page to fully load
        await expect(page).toHaveURL(/dashboard\/user\/profile/);
        await expect(page.getByRole('main')).toContainText('USER PROFILE');
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

    test('profile page and all relevant fields are visible', async ({ page }) => {
        // Assert update profile page is visible
        await expect(page.getByRole('main')).toContainText('USER PROFILEUPDATE');
        await expect(page.getByRole('main')).toContainText('USER PROFILE');

        // Assert update profile input fields are visible
        await expect(page.getByRole('textbox', { name: 'Enter Your Name' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Enter Your Email' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Enter Your Password' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Enter Your Phone' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Enter Your Address' })).toBeVisible();

        // Assert 'UPDATE' button is visible
        await expect(page.getByTestId('update-profile-btn')).toBeVisible();
    });

    test('update user name, and change is reflected on the UI', async ({ page }) => {
        // Update user name
        await page.getByRole('textbox', { name: 'Enter Your Name' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('Updated Name');
        await page.getByTestId('update-profile-btn').click();
        await expect(page.getByText('Profile Updated Successfully')).toBeVisible();

        // Verify user name is updated on the UI
        await expect(page.getByRole('list')).toContainText('Updated Name');
        await expect(page.getByRole('textbox', { name: 'Enter Your Name' })).toHaveValue(
            'Updated Name'
        );

        // Reset user name
        await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('Test User');
        await page.getByTestId('update-profile-btn').click();

        // Confirm that it has been reset to 'Test User'
        await expect(page.getByText('Profile Updated Successfully')).toBeVisible();
        await expect(page.getByRole('list')).toContainText('Test User');
    });

    test('update user name to an empty string. User name does not change', async ({ page }) => {
        // Since Playwright runs tests concurrently, ensure that user name is set to 'Test User', before the start of this test
        await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('Test User');
        await page.getByTestId('update-profile-btn').click();
        await expect(page.getByText('Profile Updated Successfully')).toBeVisible();

        // Update user name
        await page.getByRole('textbox', { name: 'Enter Your Name' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('');
        await page.getByTestId('update-profile-btn').click();

        // Verify user name remains the same
        await expect(page.getByText('Profile Updated Successfully')).toBeVisible();
        await expect(page.getByRole('list')).toContainText('Test User');
    });

    test('update password. Verify that old password cannot be used anymore', async ({ page }) => {
        // Update password
        await page.getByPlaceholder('Enter Your Password').click();
        await page.getByPlaceholder('Enter Your Password').fill('new password');
        await page.getByTestId('update-profile-btn').click();

        // Verify success toast is shown
        await expect(page.getByText('Profile Updated Successfully')).toBeVisible();

        // Log out, and verify that the old password does not work
        await page.getByRole('button', { name: 'Test User' }).click();
        await page.getByRole('link', { name: 'Logout' }).click();

        await page.getByPlaceholder('Enter Your Email').click();
        await page.getByPlaceholder('Enter Your Email').fill('test@test.com');
        await page.getByPlaceholder('Enter Your Password').click();
        await page.getByPlaceholder('Enter Your Password').fill('test123'); // old password
        await page.getByRole('button', { name: 'LOGIN' }).click();

        await expect(page.getByText('Something went wrong')).toBeVisible();
        await expect(page).toHaveURL('http://localhost:3000/login');

        // Verify that new password works
        await page.getByPlaceholder('Enter Your Password').fill('new password');
        await page.getByRole('button', { name: 'LOGIN' }).click();

        await expect(page.getByText('Login successfully')).toBeVisible();
        await expect(page).toHaveURL('http://localhost:3000/');

        // Navigate to /dashboard/user/profile
        await page.getByRole('button', { name: 'Test User' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Profile' }).click();

        // Reset to original password
        await page.getByPlaceholder('Enter Your Password').click();
        await page.getByPlaceholder('Enter Your Password').fill('test123');
        await page.getByTestId('update-profile-btn').click();
        await expect(page.getByText('Profile Updated Successfully')).toBeVisible();
    });

    test('update password with invalid password. An error toast is shown on screen', async ({
        page,
    }) => {
        // Update password
        await page.getByPlaceholder('Enter Your Password').click();
        await page.getByPlaceholder('Enter Your Password').fill('short');
        await page.getByTestId('update-profile-btn').click();

        // Verify error toast is shown
        await expect(page.getByText('Something went wrong')).toBeVisible();
    });
});

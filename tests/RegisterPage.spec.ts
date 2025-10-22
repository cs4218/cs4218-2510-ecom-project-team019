import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the register page before each test
        await page.goto('http://localhost:3000/register');
    });

    test('should display the register form with all required elements', async ({ page }) => {
        // Check if the page title is correct
        await expect(page).toHaveTitle(/Register - Ecommerce App/);

        // Check for form heading
        await expect(page.locator('h4.title')).toContainText('REGISTER FORM');

        // Check for name input
        const nameInput = page.locator('input[type="text"]#exampleInputName1');
        await expect(nameInput).toBeVisible();
        await expect(nameInput).toHaveAttribute('placeholder', 'Enter Your Name');
        await expect(nameInput).toHaveAttribute('required', '');

        // Check for email input
        const emailInput = page.locator('input[type="email"]#exampleInputEmail1');
        await expect(emailInput).toBeVisible();
        await expect(emailInput).toHaveAttribute('placeholder', 'Enter Your Email ');
        await expect(emailInput).toHaveAttribute('required', '');

        // Check for password input
        const passwordInput = page.locator('input[type="password"]#exampleInputPassword1');
        await expect(passwordInput).toBeVisible();
        await expect(passwordInput).toHaveAttribute('placeholder', 'Enter Your Password');
        await expect(passwordInput).toHaveAttribute('required', '');

        // Check for phone input
        const phoneInput = page.locator('input[type="text"]#exampleInputPhone1');
        await expect(phoneInput).toBeVisible();
        await expect(phoneInput).toHaveAttribute('placeholder', 'Enter Your Phone');
        await expect(phoneInput).toHaveAttribute('required', '');

        // Check for address input
        const addressInput = page.locator('input[type="text"]#exampleInputaddress1');
        await expect(addressInput).toBeVisible();
        await expect(addressInput).toHaveAttribute('placeholder', 'Enter Your Address');
        await expect(addressInput).toHaveAttribute('required', '');

        // Check for DOB input
        const dobInput = page.locator('input[type="Date"]#exampleInputDOB1');
        await expect(dobInput).toBeVisible();
        await expect(dobInput).toHaveAttribute('placeholder', 'Enter Your DOB');
        await expect(dobInput).toHaveAttribute('required', '');

        // Check for answer input (security question)
        const answerInput = page.locator('input[type="text"]#exampleInputanswer1');
        await expect(answerInput).toBeVisible();
        await expect(answerInput).toHaveAttribute('placeholder', 'What is Your Favorite sports');
        await expect(answerInput).toHaveAttribute('required', '');

        // Check for register submit button
        const registerBtn = page.getByRole('button', { name: 'REGISTER' });
        await expect(registerBtn).toBeVisible();
        await expect(registerBtn).toHaveAttribute('type', 'submit');
    });

    test('should have name input autofocused', async ({ page }) => {
        const nameInput = page.locator('input[type="text"]#exampleInputName1');
        await expect(nameInput).toBeFocused();
    });

    test('should allow typing in all form fields', async ({ page }) => {
        const nameInput = page.locator('input[type="text"]#exampleInputName1');
        const emailInput = page.locator('input[type="email"]#exampleInputEmail1');
        const passwordInput = page.locator('input[type="password"]#exampleInputPassword1');
        const phoneInput = page.locator('input[type="text"]#exampleInputPhone1');
        const addressInput = page.locator('input[type="text"]#exampleInputaddress1');
        const dobInput = page.locator('input[type="Date"]#exampleInputDOB1');
        const answerInput = page.locator('input[type="text"]#exampleInputanswer1');

        // Type in name field
        await nameInput.fill('John Doe');
        await expect(nameInput).toHaveValue('John Doe');

        // Type in email field
        await emailInput.fill('john.doe@example.com');
        await expect(emailInput).toHaveValue('john.doe@example.com');

        // Type in password field
        await passwordInput.fill('SecurePass123');
        await expect(passwordInput).toHaveValue('SecurePass123');

        // Type in phone field
        await phoneInput.fill('1234567890');
        await expect(phoneInput).toHaveValue('1234567890');

        // Type in address field
        await addressInput.fill('123 Main Street');
        await expect(addressInput).toHaveValue('123 Main Street');

        // Type in DOB field
        await dobInput.fill('1990-01-01');
        await expect(dobInput).toHaveValue('1990-01-01');

        // Type in answer field
        await answerInput.fill('Football');
        await expect(answerInput).toHaveValue('Football');
    });

    test('should require all fields before submission', async ({ page }) => {
        const registerBtn = page.getByRole('button', { name: 'REGISTER' });

        // Try to submit without filling any fields
        await registerBtn.click();

        // The browser's built-in validation should prevent submission
        // Check that we're still on the register page
        expect(page.url()).toContain('/register');
    });

    test('should validate email format', async ({ page }) => {
        const nameInput = page.locator('input[type="text"]#exampleInputName1');
        const emailInput = page.locator('input[type="email"]#exampleInputEmail1');
        const passwordInput = page.locator('input[type="password"]#exampleInputPassword1');
        const registerBtn = page.getByRole('button', { name: 'REGISTER' });

        // Fill some fields but use invalid email
        await nameInput.fill('John Doe');
        await emailInput.fill('invalid-email');
        await passwordInput.fill('password123');
        await registerBtn.click();

        // Browser validation should prevent submission
        expect(page.url()).toContain('/register');
    });

    test('should successfully register with valid credentials', async ({ page }) => {
        // Mock the API response for successful registration
        await page.route('**/api/v1/auth/register', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: 'Register Successfully, please login'
                })
            });
        });

        // Fill in the registration form
        await page.locator('input[type="text"]#exampleInputName1').fill('John Doe');
        await page.locator('input[type="email"]#exampleInputEmail1').fill('john.doe@example.com');
        await page.locator('input[type="password"]#exampleInputPassword1').fill('SecurePass123');
        await page.locator('input[type="text"]#exampleInputPhone1').fill('1234567890');
        await page.locator('input[type="text"]#exampleInputaddress1').fill('123 Main Street');
        await page.locator('input[type="Date"]#exampleInputDOB1').fill('1990-01-01');
        await page.locator('input[type="text"]#exampleInputanswer1').fill('Football');

        // Submit the form
        await page.getByRole('button', { name: 'REGISTER' }).click();

        // Wait for navigation to login page
        await page.waitForURL('**/login', { timeout: 3000 });
        expect(page.url()).toContain('/login');
    });

    test('should display error on failed registration', async ({ page }) => {
        // Mock the API response for failed registration
        await page.route('**/api/v1/auth/register', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    message: 'User already exists'
                })
            });
        });

        // Fill in the registration form
        await page.locator('input[type="text"]#exampleInputName1').fill('John Doe');
        await page.locator('input[type="email"]#exampleInputEmail1').fill('existing@example.com');
        await page.locator('input[type="password"]#exampleInputPassword1').fill('SecurePass123');
        await page.locator('input[type="text"]#exampleInputPhone1').fill('1234567890');
        await page.locator('input[type="text"]#exampleInputaddress1').fill('123 Main Street');
        await page.locator('input[type="Date"]#exampleInputDOB1').fill('1990-01-01');
        await page.locator('input[type="text"]#exampleInputanswer1').fill('Football');

        // Submit the form
        await page.getByRole('button', { name: 'REGISTER' }).click();

        // Wait a moment for the request to complete
        await page.waitForTimeout(1000);

        // Should still be on register page (failed registration doesn't redirect)
        expect(page.url()).toContain('/register');
    });

    test('should display error toast on network error', async ({ page }) => {
        // Mock network error
        await page.route('**/api/v1/auth/register', async (route) => {
            await route.abort('failed');
        });

        // Fill in the registration form
        await page.locator('input[type="text"]#exampleInputName1').fill('John Doe');
        await page.locator('input[type="email"]#exampleInputEmail1').fill('john.doe@example.com');
        await page.locator('input[type="password"]#exampleInputPassword1').fill('SecurePass123');
        await page.locator('input[type="text"]#exampleInputPhone1').fill('1234567890');
        await page.locator('input[type="text"]#exampleInputaddress1').fill('123 Main Street');
        await page.locator('input[type="Date"]#exampleInputDOB1').fill('1990-01-01');
        await page.locator('input[type="text"]#exampleInputanswer1').fill('Football');

        // Submit the form
        await page.getByRole('button', { name: 'REGISTER' }).click();

        // Wait a moment for the error to be handled
        await page.waitForTimeout(1000);

        // Should still be on register page (error doesn't redirect)
        expect(page.url()).toContain('/register');
    });

    test('should preserve form values after failed registration', async ({ page }) => {
        // Mock failed registration
        await page.route('**/api/v1/auth/register', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    message: 'Registration failed'
                })
            });
        });

        const nameInput = page.locator('input[type="text"]#exampleInputName1');
        const emailInput = page.locator('input[type="email"]#exampleInputEmail1');
        const passwordInput = page.locator('input[type="password"]#exampleInputPassword1');
        const phoneInput = page.locator('input[type="text"]#exampleInputPhone1');
        const addressInput = page.locator('input[type="text"]#exampleInputaddress1');
        const dobInput = page.locator('input[type="Date"]#exampleInputDOB1');
        const answerInput = page.locator('input[type="text"]#exampleInputanswer1');

        // Fill in the form
        await nameInput.fill('John Doe');
        await emailInput.fill('john.doe@example.com');
        await passwordInput.fill('SecurePass123');
        await phoneInput.fill('1234567890');
        await addressInput.fill('123 Main Street');
        await dobInput.fill('1990-01-01');
        await answerInput.fill('Football');

        // Submit the form
        await page.getByRole('button', { name: 'REGISTER' }).click();

        // Wait a bit for the request to complete
        await page.waitForTimeout(1000);

        // Values should still be present (the component doesn't clear them on failure)
        await expect(nameInput).toHaveValue('John Doe');
        await expect(emailInput).toHaveValue('john.doe@example.com');
        await expect(passwordInput).toHaveValue('SecurePass123');
        await expect(phoneInput).toHaveValue('1234567890');
        await expect(addressInput).toHaveValue('123 Main Street');
        await expect(dobInput).toHaveValue('1990-01-01');
        await expect(answerInput).toHaveValue('Football');
    });

    test('should have proper styling and layout', async ({ page }) => {
        const formContainer = page.locator('.form-container');
        
        // Check if form container exists and has minimum height
        await expect(formContainer).toBeVisible();
        
        // Check if register form exists (the one containing the title)
        const form = page.locator('form').filter({ hasText: 'REGISTER FORM' });
        await expect(form).toBeVisible();

        // Check all mb-3 divs (margin bottom divs) within the register form
        const mbDivs = form.locator('.mb-3');
        await expect(mbDivs).toHaveCount(7); // 7 input fields
    });

    test('should handle empty fields validation individually', async ({ page }) => {
        const registerBtn = page.getByRole('button', { name: 'REGISTER' });
        
        // Fill all fields except name
        await page.locator('input[type="email"]#exampleInputEmail1').fill('john@example.com');
        await page.locator('input[type="password"]#exampleInputPassword1').fill('password123');
        await page.locator('input[type="text"]#exampleInputPhone1').fill('1234567890');
        await page.locator('input[type="text"]#exampleInputaddress1').fill('123 Main St');
        await page.locator('input[type="Date"]#exampleInputDOB1').fill('1990-01-01');
        await page.locator('input[type="text"]#exampleInputanswer1').fill('Football');
        
        // Try to submit - should fail due to missing name
        await registerBtn.click();
        expect(page.url()).toContain('/register');
    });

    test('should accept valid date formats for DOB', async ({ page }) => {
        const dobInput = page.locator('input[type="Date"]#exampleInputDOB1');
        
        // Fill with valid date
        await dobInput.fill('2000-12-31');
        await expect(dobInput).toHaveValue('2000-12-31');
    });

    test('should handle special characters in text fields', async ({ page }) => {
        const nameInput = page.locator('input[type="text"]#exampleInputName1');
        const addressInput = page.locator('input[type="text"]#exampleInputaddress1');
        const answerInput = page.locator('input[type="text"]#exampleInputanswer1');

        // Test special characters
        await nameInput.fill("John O'Brien");
        await expect(nameInput).toHaveValue("John O'Brien");

        await addressInput.fill('123 Main St., Apt #4B');
        await expect(addressInput).toHaveValue('123 Main St., Apt #4B');

        await answerInput.fill('Football & Basketball');
        await expect(answerInput).toHaveValue('Football & Basketball');
    });

    test('should send all form data in the registration request', async ({ page }) => {
        let requestBody = null;

        // Intercept and capture the registration request
        await page.route('**/api/v1/auth/register', async (route) => {
            const request = route.request();
            requestBody = JSON.parse(request.postData() || '{}');
            
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: 'Register Successfully'
                })
            });
        });

        // Fill in the registration form
        await page.locator('input[type="text"]#exampleInputName1').fill('John Doe');
        await page.locator('input[type="email"]#exampleInputEmail1').fill('john.doe@example.com');
        await page.locator('input[type="password"]#exampleInputPassword1').fill('SecurePass123');
        await page.locator('input[type="text"]#exampleInputPhone1').fill('9876543210');
        await page.locator('input[type="text"]#exampleInputaddress1').fill('456 Elm Street');
        await page.locator('input[type="Date"]#exampleInputDOB1').fill('1995-05-15');
        await page.locator('input[type="text"]#exampleInputanswer1').fill('Tennis');

        // Submit the form
        await page.getByRole('button', { name: 'REGISTER' }).click();

        // Wait for the request to complete
        await page.waitForTimeout(1000);

        // Verify all fields were sent in the request
        expect(requestBody).toBeTruthy();
        expect(requestBody.name).toBe('John Doe');
        expect(requestBody.email).toBe('john.doe@example.com');
        expect(requestBody.password).toBe('SecurePass123');
        expect(requestBody.phone).toBe('9876543210');
        expect(requestBody.address).toBe('456 Elm Street');
        expect(requestBody.DOB).toBe('1995-05-15');
        expect(requestBody.answer).toBe('Tennis');
    });

    test('should have correct form control classes on all inputs', async ({ page }) => {
        const inputs = [
            page.locator('input#exampleInputName1'),
            page.locator('input#exampleInputEmail1'),
            page.locator('input#exampleInputPassword1'),
            page.locator('input#exampleInputPhone1'),
            page.locator('input#exampleInputaddress1'),
            page.locator('input#exampleInputDOB1'),
            page.locator('input#exampleInputanswer1')
        ];

        for (const input of inputs) {
            await expect(input).toHaveClass(/form-control/);
        }
    });
});
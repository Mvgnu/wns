import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow user to sign up and sign in', async ({ page }) => {
    // Go to signup page
    await page.goto('/auth/signup');

    // Fill out signup form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to feed after successful signup
    await expect(page).toHaveURL(/.*\/feed/);

    // Verify user is logged in
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('should allow user to sign in with existing account', async ({ page }) => {
    // Create a test user first (this would normally be done via API)
    await page.goto('/auth/signin');

    // Fill out signin form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to feed
    await expect(page).toHaveURL(/.*\/feed/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill out signin form with wrong credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    // Try to access feed without being logged in
    await page.goto('/feed');

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Groups', () => {
  test('should display groups list', async ({ page }) => {
    await page.goto('/groups');

    // Should show groups page
    await expect(page.locator('h1')).toContainText('Gruppen');
    await expect(page.locator('[data-testid="groups-list"]')).toBeVisible();
  });

  test('should allow creating a new group when logged in', async ({ page }) => {
    // First login
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to create group
    await page.goto('/groups/create');

    // Fill out group form
    await page.fill('input[name="name"]', 'Test Running Group');
    await page.fill('input[name="description"]', 'A group for running enthusiasts');
    await page.selectOption('select[name="sport"]', 'running');
    await page.fill('input[name="locationName"]', 'Berlin, Germany');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to the new group page
    await expect(page).toHaveURL(/.*\/groups\/.+/);
    await expect(page.locator('h1')).toContainText('Test Running Group');
  });

  test('should redirect to login when creating group without auth', async ({ page }) => {
    await page.goto('/groups/create');

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('should show group details when clicking on a group', async ({ page }) => {
    await page.goto('/groups');

    // Click on first group (assuming there are groups)
    const firstGroup = page.locator('[data-testid="group-card"]').first();
    if (await firstGroup.isVisible()) {
      await firstGroup.click();

      // Should navigate to group detail page
      await expect(page).toHaveURL(/.*\/groups\/.+/);
      await expect(page.locator('[data-testid="group-detail"]')).toBeVisible();
    }
  });

  test('should allow joining and leaving groups', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Go to groups page
    await page.goto('/groups');

    // Find and click join button on a public group
    const joinButton = page.locator('[data-testid="join-group-btn"]').first();
    if (await joinButton.isVisible()) {
      await joinButton.click();

      // Should show success message or membership status
      await expect(page.locator('text=Mitglied')).toBeVisible();

      // Find and click leave button
      const leaveButton = page.locator('[data-testid="leave-group-btn"]').first();
      await leaveButton.click();

      // Should show leave confirmation or success
      await expect(page.locator('text=Gruppe verlassen')).toBeVisible();
    }
  });
});


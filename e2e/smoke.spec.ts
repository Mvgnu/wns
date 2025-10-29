// meta: module=e2e.smoke purpose="Fast validation of mission-critical user flows"
import { test, expect } from '@playwright/test';

test.describe('Smoke suite', () => {
  test('homepage renders key sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('heading', { name: /popular sports/i })).toBeVisible();
  });

  test('group discovery is accessible', async ({ page }) => {
    await page.goto('/groups');
    await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible();
    await expect(page.getByRole('searchbox')).toBeVisible();
  });

  test('locations map loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/locations');
    await expect(page.getByRole('heading', { name: /map/i })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Stable Selectors Test', () => {
  test('Verify stable selectors are present', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if we're on the login page (should have add-staff button)
    const addStaffButton = page.locator('[data-testid="add-staff"]');
    const isVisible = await addStaffButton.isVisible().catch(() => false);

    if (isVisible) {
      // We're on login page, check login selectors
      await expect(page.locator('[data-testid="add-staff"]')).toBeVisible();
      await expect(page.locator('[data-testid="pin-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="pin-0"]')).toBeVisible();
      await expect(page.locator('[data-testid="pin-backspace"]')).toBeVisible();
    } else {
      // We might be logged in, check main app selectors
      // These might not be visible immediately, so we just check they exist in DOM
      const sendToKitchen = page.locator('[data-testid="send-to-kitchen"]');
      const addToCart = page.locator('[data-testid="add-to-cart"]');

      // At least one of these should exist if we're in the main app
      const hasAppSelectors = (await sendToKitchen.count() > 0) || (await addToCart.count() > 0);
      expect(hasAppSelectors).toBe(true);
    }
  });
});
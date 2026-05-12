import { test, expect } from '@playwright/test';

test.describe('主页测试', () => {
  test('页面标题正确', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Habi.cafe.hogo | Premium POS System');
  });

  test('页面加载完成', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });
});

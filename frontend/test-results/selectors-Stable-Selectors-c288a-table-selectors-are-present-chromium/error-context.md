# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: selectors.spec.ts >> Stable Selectors Test >> Verify stable selectors are present
- Location: tests\e2e\selectors.spec.ts:4:3

# Error details

```
Error: page.goto: net::ERR_HTTP_RESPONSE_CODE_FAILURE at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This localhost page can’t be found" [level=1] [ref=e7]:
      - generic [ref=e8]: This localhost page can’t be found
    - paragraph [ref=e9]:
      - text: "No webpage was found for the web address:"
      - strong [ref=e10]: http://localhost:5173/
    - generic [ref=e11]: HTTP ERROR 404
  - button "Reload" [ref=e14] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Stable Selectors Test', () => {
  4  |   test('Verify stable selectors are present', async ({ page }) => {
> 5  |     await page.goto('http://localhost:5173');
     |                ^ Error: page.goto: net::ERR_HTTP_RESPONSE_CODE_FAILURE at http://localhost:5173/
  6  | 
  7  |     // Wait for the page to load
  8  |     await page.waitForLoadState('networkidle');
  9  | 
  10 |     // Check if we're on the login page (should have add-staff button)
  11 |     const addStaffButton = page.locator('[data-testid="add-staff"]');
  12 |     const isVisible = await addStaffButton.isVisible().catch(() => false);
  13 | 
  14 |     if (isVisible) {
  15 |       // We're on login page, check login selectors
  16 |       await expect(page.locator('[data-testid="add-staff"]')).toBeVisible();
  17 |       await expect(page.locator('[data-testid="pin-1"]')).toBeVisible();
  18 |       await expect(page.locator('[data-testid="pin-0"]')).toBeVisible();
  19 |       await expect(page.locator('[data-testid="pin-backspace"]')).toBeVisible();
  20 |     } else {
  21 |       // We might be logged in, check main app selectors
  22 |       // These might not be visible immediately, so we just check they exist in DOM
  23 |       const sendToKitchen = page.locator('[data-testid="send-to-kitchen"]');
  24 |       const addToCart = page.locator('[data-testid="add-to-cart"]');
  25 | 
  26 |       // At least one of these should exist if we're in the main app
  27 |       const hasAppSelectors = (await sendToKitchen.count() > 0) || (await addToCart.count() > 0);
  28 |       expect(hasAppSelectors).toBe(true);
  29 |     }
  30 |   });
  31 | });
```
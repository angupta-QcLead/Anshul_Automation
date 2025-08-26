const { test, expect } = require('@playwright/test');

test('basic test - open Playwright site', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

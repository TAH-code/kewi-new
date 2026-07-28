import { test, expect } from './utils/fixtures.js';

test('playwright can launch a browser and load a page', async ({ page }) => {
  await page.setContent('<h1>Hello Playwright</h1>');
  await expect(page.locator('h1')).toHaveText('Hello Playwright');
});

import { test, expect } from './utils/fixtures.js';
import { mockApi } from './utils/mockApi.js';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

// Pages sharing the Navbar (which links to /products); Login/SignUp use a
// standalone layout with no Navbar, so they're verified separately below.
const pagesWithNavbar = [
  '/',
  '/products',
  '/about',
  '/contact',
  '/cart',
  '/favorites',
  '/privacy-policy',
  '/return-policy',
  '/delivery-terms',
];

for (const path of pagesWithNavbar) {
  test(`loads ${path} without crashing`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();

    await expect(page.locator('nav a[href="/products"]')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
}

for (const path of ['/login', '/signup']) {
  test(`loads ${path} without crashing`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();

    await expect(page.locator('input[type="password"]')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
}

test('unknown route renders the 404 page', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');
  await expect(page.getByText('404')).toBeVisible();
});

test('navbar links move between top-level pages', async ({ page }) => {
  await page.goto('/');

  await page.locator('nav a[href="/products"]').first().click();
  await expect(page).toHaveURL(/\/products$/);

  await page.locator('nav a[href="/about"]').first().click();
  await expect(page).toHaveURL(/\/about$/);

  await page.locator('nav a[href="/"]').first().click();
  await expect(page).toHaveURL(/\/$/);
});

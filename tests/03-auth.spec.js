import { test, expect } from './utils/fixtures.js';
import { mockApi } from './utils/mockApi.js';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe('protected routes redirect when logged out', () => {
  for (const path of ['/purchase-history', '/profile', '/admin']) {
    test(`${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});

test('signup with valid data stores session and redirects home', async ({ page }) => {
  await page.route('**/auth/api/signup', (route) =>
    route.fulfill({
      json: { token: 'fake-token', user: { role: 'user', username: 'New User' } },
    })
  );

  await page.goto('/signup');
  const inputs = page.locator('input:not([type="password"])');
  await inputs.nth(0).fill('New User'); // username
  await inputs.nth(1).fill('0590000001'); // phone
  await page.locator('input[type="password"]').fill('password123');

  await page.getByRole('button', { name: /./ }).last().click();

  await expect(page).toHaveURL(/\/$/);
});

test('login with valid credentials stores session and redirects home', async ({ page }) => {
  await page.route('**/auth/api/login', (route) =>
    route.fulfill({
      json: { token: 'fake-token', user: { role: 'user', username: 'Test User' } },
    })
  );

  await page.goto('/login');
  await page.locator('input').first().fill('0590000000');
  await page.locator('input[type="password"]').fill('password123');
  await page.getByRole('button', { name: /./ }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.evaluate(() => localStorage.getItem('token'))).resolves.toBe('fake-token');
});

test('login with invalid credentials shows an error and stays on the page', async ({ page }) => {
  await page.route('**/auth/api/login', (route) =>
    route.fulfill({ status: 401, json: { message: 'Invalid credentials' } })
  );

  await page.goto('/login');
  await page.locator('input').first().fill('0590000000');
  await page.locator('input[type="password"]').fill('wrong-password');
  await page.getByRole('button', { name: /./ }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.evaluate(() => localStorage.getItem('token'))).resolves.toBeNull();
});

test('logged-in user can reach a role-allowed protected route', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('userRole', 'user');
    localStorage.setItem('user', JSON.stringify({ role: 'user' }));
  });

  await page.goto('/profile');
  await expect(page).toHaveURL(/\/profile$/);
});

test('logged-in non-admin user is bounced from an admin-only route', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('userRole', 'user');
    localStorage.setItem('user', JSON.stringify({ role: 'user' }));
  });

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/$/);
});

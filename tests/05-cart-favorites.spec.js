import { test, expect } from './utils/fixtures.js';
import { mockApi, sampleProduct } from './utils/mockApi.js';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('cart is empty by default', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.locator('.product-card-hover')).toHaveCount(0);
});

test('adding a product from the listing page updates the cart', async ({ page }) => {
  await page.goto('/products');

  // Each product card exposes two icon buttons: [favorite, add-to-cart].
  await page.locator('.product-card-hover').locator('button').last().click();

  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  expect(cart).toHaveLength(1);
  expect(cart[0]._id).toBe(sampleProduct._id);
  expect(cart[0].quantity).toBe(1);
});

test('cart page renders a seeded item with quantity controls', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((product) => {
    localStorage.setItem(
      'cart',
      JSON.stringify([{ ...product, id: product._id, quantity: 1 }])
    );
  }, sampleProduct);

  await page.goto('/cart');
  await expect(page.getByText(sampleProduct.name.en, { exact: true })).toBeVisible();
  await expect(page.locator('span.w-12')).toHaveText('1');
});

test('increasing quantity in the cart persists to localStorage', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((product) => {
    localStorage.setItem(
      'cart',
      JSON.stringify([{ ...product, id: product._id, quantity: 1 }])
    );
  }, sampleProduct);

  await page.goto('/cart');
  // Quantity controls are the Minus/Plus icon buttons flanking the count span.
  await page.locator('span.w-12').locator('xpath=following-sibling::button[1]').click();

  await expect(page.locator('span.w-12')).toHaveText('2');
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  expect(cart[0].quantity).toBe(2);
});

test('removing an item empties the cart', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((product) => {
    localStorage.setItem(
      'cart',
      JSON.stringify([{ ...product, id: product._id, quantity: 1 }])
    );
  }, sampleProduct);

  await page.goto('/cart');
  await expect(page.getByText(sampleProduct.name.en, { exact: true })).toBeVisible();

  // Trash/remove button is the last button in the cart item row.
  await page.locator('span.w-12').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]').getByRole('button').last().click();

  await expect(page.getByText(sampleProduct.name.en, { exact: true })).not.toBeVisible();
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  expect(cart).toHaveLength(0);
});

test('favoriting a product from the listing page persists and shows on the Favorites page', async ({ page }) => {
  await page.goto('/products');

  // The heart/favorite toggle is the first button rendered on the card.
  await page.locator('.product-card-hover').locator('button').first().click();

  const favorites = await page.evaluate(() => JSON.parse(localStorage.getItem('favorites') || '[]'));
  expect(favorites).toHaveLength(1);
  expect(favorites[0]._id).toBe(sampleProduct._id);

  await page.goto('/favorites');
  await expect(page.getByText(sampleProduct.name.en, { exact: true })).toBeVisible();
});

test('unfavoriting removes the product from the Favorites page', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((product) => {
    localStorage.setItem('favorites', JSON.stringify([product]));
  }, sampleProduct);

  await page.goto('/favorites');
  await expect(page.getByText(sampleProduct.name.en, { exact: true })).toBeVisible();

  await page.locator('.product-card-hover').locator('button').first().click();

  await expect(page.getByText(sampleProduct.name.en, { exact: true })).not.toBeVisible();
  const favorites = await page.evaluate(() => JSON.parse(localStorage.getItem('favorites') || '[]'));
  expect(favorites).toHaveLength(0);
});

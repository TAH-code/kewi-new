import { test, expect } from './utils/fixtures.js';
import { mockApi, sampleProduct } from './utils/mockApi.js';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('products page lists the mocked product', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByText(sampleProduct.name.en, { exact: true })).toBeVisible();
});

test('clicking a product navigates to its detail page', async ({ page }) => {
  await page.goto('/products');
  await page.getByText(sampleProduct.name.en, { exact: true }).first().click();
  await expect(page).toHaveURL(new RegExp(`/product/${sampleProduct._id}`));
});

test('product detail page loads directly by id', async ({ page }) => {
  await page.goto(`/product/${sampleProduct._id}`);
  await expect(page.getByText(sampleProduct.name.en, { exact: true })).toBeVisible();
});

test('category page loads via a category link', async ({ page }) => {
  await page.goto('/category/cat1');
  await expect(page.getByText(sampleProduct.name.en, { exact: true })).toBeVisible();
});

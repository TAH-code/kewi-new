import { test, expect } from './utils/fixtures.js';
import { mockApi, sampleProduct } from './utils/mockApi.js';

// Exercises the checkout dialog's fields and validation without ever
// clicking "Place Order" — no purchase/payment request is made. The shared
// mockApi() safety net also 501s any unmocked purchase/payment call, so an
// accidental submit would fail the test loudly instead of silently passing.

async function seedCartAndOpenCheckout(page) {
  await page.goto('/');
  await page.evaluate((product) => {
    localStorage.setItem(
      'cart',
      JSON.stringify([{ ...product, id: product._id, quantity: 1 }])
    );
  }, sampleProduct);

  await page.goto('/cart');
  await page.getByRole('button', { name: 'Checkout', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('checkout dialog opens with the expected fields', async ({ page }) => {
  await seedCartAndOpenCheckout(page);

  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('#name')).toBeVisible();
  await expect(dialog.locator('#phone')).toBeVisible();
  await expect(dialog.locator('#city')).toBeVisible();
  await expect(dialog.locator('#region')).toBeVisible();
  await expect(dialog.locator('#deliveryType')).toBeVisible();
  await expect(dialog.locator('#notes')).toBeVisible();
  await expect(dialog.locator('input[name="paymentMethod"][value="cash"]')).toBeChecked();
  await expect(dialog.locator('input[name="paymentMethod"][value="visa"]')).not.toBeChecked();
  await expect(dialog.getByRole('button', { name: 'Place Order' })).toBeVisible();
});

test('filling the delivery details updates the order summary', async ({ page }) => {
  await seedCartAndOpenCheckout(page);
  const dialog = page.getByRole('dialog');

  await dialog.locator('#name').fill('Test Buyer');
  await dialog.locator('#phone').fill('0590000000');
  await dialog.locator('#city').fill('Ramallah');
  await dialog.locator('#region').selectOption('w'); // West Bank
  await dialog.locator('#deliveryType').selectOption('Express');
  await dialog.locator('#notes').fill('Leave at the door');

  await expect(dialog.locator('#name')).toHaveValue('Test Buyer');
  await expect(dialog.locator('#phone')).toHaveValue('0590000000');
  await expect(dialog.locator('#city')).toHaveValue('Ramallah');

  // West Bank + Express delivery = 20 ILS per the pricing rules in Cart.tsx.
  await expect(dialog.getByText('Delivery: 20.00 ₪')).toBeVisible();
  await expect(dialog.getByText('Total: 120.00 ₪')).toBeVisible();
});

test('switching payment method to visa reveals the captcha and gateway notice', async ({ page }) => {
  await seedCartAndOpenCheckout(page);
  const dialog = page.getByRole('dialog');

  await dialog.locator('input[name="paymentMethod"][value="visa"]').check();

  await expect(dialog.locator('input[name="paymentMethod"][value="visa"]')).toBeChecked();
  await expect(dialog.getByText(/redirected.*Bank of Palestine/i)).toBeVisible();
  await expect(dialog.locator('.g-recaptcha, iframe[src*="recaptcha"]').first()).toBeVisible();
});

test('policy agreement checkbox links to the return and privacy policies', async ({ page }) => {
  await seedCartAndOpenCheckout(page);
  const dialog = page.getByRole('dialog');
  const agreementCheckbox = dialog.locator('input[type="checkbox"]');

  await expect(agreementCheckbox).not.toBeChecked();
  await agreementCheckbox.check();
  await expect(agreementCheckbox).toBeChecked();

  await expect(dialog.getByRole('link', { name: /return policy/i })).toHaveAttribute(
    'href',
    '/return-policy'
  );
  await expect(dialog.getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
    'href',
    '/privacy-policy'
  );
});

test('cancel closes the checkout dialog without submitting anything', async ({ page }) => {
  await seedCartAndOpenCheckout(page);
  const dialog = page.getByRole('dialog');

  await dialog.locator('#name').fill('Test Buyer');
  await dialog.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByRole('dialog')).not.toBeVisible();
  // Cart survives the cancelled checkout.
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  expect(cart).toHaveLength(1);
});

test('required fields block submission until filled', async ({ page }) => {
  await seedCartAndOpenCheckout(page);
  const dialog = page.getByRole('dialog');

  await expect(dialog.locator('#name')).toHaveAttribute('required', '');
  await expect(dialog.locator('#phone')).toHaveAttribute('required', '');
  await expect(dialog.locator('#city')).toHaveAttribute('required', '');
  await expect(dialog.locator('#region')).toHaveAttribute('required', '');
  await expect(dialog.locator('#deliveryType')).toHaveAttribute('required', '');
});

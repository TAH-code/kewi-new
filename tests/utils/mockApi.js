// Shared fixtures + network mocking so tests never hit the real production
// API at https://kewi.ps (the frontend's default API base when VITE_ENV is unset).

export const sampleCategory = { _id: 'cat1', name: 'Electronics', image: '' };

export const sampleProduct = {
  _id: 'prod1',
  id: '9999',
  name: { en: 'Test Product', ar: 'منتج تجريبي' },
  description: { en: 'A test product', ar: 'وصف تجريبي' },
  image: [],
  images: [],
  stockNumber: 10,
  customerPrice: 100,
  wholesalerPrice: 80,
  isMultiColor: false,
  salePrice: 0,
  isOnSale: false,
  isSoldOut: false,
  category: sampleCategory,
};

/**
 * Installs route handlers for every known backend endpoint the frontend
 * calls, so pages render deterministically without a live backend.
 */
export async function mockApi(page) {
  // Registered first so more specific routes added below take priority
  // (Playwright resolves the most-recently-added matching route first).
  await page.route(/kewi\.ps\/(auth|admin|user)\/api\//, (route) =>
    route.fulfill({ status: 501, json: { message: 'Unmocked API call in test' } })
  );

  await page.route('**/admin/api/categories', (route) =>
    route.fulfill({ json: [sampleCategory] })
  );

  await page.route('**/user/api/products', (route) =>
    route.fulfill({ json: [sampleProduct] })
  );

  await page.route('**/admin/api/products/discount', (route) =>
    route.fulfill({ json: [] })
  );

  await page.route(/\/admin\/api\/products\/category\/.+/, (route) =>
    route.fulfill({ json: [sampleProduct] })
  );

  await page.route(/\/admin\/api\/products\/[^/]+$/, (route) =>
    route.fulfill({ json: sampleProduct })
  );

  await page.route('**/admin/api/products', (route) =>
    route.fulfill({ json: [sampleProduct] })
  );

  await page.route('**/admin/api/me', (route) =>
    route.fulfill({
      json: { _id: 'user1', username: 'Test User', phone: '0590000000', role: 'user' },
    })
  );

  await page.route('**/admin/api/purchase/my', (route) => route.fulfill({ json: [] }));
}

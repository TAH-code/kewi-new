// Shared `test`/`expect` that keep a single browser context+tab alive for
// the whole worker, so all specs run one after another in the same tab
// instead of Playwright's default of a fresh tab per test.
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  // Our custom context bypasses Playwright's normal per-test video wiring,
  // so `video: 'on'` in the config has no effect here — record explicitly
  // into a fixed folder instead, producing one continuous recording of the
  // whole run (the context never closes until the worker tears down).
  sharedContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        recordVideo: { dir: 'test-results/full-run-video', size: { width: 1280, height: 720 } },
      });
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  sharedPage: [
    async ({ sharedContext }, use) => {
      const page = await sharedContext.newPage();
      await use(page);
    },
    { scope: 'worker' },
  ],

  // Override the built-in per-test `context`/`page` fixtures so every test
  // in the worker resolves to the same worker-scoped tab instead of getting
  // a fresh one. Reset storage/cookies here (not via test.beforeEach, which
  // only binds to whichever spec file imports this module first, since ESM
  // only runs a module's top-level code once) so every test starts clean
  // without the tab ever closing.
  context: async ({ sharedContext }, use) => {
    await sharedContext.clearCookies();
    await use(sharedContext);
  },

  page: async ({ sharedPage }, use) => {
    await sharedPage
      .evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      })
      .catch(() => {});
    await use(sharedPage);
  },
});

export { expect };

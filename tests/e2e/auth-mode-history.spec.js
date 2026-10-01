const { test, expect } = require('@playwright/test');
async function stubExternalAuthScripts(page) {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.supabase = { createClient: () => ({ auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    } }) };`
  }));
}

for (const width of [1365, 390, 320]) {
  test(`auth modes follow keyboard navigation and browser history at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await stubExternalAuthScripts(page);
    const next = '/pro/apps/payroll/?view=runs';
    await page.goto('/auth/?mode=login&next=' + encodeURIComponent(next));

    async function expectMode(mode) {
      await expect(page.locator(`[data-mode-link="${mode}"]`)).toHaveAttribute('aria-current', 'page');
      await expect(page.locator('[data-mode-link][aria-current="page"]')).toHaveCount(1);
      await expect(page.locator(`[data-mode-panel="${mode}"]`)).toBeVisible();
      for (const other of ['login', 'signup', 'reset'].filter(value => value !== mode)) {
        await expect(page.locator(`[data-mode-panel="${other}"]`)).toBeHidden();
      }
      expect(new URL(page.url()).searchParams.get('next')).toBe(next);
    }

    await expectMode('login');
    for (const mode of ['signup', 'reset']) {
      await page.locator(`[data-mode-link="${mode}"]`).focus();
      await page.keyboard.press('Enter');
      await expectMode(mode);
    }
    await page.goBack();
    await expectMode('signup');
    await page.goBack();
    await expectMode('login');
    await page.goForward();
    await expectMode('signup');
    await page.goForward();
    await expectMode('reset');
  });
}

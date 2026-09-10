const { test, expect } = require('@playwright/test');

for (const [slug, result, expected] of [
  ['amount-words-gh', '#wordsResult', 'GHANA CEDIS FIVE HUNDRED THOUSAND ONLY'],
  ['naira-to-words', '#result', 'NGN Amount in WordsFive Hundred Thousand Naira Only']
]) {
  test(`${slug}: controls wait for a delayed calculation script`, async ({ page, context }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.addInitScript(() => {
      if (window.top === window) localStorage.setItem('afrotools_cookie_consent', 'declined');
    });
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/assets/js/engines/amount-words-input.js*', async route => {
      await gate;
      await route.continue();
    });
    try {
      await page.goto(`/tools/${slug}/`, { waitUntil: 'commit' });
      await expect(page.locator('#amount')).toBeVisible();
      await expect(page.locator('#amount')).toBeDisabled();
      await expect(page.locator('#caseMode')).toBeDisabled();
      await expect(page.locator('#amountError')).toContainText('Loading converter');
    } finally { release(); }
    await expect(page.locator('#amount')).toBeEnabled();
    await page.locator('#amount').fill('500000');
    await expect(page.locator(result)).toHaveText(expected);
    expect(errors).toEqual([]);
  });

  test(`${slug}: failed calculation script leaves an explicit retry message`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/assets/js/engines/amount-words-input.js*', route => route.abort('failed'));
    await page.goto(`/tools/${slug}/`);
    await expect(page.locator('#amount')).toBeDisabled();
    await expect(page.locator('#amountError')).toContainText('Reload to try again');
    await expect(page.locator('#resultCard')).toBeHidden();
    expect(errors).toEqual([]);
  });
}

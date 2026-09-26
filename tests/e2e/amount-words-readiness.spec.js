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

for (const [slug, preview] of [
  ['amount-words-gh', 'VAT invoice amount'],
  ['naira-to-words', 'Invoice amount:']
]) {
  test(`${slug}: mobile result precedes optional document settings`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(`/tools/${slug}/`);
    await expect(page.locator('#amount')).toBeEnabled();
    await page.locator('#amount').fill('12500.75');
    await expect(page.locator('#resultCard')).toBeVisible();
    const layout = await page.evaluate(() => ({
      inputBottom: document.querySelector('#amount').getBoundingClientRect().bottom,
      resultTop: document.querySelector('#resultCard').getBoundingClientRect().top,
      resultBottom: document.querySelector('#resultCard').getBoundingClientRect().bottom,
      optionsTop: document.querySelector('.amount-words-options').getBoundingClientRect().top,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));
    expect(layout.resultTop - layout.inputBottom).toBeLessThan(280);
    expect(layout.optionsTop).toBeGreaterThanOrEqual(layout.resultBottom);
    expect(layout.overflow).toBeLessThanOrEqual(1);
    await page.locator('.document-options summary').click();
    await page.locator('#docMode').selectOption('invoice');
    await expect(page.locator('#docPreview')).toContainText(preview);
  });
}

test('Ghana common-amount shortcuts remain available in their disclosure', async ({ page }) => {
  await page.goto('/tools/amount-words-gh/');
  await page.locator('.quick-amounts summary').click();
  await page.locator('.quick-amount-list').getByRole('button', { name: '100', exact: true }).click();
  await expect(page.locator('#wordsResult')).toHaveText('GHANA CEDIS ONE HUNDRED ONLY');
});

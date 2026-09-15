const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

for (const width of [320, 390]) {
  test(`RDC offer comparison requires its USD rate and exports explicit assumptions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(() => {
      window.copiedReports = [];
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => window.copiedReports.push(text) } });
      window.print = () => { window.printCalls = (window.printCalls || 0) + 1; };
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/fr/blog/salaire-moyen-rdc-2026/');
    await expect(page.locator('.rdc-hero-actions a').first()).toBeInViewport();
    await expect(page.locator('.rdc-hero-actions a').last()).toBeInViewport();
    await expect(page.locator('#rate')).toBeDisabled();
    await expect(page.locator('#range-output')).toContainText(/559.?000/);
    await page.locator('.rdc-hero-actions a').first().focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#outil$/);
    await page.selectOption('#currency', 'USD');
    await expect(page.locator('#rate')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#salary-output')).toHaveText('—');
    for (const id of ['copy-summary', 'download-summary', 'print-page']) await expect(page.locator(`#${id}`)).toBeDisabled();
    await page.fill('#salary', '1000');
    await page.fill('#rate', '2500.5');
    await expect(page.locator('#salary-output')).toContainText(/2.?500.?500/);
    await page.click('#copy-summary');
    expect(await page.evaluate(() => window.copiedReports[0])).toContain('Taux saisi: 1 USD = 2500.5 CDF');
    const downloadPromise = page.waitForEvent('download');
    await page.click('#download-summary');
    const download = await downloadPromise;
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).toContain('Devise saisie: USD');
    expect(text).toContain('Taux saisi: 1 USD = 2500.5 CDF');
    expect(text).toMatch(/559.?000/);
    await page.click('#print-page');
    expect(await page.evaluate(() => window.printCalls)).toBe(1);
    for (const invalid of ['', '0', '-1']) {
      await page.fill('#rate', invalid);
      await expect(page.locator('#position-output')).toHaveText('—');
      await expect(page.locator('#download-summary')).toBeDisabled();
      // Exercise the handlers too: disabled controls must not mask stale export state.
      await page.evaluate(() => ['copy-summary', 'download-summary', 'print-page'].forEach(id => document.getElementById(id).dispatchEvent(new MouseEvent('click'))));
      expect(await page.evaluate(() => window.copiedReports.length)).toBe(1);
      expect(await page.evaluate(() => window.printCalls)).toBe(1);
    }
    await page.selectOption('#currency', 'CDF');
    await expect(page.locator('#download-summary')).toBeEnabled();
    await expect(page.locator('#rate')).toBeDisabled();
    await expect(page.locator('#salary-output')).toContainText(/1.?000/);
    await page.fill('#salary', '1000000');
    await page.fill('#coefficient', '200');
    await expect(page.locator('#range-output')).toContainText(/1.?118.?000/);
    await expect(page.locator('#position-output')).toContainText(/-118.?000/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('RDC offers a TXT fallback when clipboard access is unavailable or rejected', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
  await page.goto('/fr/blog/salaire-moyen-rdc-2026/');
  await page.click('#copy-summary');
  await expect(page.locator('#decision-output')).toHaveText('Copie indisponible. Téléchargez le résumé.');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Denied')) } }));
  await page.click('#copy-summary');
  await expect(page.locator('#decision-output')).toHaveText('Copie indisponible. Téléchargez le résumé.');
  const pending = page.waitForEvent('download');
  await page.click('#download-summary');
  const download = await pending;
  expect(fs.readFileSync(await download.path(), 'utf8')).toContain('Conversion: aucune (salaire saisi en CDF)');
});

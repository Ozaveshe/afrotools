const { test, expect } = require('@playwright/test');

test.describe('Hausa Naira words parity', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  });

  test('renders Hausa wording and reopens local JSON', async ({ page }) => {
    const requests = [];
    page.on('request', request => {
      if (!['document', 'script', 'stylesheet', 'image', 'font'].includes(request.resourceType())) requests.push(request.url());
    });
    await page.goto('/ha/kayan-aiki/naira-zuwa-kalmomi/');
    await page.locator('#amount').fill('125430.75');
    await expect(page.locator('#result')).toContainText("Naira dubu ɗari da ashirin da biyar da ɗari huɗu da talatin da Kobo saba'in da biyar kacal");

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Sauke JSON' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('adadi-cikin-kalmomin-hausa.json');
    const payload = JSON.parse(await require('fs').promises.readFile(await download.path(), 'utf8'));
    expect(payload).toMatchObject({ tool: 'naira-to-words', language: 'ha', currency: 'NGN', amount: 125430.75, localOnly: true });
    expect(payload.words).toContain('Kobo');
    expect(requests).toEqual([]);
  });

  test('fails closed and keeps the mobile header usable', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/ha/kayan-aiki/naira-zuwa-kalmomi/');
    await page.locator('#amount').fill('9999999999999999');
    await expect(page.locator('#result')).toContainText('Adadin ya yi yawa');
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.setViewportSize({ width: 750, height: 720 });
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await expect(page.locator('afro-navbar')).toBeVisible();
  });
});

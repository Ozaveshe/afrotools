const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });

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

  test('invalid or cleared amounts cannot copy or export the previous result', async ({ page }) => {
    await page.goto('/ha/kayan-aiki/naira-zuwa-kalmomi/');
    await page.evaluate(() => {
      window.exportAttempts = [];
      URL.createObjectURL = () => { window.exportAttempts.push('blob'); return 'blob:synthetic'; };
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: async () => { window.exportAttempts.push('clipboard'); }
      } });
    });
    for (const invalid of ['', '.', '9999999999999999']) {
      await page.getByLabel('Adadin kudi', { exact: true }).fill('125430.75');
      await expect(page.locator('#docPreview')).toContainText('125,430.75');
      await page.getByLabel('Adadin kudi', { exact: true }).fill(invalid);
      await page.evaluate(() => {
        copyResult(); copyDocumentLine(); downloadDocumentLine(); downloadJsonResult();
      });
      await expect(page.locator('#toast')).toHaveText('Saka adadi mai inganci tukuna.');
      expect(await page.evaluate(() => [lastWords, lastDocumentLine])).toEqual(['', '']);
      await expect(page.locator('#docPreview')).toBeEmpty();
      await expect(page.locator('#formatted')).toBeEmpty();
    }
    await page.locator('#amount').fill('125430.75');
    await page.getByRole('button', { name: 'Goge', exact: true }).click();
    await page.evaluate(() => { copyResult(); downloadJsonResult(); });
    expect(await page.evaluate(() => window.exportAttempts)).toEqual([]);
  });

  test('current zero-value exports retain Unicode and clipboard failures are announced', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/ha/kayan-aiki/naira-zuwa-kalmomi/');
    await page.locator('#amount').fill('125430.75');
    await page.locator('#payeeName').fill('Ɗan gwaji');
    await page.locator('#amount').fill('0');
    const expectedLine = await page.locator('#docPreview').textContent();
    const jsonPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Sauke JSON' }).click();
    const jsonDownload = await jsonPromise;
    const payload = JSON.parse(await require('fs').promises.readFile(await jsonDownload.path(), 'utf8'));
    expect(payload).toMatchObject({ amount: 0, words: 'Naira sifili kacal', documentLine: expectedLine, localOnly: true });
    const txtPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Sauke TXT' }).click();
    const txtDownload = await txtPromise;
    expect(await require('fs').promises.readFile(await txtDownload.path(), 'utf8')).toBe(expectedLine + '\n');
    expect(expectedLine).toContain('Ɗan gwaji');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async text => { window.copiedLine = text; }
    } }));
    await page.getByRole('button', { name: 'Kwafi layin takarda', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#toast')).toHaveText('An kwafi layin takarda!');
    expect(await page.evaluate(() => window.copiedLine)).toBe(expectedLine);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async () => { throw new DOMException('Synthetic denial', 'NotAllowedError'); }
    } }));
    await page.getByRole('button', { name: 'Kwafi', exact: true }).click();
    await expect(page.locator('#toast')).toContainText('Ba a iya kwafi ba.');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
    await page.getByRole('button', { name: 'Kwafi layin takarda', exact: true }).click();
    await expect(page.locator('#toast')).toContainText('Ba a iya kwafi ba.');
    await expect(page.locator('#toast')).toHaveAttribute('role', 'status');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (process.env.AFROTOOLS_ROTATION_SCREENSHOT) {
      await page.screenshot({ path: process.env.AFROTOOLS_ROTATION_SCREENSHOT, fullPage: true });
    }
    expect(errors).toEqual([]);
  });
});

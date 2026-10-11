const fs = require('node:fs/promises');
const { test, expect } = require('@playwright/test');

for (const width of [320, 1280]) {
  test.describe(`French Base64 ${width}px`, () => {
    let errors;
    test.beforeEach(async ({ page }) => {
      errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => {
        window.__base64Copied = [];
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: async text => { window.__base64Copied.push(text); } }
        });
      });
      await page.goto('/fr/tools/encodeur-base64/');
    });
    test.afterEach(async ({ page }) => {
      expect(errors).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });

    test('Unicode and whitespace round-trip exactly through copy and downloaded TXT', async ({ page }) => {
      const samples = ['  Ẹ káàárọ̀ / Sannu / مرحبا / 🌍\n\t', ' ', '\n\t  '];
      for (const original of samples) {
        await page.locator('#base64Mode').selectOption('encode');
        await page.locator('#base64Input').fill(original);
        await page.locator('#convertBase64Btn').click();
        const encoded = Buffer.from(original, 'utf8').toString('base64');
        await expect(page.locator('#base64Output')).toHaveValue(encoded);
        await page.locator('#base64Mode').selectOption('decode');
        await page.locator('#base64Input').fill(encoded);
        await page.locator('#convertBase64Btn').click();
        await expect(page.locator('#base64Output')).toHaveValue(original);
        await page.locator('#copyBase64Btn').click();
        expect(await page.evaluate(() => window.__base64Copied.at(-1))).toBe(original);
        const downloadPromise = page.waitForEvent('download');
        await page.locator('#downloadBase64Btn').click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('resultat-base64.txt');
        expect(await fs.readFile(await download.path(), 'utf8')).toBe(original);
        await page.locator('#swapBase64Btn').click();
        await expect(page.locator('#base64Input')).toHaveValue(original);
        await expect(page.locator('#base64Output')).toHaveValue('');
      }
    });

    test('invalid or empty conversion clears previous output before copy or download', async ({ page }) => {
      await page.locator('#base64Mode').selectOption('decode');
      await page.locator('#base64Input').fill('cHJldmlvdXM=');
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue('previous');
      await page.locator('#base64Input').fill('%%%invalid%%%');
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue('');
      await expect(page.locator('#base64Status')).toContainText('invalide');
      await page.locator('#copyBase64Btn').click();
      expect(await page.evaluate(() => window.__base64Copied)).toEqual([]);
      await expect(page.locator('#base64Status')).toContainText('Aucun résultat');
      await page.locator('#downloadBase64Btn').click();
      await expect(page.locator('#base64Status')).toContainText('Aucun résultat');
      await page.locator('#base64Mode').selectOption('encode');
      await page.locator('#base64Input').fill('current');
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).not.toHaveValue('');
      await page.locator('#base64Input').fill('');
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue('');
      await expect(page.locator('#base64Input')).toBeFocused();
    });

    test('URL-safe and file encoding preserve exact bytes and reject a missing file', async ({ page }) => {
      const text = '??🌍\n';
      await page.locator('#base64Input').fill(text);
      await page.locator('#urlSafe').check();
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue(Buffer.from(text).toString('base64url'));
      await page.locator('#urlSafe').uncheck();
      await page.locator('#base64Mode').selectOption('file');
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue('');
      const bytes = Buffer.from([0, 9, 10, 32, 127, 128, 255]);
      await page.locator('#base64File').setInputFiles({ name: 'synthetic.bin', mimeType: 'application/octet-stream', buffer: bytes });
      await page.locator('#dataPrefix').check();
      await page.locator('#convertBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue(`data:application/octet-stream;base64,${bytes.toString('base64')}`);
      await page.locator('#clearBase64Btn').click();
      await expect(page.locator('#base64Output')).toHaveValue('');
      await expect(page.locator('#base64Input')).toHaveValue('');
    });
  });
}

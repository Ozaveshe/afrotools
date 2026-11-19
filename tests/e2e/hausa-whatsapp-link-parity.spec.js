const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.describe('Hausa WhatsApp link parity', () => {
  test('builds a local link and reopens its QR PNG', async ({ page }) => {
    const writes = [];
    page.on('request', request => { if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url()); });
    await page.goto('/ha/kayan-aiki/whatsapp-link/');
    await page.locator('#countryCode').selectOption('234');
    await page.locator('#phoneNumber').fill('0801 234 5678');
    await page.locator('#message').fill('Sannu & na gode');
    await page.getByRole('button', { name: 'Gina link', exact: true }).click();
    const link = 'https://wa.me/2348012345678?text=Sannu%20%26%20na%20gode';
    await expect(page.locator('#linkDisplay a')).toHaveAttribute('href', link);
    await expect(page).toHaveURL(/\/ha\/kayan-aiki\/whatsapp-link\/$/);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Sauke QR' }).click();
    const download = await downloadPromise;
    const bytes = await fs.promises.readFile(await download.path());
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    expect(width).toBe(height);
    expect(width).toBeGreaterThanOrEqual(180);
    expect(writes).toEqual([]);
  });

  test('validates bulk links and remains usable on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/ha/kayan-aiki/whatsapp-link/');
    await page.locator('#phoneNumber').fill('12');
    await page.getByRole('button', { name: 'Gina link', exact: true }).click();
    await expect(page.locator('#resultArea')).not.toHaveClass(/show/);

    await page.getByRole('button', { name: 'Yanayin taro' }).click();
    await page.locator('#bulkNumbers').fill('08012345678\n08098765432');
    await page.getByRole('button', { name: 'Gina duka' }).click();
    await expect(page.locator('#bulkResults .bulk-item')).toHaveCount(2);
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.setViewportSize({ width: 750, height: 720 });
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
for (const [locale, route] of [
  ['yo', '/yo/awon-ise/whatsapp-link/'],
  ['ha', '/ha/kayan-aiki/whatsapp-link/']
]) {
  test(locale + ' downloaded WhatsApp QR preserves a four-module quiet zone', async ({ page }) => {
    await page.goto(route);
    const form = page.locator('[data-wa-form="single"]');
    await form.locator('[name="country"]').selectOption('234');
    await form.locator('[name="phone"]').fill('08012345678');
    await form.locator('[name="message"]').fill('AfroTools sample');
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('[data-wa-url]')).toHaveValue('https://wa.me/2348012345678?text=AfroTools%20sample');
    const pending = page.waitForEvent('download');
    await form.locator('[data-wa-download-qr]').click();
    const png = fs.readFileSync(await (await pending).path()).toString('base64');
    const geometry = await page.evaluate(async (encoded) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + encoded;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const dark = (x, y) => rgba[4 * (y * canvas.width + x)] < 128;
      let left = canvas.width, right = -1, top = canvas.height, bottom = -1;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (dark(x, y)) {
          left = Math.min(left, x); right = Math.max(right, x);
          top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
      }
      let end = left;
      while (end < canvas.width && dark(end, top)) end++;
      return { cell: (end - left) / 7, margin: Math.min(left, top, canvas.width - right - 1, canvas.height - bottom - 1) };
    }, png);
    expect(geometry.cell).toBeGreaterThan(0);
    expect(Number.isInteger(geometry.cell)).toBe(true);
    expect(geometry.margin).toBeGreaterThanOrEqual(4 * geometry.cell);
  });
}

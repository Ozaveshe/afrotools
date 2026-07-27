const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

const APP_IDS = [
  'creator-analytics', 'creator-bios', 'creator-brand', 'creator-calendar',
  'creator-canvas', 'creator-captions', 'creator-carousel', 'creator-clip',
  'creator-club', 'creator-course', 'creator-desk', 'creator-hashtags',
  'creator-hooks', 'creator-invoice', 'creator-kit', 'creator-mail',
  'creator-mind', 'creator-money', 'creator-page', 'creator-polish',
  'creator-pricing', 'creator-record', 'creator-repurpose', 'creator-research',
  'creator-resize', 'creator-schedule', 'creator-scripts', 'creator-split',
  'creator-stock', 'creator-team', 'creator-thumb', 'creator-titles',
  'creator-voice'
];
async function openLocal(page, id) {
  const writes = [];
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    return route.fulfill({ status: 204, body: '' });
  });
  page.on('request', (request) => {
    const url = request.url();
    if (
      request.method() !== 'GET' &&
      request.method() !== 'HEAD' &&
      (/\/(?:api|\.netlify\/functions)\//.test(url) || /supabase\.(?:co|in)/.test(url))
    ) writes.push(url);
  });
  await page.goto(`/tools/${id}/app`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#day9-creative-boundary')).toBeVisible();
  writes.length = 0;
  return writes;
}

for (const id of APP_IDS) {
  test(`${id}: local primary input path, reflow, and network boundary`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const writes = await openLocal(page, id);

    const editable = page.locator(
      'input:not([type="file"]):not([type="hidden"]):not([disabled]):visible, textarea:not([disabled]):visible'
    ).first();

    if (await editable.count()) {
      const type = await editable.getAttribute('type');
      const value = type === 'number' || type === 'range' ? '7' :
        type === 'date' ? '2026-08-19' :
        type === 'time' ? '10:30' :
        'Day 9 synthetic creative brief';
      await editable.fill(value);
      await expect(editable).toHaveValue(value);
      await editable.press('Tab');
    } else {
      const control = page.locator('button:not([disabled]):visible, a[href]:visible').first();
      await expect(control).toBeVisible();
      await control.focus();
      await expect(control).toBeFocused();
    }

    const mobileOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    expect(mobileOverflow).toBe(false);

    await page.setViewportSize({ width: 640, height: 800 });
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    const zoomOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    expect(zoomOverflow).toBe(false);
    expect(writes, 'typing/focusing a local primary control must not transmit content').toEqual([]);
  });
}

test('CreatorBrand exports parseable JSON with the edited brand name', async ({ page }) => {
  await openLocal(page, 'creator-brand');
  await page.locator('#brandName').fill('Day 9 Studio');
  await page.locator('#saveProfileBtn').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportJsonBtn').click();
  const download = await downloadPromise;
  const body = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  expect(body.profile.name).toBe('Day 9 Studio');
});

test('CreatorMail exports a reopenable HTML document', async ({ page }) => {
  await openLocal(page, 'creator-mail');
  await page.locator('.cml-template-card').first().click();
  await page.locator('#exportBtn').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportDownload').click();
  const download = await downloadPromise;
  const body = await fs.readFile(await download.path(), 'utf8');
  expect(body).toMatch(/<!doctype html>/i);
  expect(body).toMatch(/<body/i);
  expect(body).toMatch(/<\/html>/i);
});

test('Carousel PNG export reopens at 1080 by 1350', async ({ page }) => {
  await openLocal(page, 'creator-carousel');
  await page.locator('#btn-export').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-single').click();
  const download = await downloadPromise;
  const bytes = await fs.readFile(await download.path());
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(bytes.readUInt32BE(16)).toBe(1080);
  expect(bytes.readUInt32BE(20)).toBe(1350);
  expect(download.suggestedFilename()).toContain('1080x1350');
});

test('Thumbnail PNG export reopens at 1280 by 720', async ({ page }) => {
  await openLocal(page, 'creator-thumb');
  await page.locator('#btn-export').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-png').click();
  const download = await downloadPromise;
  const bytes = await fs.readFile(await download.path());
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(bytes.readUInt32BE(16)).toBe(1280);
  expect(bytes.readUInt32BE(20)).toBe(720);
  expect(download.suggestedFilename()).toContain('1280x720');
});

test('invalid media type is rejected before an editor handles it', async ({ page }) => {
  await openLocal(page, 'creator-resize');
  const input = page.locator('#crzFileInput');
  await input.setInputFiles({
    name: 'not-an-image.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('synthetic Day 9 file')
  });
  await expect(input).toHaveValue('');
  await expect(page.locator('#day9-creative-status')).toContainText('File rejected');
});

test('ResizeKit exports a reopened 1080 by 1080 PNG from a synthetic image', async ({ page }) => {
  await openLocal(page, 'creator-resize');
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZrS8AAAAASUVORK5CYII=',
    'base64'
  );
  await page.locator('#crzFileInput').setInputFiles({
    name: 'day9-source.png',
    mimeType: 'image/png',
    buffer: png
  });
  await expect(page.locator('.crz-size-card.active canvas').first()).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.crz-size-card.active .crz-size-dl').first().click();
  const download = await downloadPromise;
  const bytes = await fs.readFile(await download.path());
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(bytes.readUInt32BE(16)).toBe(1080);
  expect(bytes.readUInt32BE(20)).toBe(1080);
});

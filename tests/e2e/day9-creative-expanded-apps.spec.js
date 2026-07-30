const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const JSZip = require(path.join(process.cwd(), 'assets/vendor/jszip/jszip.min.js'));

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
  await expect(page.locator('body')).toBeVisible();
  writes.length = 0;
  return writes;
}

for (const id of APP_IDS) {
  test(`${id}: local primary input path, reflow, and network boundary`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const writes = await openLocal(page, id);
    const main = page.locator('main').first();
    const toolRoot = await main.count()
      ? main
      : page.locator('body');

    const editableCandidates = toolRoot.locator(
      'input:not([type="file"]):not([type="hidden"]):not([type="search"]):not([disabled]), textarea:not([disabled])'
    );
    let editable = null;
    for (let index = 0; index < await editableCandidates.count(); index += 1) {
      const candidate = editableCandidates.nth(index);
      if (await candidate.isVisible()) {
        editable = candidate;
        break;
      }
    }

    if (editable) {
      const type = await editable.getAttribute('type');
      const value = type === 'number' || type === 'range' ? '7' :
        type === 'date' ? '2026-08-19' :
        type === 'time' ? '10:30' :
        'Day 9 synthetic creative brief';
      await editable.fill(value);
      await expect(editable).toHaveValue(value);
      await editable.press('Tab');
    } else {
      const controlCandidates = toolRoot.locator(
        'input[type="file"], button:not([disabled]), select:not([disabled]), [tabindex="0"]'
      );
      let control = null;
      for (let index = 0; index < await controlCandidates.count(); index += 1) {
        const candidate = controlCandidates.nth(index);
        if (await candidate.isVisible()) {
          control = candidate;
          break;
        }
      }
      expect(control, `${id} needs a visible local control`).not.toBeNull();
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
  await page.locator('[name="name"]').fill('Day 9 Studio');
  await page.locator('form').first().getByRole('button', { name: 'Generate brand kit' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-json]').click();
  const download = await downloadPromise;
  const body = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  expect(body.profile.name).toBe('Day 9 Studio');
});

test('CreatorMail exports a reopenable HTML document', async ({ page }) => {
  await openLocal(page, 'creator-mail');
  await page.locator('form').first().getByRole('button', { name: 'Build preview' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-html]').click();
  const download = await downloadPromise;
  const body = await fs.readFile(await download.path(), 'utf8');
  expect(body).toMatch(/<!doctype html>/i);
  expect(body).toMatch(/<body/i);
  expect(body).toMatch(/<\/html>/i);
});

test('Carousel PNG export reopens at 1080 by 1350', async ({ page }) => {
  await openLocal(page, 'creator-carousel');
  await page.locator('#creatorFinalForm button[type="submit"]').click();
  await expect(page.locator('#creatorFinalOutput')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#creatorFinalExports button').nth(2).click();
  const download = await downloadPromise;
  const zip = await JSZip.loadAsync(await fs.readFile(await download.path()));
  const pngEntries = Object.values(zip.files)
    .filter((entry) => !entry.dir && entry.name.endsWith('.png'));
  expect(pngEntries).toHaveLength(5);
  const bytes = await pngEntries[0].async('nodebuffer');
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(bytes.readUInt32BE(16)).toBe(1080);
  expect(bytes.readUInt32BE(20)).toBe(1350);
});

test('Thumbnail PNG export reopens at 1280 by 720', async ({ page }) => {
  await openLocal(page, 'creator-thumb');
  await page.locator('#creatorFinalForm button[type="submit"]').click();
  await expect(page.locator('#creatorFinalOutput')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#creatorFinalExports button').nth(2).click();
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
  await expect(page.locator('#crzToast')).toContainText('Choose a PNG, JPEG, or WebP image.');
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

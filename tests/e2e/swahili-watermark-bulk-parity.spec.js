const { test, expect } = require('@playwright/test');

const routes = ['/tools/watermark-bulk/', '/sw/zana/watermark-nyingi/'];

function observe(page) {
  const proof = { errors: [], writes: [], data: [], badResources: [] };
  page.on('pageerror', error => proof.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') proof.errors.push(message.text()); });
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method())) proof.writes.push(`${request.method()} ${request.url()}`);
    if (['fetch', 'xhr', 'websocket'].includes(request.resourceType())) proof.data.push(request.url());
  });
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) {
      proof.badResources.push(`${response.status()} ${response.url()}`);
    }
  });
  return proof;
}

async function downloadBuffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function pngDimensions(buffer) {
  expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(buffer.subarray(12, 16).toString('ascii')).toBe('IHDR');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function syntheticSvg(name, width, height, color) {
  return {
    name,
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${color}"/><circle cx="${Math.floor(width / 2)}" cy="${Math.floor(height / 2)}" r="${Math.max(2, Math.floor(Math.min(width, height) / 5))}" fill="#ffffff"/></svg>`)
  };
}

async function assertHealthy(proof) {
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
}

test('watermark owner preserves full-resolution canvas exports and filename contracts across English and Swahili', async ({ page }) => {
  for (const route of routes) {
    const proof = observe(page);
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    await page.locator('#downloadCurrentBtn').click();
    await expect(page.locator('#statusText')).toContainText(route.startsWith('/sw/') ? 'picha moja' : 'one image');

    await page.locator('#fileInput').setInputFiles([
      syntheticSvg('sampuli-ya-mteja.svg', 64, 48, '#1d4ed8'),
      syntheticSvg('bidhaa-ya-duka.svg', 40, 30, '#b45309')
    ]);
    await expect(page.locator('.thumb')).toHaveCount(2);
    await expect(page.locator('#previewCanvas')).toHaveJSProperty('width', 64);
    await expect(page.locator('#previewCanvas')).toHaveJSProperty('height', 48);

    const marketplaceName = route.startsWith('/sw/') ? 'Tangazo la sokoni' : 'Marketplace listing';
    await page.getByRole('button', { name: new RegExp(marketplaceName) }).click();
    await page.locator('#fileSuffix').fill('duka-2026');
    await page.locator('#wmText').fill('Duka la Jaribio • @duka');
    await page.locator('#wmOpacity').fill('52');
    await page.locator('#wmPos').selectOption('bottom-right');

    const currentEvent = page.waitForEvent('download');
    await page.locator('#downloadCurrentBtn').click();
    const current = await currentEvent;
    expect(current.suggestedFilename()).toBe('sampuli-ya-mteja-duka-2026.png');
    expect(pngDimensions(await downloadBuffer(current))).toEqual({ width: 64, height: 48 });

    const batch = [];
    const listener = download => batch.push(download);
    page.on('download', listener);
    await page.locator('#downloadAllBtn').click();
    await expect.poll(() => batch.length).toBe(2);
    page.off('download', listener);
    const parsed = [];
    for (const download of batch) {
      parsed.push({ name: download.suggestedFilename(), dimensions: pngDimensions(await downloadBuffer(download)) });
    }
    expect(parsed).toEqual([
      { name: 'sampuli-ya-mteja-duka-2026.png', dimensions: { width: 64, height: 48 } },
      { name: 'bidhaa-ya-duka-duka-2026.png', dimensions: { width: 40, height: 30 } }
    ]);
    await expect(page.locator('#statusText')).toContainText(route.startsWith('/sw/') ? 'Upakuaji wa picha 2' : 'Started 2 downloads');
    await assertHealthy(proof);
  }
});

test('Swahili watermark workflow is native, keyboard reachable, responsive and search complete', async ({ page }) => {
  const route = '/sw/zana/watermark-nyingi/';
  const proof = observe(page);
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} overflow at ${width}px`).toBeLessThanOrEqual(1);
  }

  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/watermark-nyingi/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/watermark-bulk/');
  await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/watermark-nyingi/');
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.map(JSON.parse).some(value => value.inLanguage === 'sw')).toBe(true);
  await expect(page.locator('#statusText')).toHaveAttribute('role', 'status');
  await expect(page.locator('#dropZone')).toHaveAccessibleName('Chagua au buruta picha za kuweka watermark');
  await page.locator('#dropZone').focus();
  await expect(page.locator('#dropZone')).toBeFocused();
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await expect(page.locator('body')).toBeVisible();
  expect(await page.locator('iframe').count()).toBe(0);
  expect(await page.content()).not.toContain('Fungua zana kamili ya Kiingereza');
  await assertHealthy(proof);
});

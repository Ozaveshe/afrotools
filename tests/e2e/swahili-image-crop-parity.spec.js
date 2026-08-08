const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

function observe(page) {
  const proof = { errors: [], writes: [], data: [], badResources: [] };
  page.on('pageerror', error => proof.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') proof.errors.push(message.text()); });
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method())) proof.writes.push(`${request.method()} ${request.url()}`);
    if (['fetch', 'xhr', 'websocket'].includes(request.resourceType())) proof.data.push(request.url());
  });
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) proof.badResources.push(`${response.status()} ${response.url()}`);
  });
  return proof;
}

async function buffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function dimensions(value) {
  if (value.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
    return { format: 'png', width: value.readUInt32BE(16), height: value.readUInt32BE(20) };
  }
  if (value[0] === 0xff && value[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < value.length) {
      if (value[offset] !== 0xff) { offset += 1; continue; }
      const marker = value[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { format: 'jpg', width: value.readUInt16BE(offset + 7), height: value.readUInt16BE(offset + 5) };
      }
      if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
      const length = value.readUInt16BE(offset + 2);
      offset += 2 + length;
    }
  }
  if (value.subarray(0, 4).toString('ascii') === 'RIFF' && value.subarray(8, 12).toString('ascii') === 'WEBP') {
    const codec = value.subarray(12, 16).toString('ascii');
    if (codec === 'VP8X') return { format: 'webp', width: value.readUIntLE(24, 3) + 1, height: value.readUIntLE(27, 3) + 1 };
    if (codec === 'VP8 ') return { format: 'webp', width: value.readUInt16LE(26) & 0x3fff, height: value.readUInt16LE(28) & 0x3fff };
    if (codec === 'VP8L') { const bits = value.readUInt32LE(21); return { format: 'webp', width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }; }
  }
  throw new Error(`Unsupported downloaded image signature: ${value.subarray(0, 16).toString('hex')}`);
}

const source = {
  name: 'crop-source.png',
  mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAHgAAABQCAYAAADSm7GJAAAAxklEQVR4Ae3BARGDAADEsO4PG1MxHzvk4wZ8lCaf7/+6eZGLH28yojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqJ2cBKxEbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1B+W8BD81DI2aAAAAAElFTkSuQmCC', 'base64')
};

async function exactPng(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.locator('#cropInput').setInputFiles(source);
  await expect(page.locator('#cropStageCanvas')).toHaveJSProperty('width', 120);
  await page.locator('#cropSelectionX').fill('10');
  await page.locator('#cropSelectionY').fill('8');
  await page.locator('#cropSelectionW').fill('80');
  await page.locator('#cropSelectionH').fill('60');
  await page.locator('#cropApplySelection').click();
  await page.locator('#cropExportWidth').fill('64');
  await page.locator('#cropExportHeight').fill('48');
  await page.locator('#cropFormat').selectOption('png');
  await page.locator('#cropSuffix').fill('parity');
  await page.locator('#cropExportBtn').click();
  await expect(page.locator('#cropDownloadBtn')).toBeEnabled();
  const event = page.waitForEvent('download');
  await page.locator('#cropDownloadBtn').click();
  return buffer(await event);
}

test('English and Swahili routes share the exact crop engine and produce byte-identical PNG output', async ({ page }) => {
  const english = await exactPng(page, '/tools/image-crop/');
  const swahili = await exactPng(page, '/sw/zana/kukata-picha/');
  expect(dimensions(english)).toEqual({ format: 'png', width: 64, height: 48 });
  expect(dimensions(swahili)).toEqual({ format: 'png', width: 64, height: 48 });
  expect(crypto.createHash('sha256').update(swahili).digest('hex')).toBe(crypto.createHash('sha256').update(english).digest('hex'));
});

test('Swahili crop owner preserves interactive selection and reopens every advertised format', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const proof = observe(page);
  await page.goto('/sw/zana/kukata-picha/', { waitUntil: 'domcontentloaded' });
  await page.locator('#cropApplySelection').click({ force: true });
  await expect(page.locator('#cropStudioStatus')).toContainText('Chagua picha');

  await page.locator('#cropInput').setInputFiles(source);
  await expect(page.locator('#cropStudioStatus')).toContainText('120 x 80 px imefunguliwa');
  await expect(page.locator('#cropStageCanvas')).toHaveJSProperty('width', 120);
  await expect(page.locator('#cropStageCanvas')).toHaveJSProperty('height', 80);
  await page.locator('#cropRotateRight').click();
  await expect(page.locator('#cropDetailTransform')).toContainText('90°');
  await page.locator('#cropFlipH').click();
  await expect(page.locator('#cropDetailTransform')).toContainText('mlalo');
  await page.locator('#cropReset').click();
  await expect(page.locator('#cropDetailTransform')).toHaveText('0°');

  await page.locator('#cropSelectionX').fill('10');
  await page.locator('#cropSelectionY').fill('8');
  await page.locator('#cropSelectionW').fill('80');
  await page.locator('#cropSelectionH').fill('60');
  await page.locator('#cropApplySelection').click();
  await expect(page.locator('#cropStudioStatus')).toContainText('Eneo kamili');
  await page.locator('#cropExportWidth').fill('64');
  await page.locator('#cropExportHeight').fill('48');
  await page.locator('#cropSuffix').fill('jaribio');

  for (const [option, extension] of [['png', 'png'], ['jpeg', 'jpg'], ['webp', 'webp']]) {
    await page.locator('#cropFormat').selectOption(option);
    await page.locator('#cropExportBtn').click();
    await expect(page.locator('#cropStudioStatus')).toContainText('imeandaliwa');
    const event = page.waitForEvent('download');
    await page.locator('#cropDownloadBtn').click();
    const download = await event;
    expect(download.suggestedFilename()).toBe(`crop-source-jaribio.${extension}`);
    expect(dimensions(await buffer(download))).toEqual({ format: extension, width: 64, height: 48 });
  }

  await page.locator('#cropCopyRecipeBtn').click();
  await expect(page.locator('#cropStudioStatus')).toContainText('yamenakiliwa');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('AfroTools — Kukata Picha');
  await expect(page.locator('.crop-history-item')).toHaveCount(3);
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test('Swahili crop route is responsive, themed, keyboard reachable and search complete', async ({ page }) => {
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sw/zana/kukata-picha/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kukata-picha/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/image-crop/');
  await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kukata-picha/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/image-crop.webp');
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.map(JSON.parse).some(value => value.inLanguage === 'sw')).toBe(true);
  await page.locator('#cropDropZone').focus();
  await expect(page.locator('#cropDropZone')).toBeFocused();
  const light = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(light);
  await expect(page.locator('#cropStudioStatus')).toHaveAttribute('role', 'status');
  expect(await page.locator('iframe').count()).toBe(0);
});

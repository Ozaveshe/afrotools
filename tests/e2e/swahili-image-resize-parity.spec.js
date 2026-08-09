const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAHgAAABQCAYAAADSm7GJAAAAxklEQVR4Ae3BARGDAADEsO4PG1MxHzvk4wZ8lCaf7/+6eZGLH28yojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqI2ojaiNqJ2cBKxEbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1EbURtRG1B+W8BD81DI2aAAAAAElFTkSuQmCC';
const fixture = name => ({ name, mimeType: 'image/png', buffer: Buffer.from(pngBase64, 'base64') });

function observe(page) {
  const proof = { errors: [], writes: [], data: [], badResources: [] };
  page.on('pageerror', error => proof.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') proof.errors.push(message.text()); });
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method())) proof.writes.push(`${request.method()} ${request.url()}`);
    if (['fetch', 'xhr', 'websocket'].includes(request.resourceType())) proof.data.push(request.url());
  });
  page.on('response', response => { if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) proof.badResources.push(`${response.status()} ${response.url()}`); });
  return proof;
}

async function buffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function dimensions(value) {
  if (value.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return { format: 'png', width: value.readUInt32BE(16), height: value.readUInt32BE(20) };
  if (value[0] === 0xff && value[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < value.length) {
      if (value[offset] !== 0xff) { offset += 1; continue; }
      const marker = value[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return { format: 'jpg', width: value.readUInt16BE(offset + 7), height: value.readUInt16BE(offset + 5) };
      if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
      offset += 2 + value.readUInt16BE(offset + 2);
    }
  }
  if (value.subarray(0, 4).toString('ascii') === 'RIFF' && value.subarray(8, 12).toString('ascii') === 'WEBP') {
    const codec = value.subarray(12, 16).toString('ascii');
    if (codec === 'VP8X') return { format: 'webp', width: value.readUIntLE(24, 3) + 1, height: value.readUIntLE(27, 3) + 1 };
    if (codec === 'VP8 ') return { format: 'webp', width: value.readUInt16LE(26) & 0x3fff, height: value.readUInt16LE(28) & 0x3fff };
    if (codec === 'VP8L') { const bits = value.readUInt32LE(21); return { format: 'webp', width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }; }
  }
  throw new Error(`Unsupported image ${value.subarray(0, 16).toString('hex')}`);
}

async function configure(page, { format = 'png', mode = 'stretch', secondTarget = false } = {}) {
  await page.locator('#resizeAutoRun').uncheck();
  await page.locator('[data-resize-target="landscape"]').evaluate(button => { if (button.classList.contains('active')) button.click(); });
  await page.locator('[data-resize-target="thumb"]').evaluate((button, active) => {
    if (button.classList.contains('active') !== active) button.click();
  }, secondTarget);
  await page.locator('#resizeCustomWidth').fill('60');
  await page.locator('#resizeCustomHeight').fill('40');
  await page.locator('#resizeMode').selectOption(mode);
  await page.locator('#resizeFormat').selectOption(format);
  await page.locator('#resizeSuffix').fill('-parity');
}

async function exactPng(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await configure(page);
  await page.locator('#resizeInput').setInputFiles(fixture('resize-source.png'));
  await page.locator('#resizeProcessBtn').click();
  await expect(page.locator('#resizeOutputList .resize-output-row')).toHaveCount(1);
  const event = page.waitForEvent('download');
  await page.locator('[data-action="download-output"]').click();
  return buffer(await event);
}

test('English and Swahili routes share the exact resizer and produce byte-identical PNG output', async ({ page }) => {
  const english = await exactPng(page, '/tools/image-resize/');
  const swahili = await exactPng(page, '/sw/zana/kubadilisha-ukubwa-wa-picha/');
  expect(dimensions(english)).toEqual({ format: 'png', width: 60, height: 40 });
  expect(dimensions(swahili)).toEqual({ format: 'png', width: 60, height: 40 });
  expect(crypto.createHash('sha256').update(swahili).digest('hex')).toBe(crypto.createHash('sha256').update(english).digest('hex'));
});

test('Swahili resizer reopens codecs, modes and every multi-file multi-target export', async ({ page }) => {
  const proof = observe(page);
  await page.goto('/sw/zana/kubadilisha-ukubwa-wa-picha/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#resizeStudioStatus')).toHaveText('Tayari');

  for (const [format, extension] of [['png', 'png'], ['jpeg', 'jpg'], ['webp', 'webp']]) {
    await configure(page, { format });
    await page.locator('#resizeInput').setInputFiles(fixture(`moja-${extension}.png`));
    await page.locator('#resizeProcessBtn').click();
    await expect(page.locator('#resizeOutputList .resize-output-row')).toHaveCount(1);
    const event = page.waitForEvent('download');
    await page.locator('[data-action="download-output"]').click();
    expect(dimensions(await buffer(await event))).toEqual({ format: extension, width: 60, height: 40 });
    await page.locator('#resizeClearBtn').click();
    await expect(page.locator('#resizeMetricFiles')).toHaveText('0');
  }

  for (const [mode, expected] of [['fit', [60, 40]], ['fill', [60, 40]], ['pad', [60, 40]], ['stretch', [60, 40]]]) {
    await configure(page, { mode });
    await page.locator('#resizeInput').setInputFiles(fixture(`mode-${mode}.png`));
    await page.locator('#resizeProcessBtn').click();
    const event = page.waitForEvent('download');
    await page.locator('[data-action="download-output"]').click();
    const decoded = dimensions(await buffer(await event));
    expect([decoded.width, decoded.height]).toEqual(expected);
    await page.locator('#resizeClearBtn').click();
  }

  await configure(page, { secondTarget: true });
  await page.locator('#resizeInput').setInputFiles([fixture('picha-moja.png'), fixture('picha-mbili.png')]);
  await page.locator('#resizeProcessBtn').click();
  await expect(page.locator('#resizeOutputList .resize-output-row')).toHaveCount(4);
  const outputs = await page.locator('#resizeOutputList .resize-output-row').evaluateAll(rows => rows.map(row => ({ name: row.querySelector('h3').textContent, detail: row.querySelector('.resize-row-meta').textContent })));
  expect(outputs.filter(output => output.detail.includes('60x40'))).toHaveLength(2);
  expect(outputs.filter(output => output.detail.includes('512x512'))).toHaveLength(2);
  for (let index = 0; index < 4; index += 1) {
    const event = page.waitForEvent('download');
    await page.locator('[data-action="download-output"]').nth(index).click();
    const decoded = dimensions(await buffer(await event));
    expect([[60, 40], [512, 512]]).toContainEqual([decoded.width, decoded.height]);
  }
  const downloads = [];
  page.on('download', download => downloads.push(download));
  await page.locator('#resizeDownloadAllBtn').click();
  await expect.poll(() => downloads.length).toBe(4);
  for (const download of downloads) expect(dimensions(await buffer(download)).format).toBe('png');
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test('Swahili resizer reflows, supports theme/focus and has complete localized SEO', async ({ page }) => {
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sw/zana/kubadilisha-ukubwa-wa-picha/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kubadilisha-ukubwa-wa-picha/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/image-resize/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/image-resize.webp');
  await page.locator('#resizeDropZone').focus();
  await expect(page.locator('#resizeDropZone')).toBeFocused();
  const light = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(light);
  await expect(page.locator('#resizeStudioStatus')).toHaveAttribute('role', 'status');
  expect(await page.locator('iframe').count()).toBe(0);
});

const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const JSZip = require('jszip');

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

async function configureSingle(page, mime, suffix) {
  await page.locator('[data-ifc-format]').evaluateAll((nodes, selected) => {
    nodes.forEach(node => { node.checked = node.value === selected; });
    const selectedNode = nodes.find(node => node.value === selected);
    selectedNode.dispatchEvent(new Event('change', { bubbles: true }));
  }, mime);
  await page.locator('#ifcScale').fill('50');
  await page.locator('#ifcMaxWidth').fill('');
  await page.locator('#ifcMaxHeight').fill('');
  await page.locator('#ifcSuffix').fill(suffix);
}

async function exactPng(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#ifcStatus')).toContainText(route.startsWith('/sw/') ? 'Tayari' : 'Ready');
  await page.locator('#ifcInput').setInputFiles(fixture('format-source.png'));
  await configureSingle(page, 'image/png', 'parity');
  await page.locator('#ifcConvertCurrent').click();
  await expect(page.locator('#ifcDownloadCurrent')).toBeEnabled();
  const event = page.waitForEvent('download');
  await page.locator('#ifcDownloadCurrent').click();
  return buffer(await event);
}

test('English and Swahili routes share the exact converter and produce byte-identical PNG output', async ({ page }) => {
  const english = await exactPng(page, '/tools/image-format-convert/');
  const swahili = await exactPng(page, '/sw/zana/kubadilisha-format-ya-picha/');
  expect(dimensions(english)).toEqual({ format: 'png', width: 60, height: 40 });
  expect(dimensions(swahili)).toEqual({ format: 'png', width: 60, height: 40 });
  expect(crypto.createHash('sha256').update(swahili).digest('hex')).toBe(crypto.createHash('sha256').update(english).digest('hex'));
});

test('Swahili converter reopens supported codecs, picture markup and the full batch manifest', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const proof = observe(page);
  await page.goto('/sw/zana/kubadilisha-format-ya-picha/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#ifcStatus')).toContainText('Tayari');
  await expect(page.locator('[data-ifc-format][value="image/avif"]')).toBeDisabled();
  await page.locator('#ifcInput').setInputFiles([fixture('picha-moja.png'), fixture('picha-mbili.png')]);
  await expect(page.locator('.ifc-file')).toHaveCount(2);

  for (const [mime, extension] of [['image/png', 'png'], ['image/jpeg', 'jpg'], ['image/webp', 'webp']]) {
    await configureSingle(page, mime, 'jaribio');
    await page.locator('#ifcConvertCurrent').click();
    await expect(page.locator('#ifcStatus')).toContainText('imebadilishwa');
    const event = page.waitForEvent('download');
    await page.locator('#ifcDownloadCurrent').click();
    const download = await event;
    expect(download.suggestedFilename()).toBe(`picha-moja-jaribio.${extension}`);
    expect(dimensions(await buffer(download))).toEqual({ format: extension, width: 60, height: 40 });
  }

  await page.locator('[data-ifc-format]').evaluateAll(nodes => {
    nodes.forEach(node => { node.checked = !node.disabled && ['image/png', 'image/jpeg', 'image/webp'].includes(node.value); });
    nodes.find(node => node.checked).dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.locator('#ifcSuffix').fill('kifurushi');
  await page.locator('#ifcConvertCurrent').click();
  await expect(page.locator('#ifcCopyMarkup')).toBeEnabled();
  await page.locator('#ifcCopyMarkup').click();
  const markup = await page.evaluate(() => navigator.clipboard.readText());
  expect(markup).toContain('<picture>');
  expect(markup).toContain('type="image/webp"');
  expect(markup).toContain('<img src="picha-moja-kifurushi.jpg" alt="">');

  await page.locator('#ifcConvertAll').click();
  await expect(page.locator('#ifcStatus')).toContainText('ZIP kiko tayari');
  const zipEvent = page.waitForEvent('download');
  await page.locator('#ifcDownloadZip').click();
  const zip = await JSZip.loadAsync(await buffer(await zipEvent));
  const manifest = JSON.parse(await zip.file('manifest.json').async('text'));
  expect(manifest.files).toHaveLength(2);
  expect(manifest.settings.formats).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  for (const record of manifest.files) {
    expect(record.sourceDimensions).toBe('120x80');
    expect(record.outputs).toHaveLength(3);
    for (const output of record.outputs) {
      expect(output.dimensions).toBe('60x40');
      const decoded = dimensions(await zip.file(output.name).async('nodebuffer'));
      expect(decoded.width).toBe(60);
      expect(decoded.height).toBe(40);
    }
  }
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test('Swahili converter reflows, supports theme/focus and has complete localized SEO', async ({ page }) => {
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sw/zana/kubadilisha-format-ya-picha/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kubadilisha-format-ya-picha/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/image-format-convert/');
  await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kubadilisha-format-ya-picha/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/image-format-convert.webp');
  await page.locator('#ifcDropZone').focus();
  await expect(page.locator('#ifcDropZone')).toBeFocused();
  const light = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(light);
  await expect(page.locator('#ifcStatus')).toHaveAttribute('role', 'status');
  expect(await page.locator('iframe').count()).toBe(0);
});

const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

function svgFixture(name, width = 320, height = 180, accent = '#f97316') {
  return {
    name,
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g"><stop stop-color="#0f172a"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/><circle cx="${Math.round(width * 0.72)}" cy="${Math.round(height * 0.36)}" r="${Math.round(height * 0.22)}" fill="#f8fafc"/><text x="20" y="${Math.round(height * 0.72)}" fill="#fff" font-size="28" font-family="sans-serif">AFRO 2026</text></svg>`)
  };
}

function observe(page) {
  const proof = { errors: [], writes: [], data: [], badResources: [] };
  page.on('pageerror', (error) => proof.errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') proof.errors.push(message.text()); });
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) proof.writes.push(`${request.method()} ${request.url()}`);
    if (['fetch', 'xhr', 'websocket'].includes(request.resourceType())) proof.data.push(request.url());
  });
  page.on('response', (response) => {
    if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) proof.badResources.push(`${response.status()} ${response.url()}`);
  });
  return proof;
}

async function downloadBuffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function imageInfo(value) {
  if (value.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return { format: 'png', mime: 'image/png', width: value.readUInt32BE(16), height: value.readUInt32BE(20) };
  if (value[0] === 0xff && value[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < value.length) {
      if (value[offset] !== 0xff) { offset += 1; continue; }
      const marker = value[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return { format: 'jpg', mime: 'image/jpeg', width: value.readUInt16BE(offset + 7), height: value.readUInt16BE(offset + 5) };
      if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
      offset += 2 + value.readUInt16BE(offset + 2);
    }
  }
  if (value.subarray(0, 4).toString('ascii') === 'RIFF' && value.subarray(8, 12).toString('ascii') === 'WEBP') {
    const codec = value.subarray(12, 16).toString('ascii');
    if (codec === 'VP8X') return { format: 'webp', mime: 'image/webp', width: value.readUIntLE(24, 3) + 1, height: value.readUIntLE(27, 3) + 1 };
    if (codec === 'VP8 ') return { format: 'webp', mime: 'image/webp', width: value.readUInt16LE(26) & 0x3fff, height: value.readUInt16LE(28) & 0x3fff };
    if (codec === 'VP8L') { const bits = value.readUInt32LE(21); return { format: 'webp', mime: 'image/webp', width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }; }
  }
  throw new Error(`Unsupported downloaded image: ${value.subarray(0, 16).toString('hex')}`);
}

async function reopen(page, value, mime) {
  return page.evaluate(async ({ encoded, type }) => {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type }));
    const result = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return result;
  }, { encoded: value.toString('base64'), type: mime });
}

async function openConfigured(page, route, format, files = [svgFixture('synthetic-compress.svg')], options = {}) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.locator('#autoRun').uncheck();
  await page.locator('#formatSelect').selectOption(format);
  await page.locator('#qualitySlider').fill(String(options.quality || 76));
  await page.locator('#targetKb').fill(options.targetKb ? String(options.targetKb) : '');
  await page.locator('#maxWidth').fill(String(options.maxWidth || 160));
  await page.locator('#maxHeight').fill(String(options.maxHeight || 90));
  await page.locator('#nameSuffix').fill(options.suffix || '-jaribio');
  await page.locator('#fileInput').setInputFiles(files);
  await expect(page.locator('.queue-card')).toHaveCount(files.length);
  await expect(page.locator('.queue-badge.done')).toHaveCount(files.length);
  await expect(page.locator('#downloadAllBtn')).toBeEnabled();
}

async function saveFirst(page) {
  const event = page.waitForEvent('download');
  await page.locator('[data-action="download"]').first().click();
  const download = await event;
  return { download, value: await downloadBuffer(download) };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
});

test('English and Swahili use the same compression engine and produce byte-identical PNG', async ({ page }) => {
  await openConfigured(page, '/tools/image-compress/', 'png');
  const english = await saveFirst(page);
  expect(imageInfo(english.value)).toEqual({ format: 'png', mime: 'image/png', width: 160, height: 90 });
  await openConfigured(page, '/sw/zana/kubana-picha/', 'png');
  const swahili = await saveFirst(page);
  expect(imageInfo(swahili.value)).toEqual({ format: 'png', mime: 'image/png', width: 160, height: 90 });
  expect(crypto.createHash('sha256').update(swahili.value).digest('hex')).toBe(crypto.createHash('sha256').update(english.value).digest('hex'));
});

test('Swahili compressor reopens every advertised codec, auto selection, target output, and full batch', async ({ page }) => {
  const proof = observe(page);
  for (const format of ['png', 'jpeg', 'webp', 'auto']) {
    await openConfigured(page, '/sw/zana/kubana-picha/', format);
    const { download, value } = await saveFirst(page);
    const info = imageInfo(value);
    if (format !== 'auto') expect(info.format).toBe(format === 'jpeg' ? 'jpg' : format);
    expect(info.width).toBe(160);
    expect(info.height).toBe(90);
    expect(await reopen(page, value, info.mime)).toEqual({ width: 160, height: 90 });
    expect(download.suggestedFilename()).toMatch(new RegExp(`synthetic-compress-jaribio\\.${info.format}$`));
  }

  await openConfigured(page, '/sw/zana/kubana-picha/', 'jpeg', [svgFixture('target-source.svg', 900, 600)], { targetKb: 20, maxWidth: 600, maxHeight: 400, quality: 94, suffix: '-portal' });
  const target = await saveFirst(page);
  const targetInfo = imageInfo(target.value);
  expect(targetInfo).toEqual({ format: 'jpg', mime: 'image/jpeg', width: 600, height: 400 });
  expect(target.value.length).toBeLessThanOrEqual(20 * 1024);
  expect(await reopen(page, target.value, targetInfo.mime)).toEqual({ width: 600, height: 400 });

  const batch = [svgFixture('batch-one.svg', 320, 180, '#16a34a'), svgFixture('batch-two.svg', 240, 240, '#2563eb')];
  await openConfigured(page, '/sw/zana/kubana-picha/', 'webp', batch, { maxWidth: 120, maxHeight: 90, suffix: '-foleni' });
  const downloads = [];
  page.on('download', (download) => downloads.push(download));
  await page.locator('#downloadAllBtn').click();
  await expect.poll(() => downloads.length).toBe(2);
  const reopened = [];
  for (const download of downloads) {
    const value = await downloadBuffer(download);
    const info = imageInfo(value);
    reopened.push({ name: download.suggestedFilename(), ...info, ...(await reopen(page, value, info.mime)) });
  }
  expect(reopened).toEqual([
    { name: 'batch-one-foleni.webp', format: 'webp', mime: 'image/webp', width: 120, height: 68 },
    { name: 'batch-two-foleni.webp', format: 'webp', mime: 'image/webp', width: 90, height: 90 }
  ]);
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test('Swahili compressor covers presets, invalid and clear behavior, reflow, themes, keyboard, a11y, privacy, and SEO', async ({ page }) => {
  const proof = observe(page);
  await page.goto('/sw/zana/kubana-picha/', { waitUntil: 'domcontentloaded' });

  await page.locator('[data-preset="portal"]').click();
  await expect(page.locator('#qualitySlider')).toHaveValue('78');
  await expect(page.locator('#formatSelect')).toHaveValue('jpeg');
  await expect(page.locator('#targetKb')).toHaveValue('500');
  await expect(page.locator('#maxWidth')).toHaveValue('1800');
  await expect(page.locator('#maxHeight')).toHaveValue('1800');
  await expect(page.locator('#nameSuffix')).toHaveValue('-portal');
  await expect(page.locator('#presetNote')).toContainText('portal');

  await page.locator('#fileInput').setInputFiles({ name: 'si-picha.txt', mimeType: 'text/plain', buffer: Buffer.from('synthetic invalid fixture') });
  await expect(page.locator('#studioStatus')).toHaveText('Hakuna faili ya picha inayotumika iliyopatikana.');
  await expect(page.locator('.queue-card')).toHaveCount(0);

  await page.locator('#dropZone').focus();
  await expect(page.locator('#dropZone')).toBeFocused();
  expect(await page.locator('#dropZone').evaluate((node) => getComputedStyle(node).outlineWidth)).not.toBe('0px');
  const chooser = page.waitForEvent('filechooser');
  await page.keyboard.press('Enter');
  await (await chooser).setFiles(svgFixture('keyboard-source.svg'));
  await expect(page.locator('.queue-badge.done')).toHaveCount(1);
  await page.locator('#clearQueueBtn').click();
  await expect(page.locator('#studioStatus')).toHaveText('Foleni imefutwa.');
  await expect(page.locator('#metricFiles')).toHaveText('0');
  await expect(page.locator('#metricOriginal')).toHaveText('0 KB');
  await expect(page.locator('#downloadAllBtn')).toBeDisabled();

  // 640 CSS px is the reflow viewport produced by a 1280 px desktop at 200% browser zoom.
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sw/zana/kubana-picha/', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => ({
      delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      nodes: [...document.querySelectorAll('body *')]
        .filter((node) => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 8)
        .map((node) => `${node.tagName}.${node.className}#${node.id}:${Math.round(node.getBoundingClientRect().right)}`)
    }));
    expect(overflow.delta, JSON.stringify(overflow)).toBeLessThanOrEqual(1);
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kubana-picha/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/image-compress/');
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/compresser-image/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/image-compress.webp');
  expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThanOrEqual(2);
  await expect(page.locator('#studioStatus')).toHaveAttribute('role', 'status');
  await expect(page.locator('#studioStatus')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#fileInput')).toHaveAttribute('aria-label', 'Faili za picha');
  await expect(page.locator('#compareSlider')).toHaveAttribute('aria-label', 'Ulinganisho wa kabla na baada');
  const light = await page.locator('.gold-panel').first().evaluate((node) => getComputedStyle(node).backgroundColor);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  const dark = await page.locator('.gold-panel').first().evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(dark).not.toBe(light);
  const contrast = await page.locator('.gold-panel-title').first().evaluate((node) => {
    const parse = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = (rgb) => {
      const values = rgb.map((part) => {
        const value = part / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
    };
    const foreground = luminance(parse(getComputedStyle(node).color));
    const background = luminance(parse(getComputedStyle(node.parentElement.parentElement).backgroundColor));
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
  expect(await page.locator('iframe').count()).toBe(0);
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

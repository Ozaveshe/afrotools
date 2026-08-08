const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

const fixture = {
  name: 'synthetic-passport-source.svg',
  mimeType: 'image/svg+xml',
  buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#e2e8f0"/><ellipse cx="450" cy="480" rx="210" ry="270" fill="#8b5e3c"/><circle cx="375" cy="450" r="18" fill="#111827"/><circle cx="525" cy="450" r="18" fill="#111827"/><path d="M360 580 Q450 640 540 580" fill="none" stroke="#111827" stroke-width="14"/><path d="M130 1200 Q170 760 450 760 Q730 760 770 1200" fill="#1d4ed8"/></svg>')
};

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

async function reopen(page, value, type) {
  return page.evaluate(async ({ encoded, mime }) => {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mime }));
    const result = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return result;
  }, { encoded: value.toString('base64'), mime: type });
}

async function openAndLoad(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.locator('#ppInput').setInputFiles(fixture);
  await expect(page.locator('#ppRenderBtn')).toBeEnabled();
  await expect(page.locator('#ppSourceFile')).toContainText('synthetic-passport-source.svg');
}

async function renderAndDownload(page, layout, format, expected) {
  await page.locator('#ppLayout').selectOption(layout);
  await page.locator('#ppFormat').selectOption(format);
  await page.locator('#ppRenderBtn').click();
  await expect(page.locator('#ppOutputDimensions')).toHaveText(`${expected.width} x ${expected.height} px`);
  const event = page.waitForEvent('download');
  await page.locator('#ppDownloadBtn').click();
  const download = await event;
  const value = await buffer(download);
  expect(dimensions(value)).toEqual({ format: expected.format, width: expected.width, height: expected.height });
  expect(await reopen(page, value, format)).toEqual({ width: expected.width, height: expected.height });
  expect(download.suggestedFilename()).toMatch(new RegExp(`-${layout}\\.${expected.format === 'jpg' ? 'jpg' : expected.format}$`));
  return value;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('English and Swahili share the exact passport renderer and produce byte-identical PNG', async ({ page }) => {
  await openAndLoad(page, '/tools/passport-photo/');
  const english = await renderAndDownload(page, 'single', 'image/png', { format: 'png', width: 413, height: 531 });
  await openAndLoad(page, '/sw/zana/picha-ya-pasipoti/');
  const swahili = await renderAndDownload(page, 'single', 'image/png', { format: 'png', width: 413, height: 531 });
  expect(crypto.createHash('sha256').update(swahili).digest('hex')).toBe(crypto.createHash('sha256').update(english).digest('hex'));
});

test('Swahili passport studio reopens every advertised format and layout', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const proof = observe(page);
  await openAndLoad(page, '/sw/zana/picha-ya-pasipoti/');
  await expect(page.locator('#ppStatus')).toContainText('Picha imepakiwa');

  const layouts = [
    ['single', 413, 531],
    ['sheet-4x6', 1800, 1200],
    ['a4', 2480, 3508]
  ];
  const formats = [
    ['image/png', 'png'],
    ['image/jpeg', 'jpg'],
    ['image/webp', 'webp']
  ];
  for (const [layout, width, height] of layouts) {
    for (const [mime, format] of formats) await renderAndDownload(page, layout, mime, { format, width, height });
  }

  await page.locator('#ppSpecSelect').selectOption('ke-visa');
  await expect(page.locator('#ppSpecTitle')).toHaveText('Picha ya visa ya Kenya eCitizen');
  await expect(page.locator('#ppSpecSize')).toHaveText('55 x 55 mm / 207 x 207 px');
  await page.locator('#ppCopyBtn').click();
  const brief = await page.evaluate(() => navigator.clipboard.readText());
  expect(brief).toContain('Mahitaji: Picha ya visa ya Kenya eCitizen');
  expect(brief).toContain('Saizi: 55 x 55 mm / 207 x 207 px');
  expect(brief).toContain('https://immigration.ecitizen.go.ke/index.php?id=9');
  expect(brief).toContain('300 DPI');

  await page.locator('#ppZoom').evaluate(node => { node.value = '175'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#ppOffsetX').evaluate(node => { node.value = '20'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#ppRotation').evaluate(node => { node.value = '8'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#ppResetBtn').click();
  await expect(page.locator('#ppZoom')).toHaveValue('100');
  await expect(page.locator('#ppOffsetX')).toHaveValue('0');
  await expect(page.locator('#ppRotation')).toHaveValue('0');
  await expect(page.locator('#ppStatus')).toHaveText('Upunguzaji umerudishwa.');

  for (const checkbox of await page.locator('[data-pp-check]').all()) await checkbox.check();
  await expect(page.locator('#ppScoreText')).toHaveText('Ukaguzi 7 kati ya 7 umekamilika');
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test('Swahili passport studio handles invalid input, reflow, theme, focus, privacy and SEO', async ({ page }) => {
  const proof = observe(page);
  await page.goto('/sw/zana/picha-ya-pasipoti/', { waitUntil: 'domcontentloaded' });
  await page.locator('#ppInput').setInputFiles({ name: 'si-picha.txt', mimeType: 'text/plain', buffer: Buffer.from('synthetic invalid fixture') });
  await expect(page.locator('#ppStatus')).toHaveText('Chagua faili ya picha inayotumika kwenye kivinjari.');
  await expect(page.locator('#ppRenderBtn')).toBeDisabled();

  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sw/zana/picha-ya-pasipoti/', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => ({
      delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      nodes: [...document.querySelectorAll('body *')]
        .filter(node => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 8)
        .map(node => `${node.tagName}.${node.className}#${node.id}:${Math.round(node.getBoundingClientRect().right)}`)
    }));
    expect(overflow.delta, JSON.stringify(overflow)).toBeLessThanOrEqual(1);
  }

  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/picha-ya-pasipoti/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/passport-photo/');
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/photo-identite/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/passport-photo.webp');
  expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
  await page.locator('#ppDropZone').focus();
  await expect(page.locator('#ppDropZone')).toBeFocused();
  await expect(page.locator('#ppStatus')).toHaveAttribute('role', 'status');
  const light = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(light);
  expect(await page.locator('iframe').count()).toBe(0);
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

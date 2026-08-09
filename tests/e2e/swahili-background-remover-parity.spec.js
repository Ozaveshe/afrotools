const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

const fixture = {
  name: 'synthetic-background.svg',
  mimeType: 'image/svg+xml',
  buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><rect width="80" height="60" fill="#ffffff"/><rect x="20" y="15" width="40" height="30" rx="3" fill="#1463d6"/></svg>')
};

function observe(page) {
  const proof = { errors: [], writes: [], badResources: [] };
  page.on('pageerror', error => proof.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') proof.errors.push(message.text()); });
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method()) && !/google-analytics\.com|googlesyndication\.com/.test(request.url())) {
      proof.writes.push(`${request.method()} ${request.url()}`);
    }
  });
  page.on('response', response => {
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
  throw new Error(`Unsupported image: ${value.subarray(0, 16).toString('hex')}`);
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

async function loadAndProcess(page, route) {
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.locator('#brInput').setInputFiles(fixture);
  try {
    await expect(page.locator('#brProcessBtn')).toBeEnabled();
  } catch (error) {
    throw new Error(`Background Remover did not initialize on ${route}: ${runtimeErrors.join(' | ') || await page.locator('#brStatus').textContent()}\n${error.message}`);
  }
  await page.locator('#brCropSubject').uncheck();
  await page.locator('#brMode').selectOption('edge');
  await page.locator('#brProcessBtn').click();
  await expect(page.locator('#brRenderBtn')).toBeEnabled();
}

async function renderAndDownload(page, mime, format) {
  await page.locator('#brFormat').selectOption(mime);
  await page.locator('#brRenderBtn').click();
  await expect(page.locator('#brDownloadBtn')).toBeEnabled();
  const pending = page.waitForEvent('download');
  await page.locator('#brDownloadBtn').click();
  const download = await pending;
  const value = await downloadBuffer(download);
  expect(dimensions(value)).toEqual({ format, width: 80, height: 60 });
  expect(await reopen(page, value, mime)).toEqual({ width: 80, height: 60 });
  return value;
}

test.beforeEach(async ({ page }) => page.addInitScript(() => localStorage.clear()));

test('English and Swahili share the exact local renderer', async ({ page }) => {
  await loadAndProcess(page, '/tools/background-remover/');
  const english = await renderAndDownload(page, 'image/png', 'png');
  await loadAndProcess(page, '/sw/zana/kiondoa-mandharinyuma/');
  const swahili = await renderAndDownload(page, 'image/png', 'png');
  expect(crypto.createHash('sha256').update(swahili).digest('hex')).toBe(crypto.createHash('sha256').update(english).digest('hex'));
});

test('Swahili workflow reopens every export and keeps the handoff native', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const proof = observe(page);
  await loadAndProcess(page, '/sw/zana/kiondoa-mandharinyuma/');
  await expect(page.locator('#brStatus')).toContainText('Mandharinyuma yameondolewa');
  await renderAndDownload(page, 'image/png', 'png');
  await renderAndDownload(page, 'image/webp', 'webp');
  await page.locator('#brBackground').selectOption('white');
  await renderAndDownload(page, 'image/jpeg', 'jpg');
  await page.locator('#brCopyBriefBtn').click();
  const brief = await page.evaluate(() => navigator.clipboard.readText());
  expect(brief).toContain('Muhtasari wa Studio ya Kuondoa Mandharinyuma');
  expect(brief).toContain('Picha chanzo: 80 x 60');
  expect(brief).not.toMatch(/Background Remover Studio handoff|Source:|Recipe:|Images stayed/);
  await page.locator('#brResetMaskBtn').click();
  await expect(page.locator('#brStatus')).toContainText('Maski imerudishwa');
  const visible = await page.locator('.br-studio').innerText();
  for (const leak of ['Working...', 'Rendering...', 'Brush ready', 'Mask not cut', 'Not processed', 'Handoff brief copied', 'recipe loaded']) {
    expect(visible).not.toContain(leak);
  }
  expect(proof.writes).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test('Swahili route passes invalid, mobile, zoom, theme, keyboard and SEO boundaries', async ({ page }) => {
  const proof = observe(page);
  await page.goto('/sw/zana/kiondoa-mandharinyuma/', { waitUntil: 'domcontentloaded' });
  await page.locator('#brInput').setInputFiles({ name: 'si-picha.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid synthetic fixture') });
  await expect(page.locator('#brStatus')).toContainText('Chagua faili ya JPG');
  await expect(page.locator('#brProcessBtn')).toBeDisabled();

  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sw/zana/kiondoa-mandharinyuma/', { waitUntil: 'domcontentloaded' });
    const delta = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(delta).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 750, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  const zoomOverflow = await page.evaluate(() => ({
    delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    nodes: [...document.querySelectorAll('body *')]
      .filter(node => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && getComputedStyle(node).position !== 'fixed')
      .slice(0, 8)
      .map(node => `${node.tagName}#${node.id}.${node.className}:${Math.round(node.getBoundingClientRect().right)}`)
  }));
  expect(zoomOverflow.delta, JSON.stringify(zoomOverflow)).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.body.style.zoom = ''; });

  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kiondoa-mandharinyuma/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/background-remover/');
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/supprimer-arriere-plan/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/background-remover.webp');
  expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
  await page.locator('#brDropZone').focus();
  await expect(page.locator('#brDropZone')).toBeFocused();
  await expect(page.locator('#brStatus')).toHaveAttribute('role', 'status');
  const light = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(light);
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await page.locator('iframe').count()).toBe(0);
  expect(proof.writes).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

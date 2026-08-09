const { test, expect } = require('@playwright/test');
const JSZip = require('jszip');
const crypto = require('crypto');

test.setTimeout(180000);
async function bytes(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
function pngSize(value) {
  expect(value.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return [value.readUInt32BE(16), value.readUInt32BE(20)];
}
function parseIco(value) {
  expect(value.readUInt16LE(0)).toBe(0);
  expect(value.readUInt16LE(2)).toBe(1);
  const count = value.readUInt16LE(4);
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    const position = 6 + index * 16;
    const width = value[position] || 256;
    const height = value[position + 1] || 256;
    const length = value.readUInt32LE(position + 8);
    const offset = value.readUInt32LE(position + 12);
    const image = value.subarray(offset, offset + length);
    entries.push({ width, height, embedded: pngSize(image) });
  }
  return entries;
}
function observe(page) {
  const proof = { errors: [], data: [], writes: [], telemetry: [], bad: [] };
  const isTelemetry = url => /^(?:https:\/\/(?:www\.)?google-analytics\.com\/g\/collect|https:\/\/www\.google\.com\/g\/collect|https:\/\/pagead2\.googlesyndication\.com\/measurement\/conversion|https:\/\/www\.googletagmanager\.com\/td)/.test(url);
  page.on('pageerror', error => proof.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') proof.errors.push(message.text()); });
  page.on('request', request => {
    // Consent-mode route telemetry contains no favicon bytes or uploaded image data.
    // Keep it observable while any other write or data request fails the local-only gate.
    if (isTelemetry(request.url())) proof.telemetry.push(`${request.method()} ${request.url()}`);
    else {
      if (!['GET', 'HEAD'].includes(request.method())) proof.writes.push(`${request.method()} ${request.url()}`);
      if (['fetch', 'xhr', 'websocket'].includes(request.resourceType())) proof.data.push(request.url());
    }
  });
  page.on('response', response => { if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) proof.bad.push(`${response.status()} ${response.url()}`); });
  return proof;
}
async function textArchive(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => Boolean(window.AfroTools && window.AfroTools.faviconStudio))).toBe(true);
  await page.getByRole('button', { name: /Text|Maandishi/ }).click();
  await page.getByLabel(/Text or Emoji|Maandishi au emoji/).fill('AT');
  await page.locator('#bgColor').evaluate(node => { node.value = '#123456'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#textColor').evaluate(node => { node.value = '#ffffff'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.getByRole('button', { name: /Generate Favicons|Tengeneza favicon/ }).click();
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download ZIP|Pakua ZIP/ }).click();
  return bytes(await event);
}
async function inspectArchive(value) {
  const zip = await JSZip.loadAsync(value);
  expect(Object.keys(zip.files).sort()).toEqual(['favicon-16x16.png', 'favicon-32x32.png', 'favicon-48x48.png', 'favicon-64x64.png', 'favicon.ico', 'site.webmanifest']);
  const hashes = {};
  for (const size of [16, 32, 48, 64]) {
    const file = await zip.file(`favicon-${size}x${size}.png`).async('nodebuffer');
    expect(pngSize(file)).toEqual([size, size]);
    hashes[size] = crypto.createHash('sha256').update(file).digest('hex');
  }
  const ico = await zip.file('favicon.ico').async('nodebuffer');
  expect(parseIco(ico)).toEqual([16, 32, 48, 64].map(size => ({ width: size, height: size, embedded: [size, size] })));
  const manifest = JSON.parse(await zip.file('site.webmanifest').async('string'));
  expect(manifest).toMatchObject({ name: 'Website favicon', short_name: 'Favicon', theme_color: '#123456', background_color: '#123456', display: 'standalone' });
  expect(manifest.icons).toEqual([16, 32, 48, 64].map(size => ({ src: `favicon-${size}x${size}.png`, sizes: `${size}x${size}`, type: 'image/png' })));
  return hashes;
}

test.beforeEach(async ({ page }) => page.addInitScript(() => localStorage.clear()));

test('English and Swahili share exact rendering and parsed PNG, ICO, manifest and ZIP output', async ({ page }) => {
  const english = await textArchive(page, '/tools/favicon-generator/');
  const swahili = await textArchive(page, '/sw/zana/kizalishaji-favicon/');
  expect(await inspectArchive(swahili)).toEqual(await inspectArchive(english));
});

test('Swahili image input, invalid state and reset remain local and deterministic', async ({ page }) => {
  const proof = observe(page);
  await page.goto('/sw/zana/kizalishaji-favicon/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => Boolean(window.AfroTools && window.AfroTools.faviconStudio))).toBe(true);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40" fill="#16a34a"/></svg>';
  await page.locator('#imageInput').setInputFiles({ name: 'alama.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
  await expect(page.locator('#faviconStatus')).toContainText('alama.svg iko tayari');
  await page.getByRole('button', { name: 'Tengeneza favicon' }).click();
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pakua ZIP' }).click();
  const archive = await bytes(await event);
  const zip = await JSZip.loadAsync(archive);
  for (const size of [16, 32, 48, 64]) expect(pngSize(await zip.file(`favicon-${size}x${size}.png`).async('nodebuffer'))).toEqual([size, size]);
  await page.getByRole('button', { name: 'Rudisha' }).click();
  await expect(page.locator('#faviconStatus')).toContainText('Studio imerejeshwa');
  await expect(page.locator('#generateBtn')).toBeDisabled();
  await expect(page.locator('#previewCard')).not.toHaveClass(/on/);
  await page.locator('#imageInput').setInputFiles({ name: 'si-picha.txt', mimeType: 'text/plain', buffer: Buffer.from('synthetic') });
  await expect(page.locator('#faviconStatus')).toContainText('Chagua faili halali');
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.bad).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test('Swahili route reflows and preserves theme, keyboard, accessibility and search contracts', async ({ page }) => {
  const proof = observe(page);
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sw/zana/kizalishaji-favicon/', { waitUntil: 'domcontentloaded' });
    const delta = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(delta).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 750, height: 900 });
  await page.goto('/sw/zana/kizalishaji-favicon/', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => { document.body.style.zoom = '2'; return document.documentElement.scrollWidth - document.documentElement.clientWidth; })).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.body.style.zoom = ''; });
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kizalishaji-favicon/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/favicon-generator/');
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/generateur-favicon/');
  await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kizalishaji-favicon/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/favicon-generator.webp');
  expect(await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)).some(value => value.inLanguage === 'sw'))).toBe(true);
  await expect(page.locator('#faviconStatus')).toHaveAttribute('role', 'status');
  await expect(page.locator('#imageInput')).toHaveAttribute('aria-describedby', 'faviconStatus');
  await page.getByRole('button', { name: 'Maandishi/Emoji' }).focus();
  await expect(page.getByRole('button', { name: 'Maandishi/Emoji' })).toBeFocused();
  const focus = await page.getByRole('button', { name: 'Maandishi/Emoji' }).evaluate(node => ({ outline: getComputedStyle(node).outlineStyle, shadow: getComputedStyle(node).boxShadow }));
  expect(focus.outline !== 'none' || focus.shadow !== 'none').toBe(true);
  const light = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(light);
  expect(await page.locator('iframe').count()).toBe(0);
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.bad).toEqual([]);
  expect(proof.errors).toEqual([]);
});

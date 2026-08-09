const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

test.setTimeout(120000);
async function bytes(download) { const stream = await download.createReadStream(); const chunks = []; for await (const chunk of stream) chunks.push(chunk); return Buffer.concat(chunks); }
function pngSize(value) { expect(value.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); return [value.readUInt32BE(16), value.readUInt32BE(20)]; }
function observe(page) {
  const proof = { errors: [], writes: [], externalData: [], telemetry: [], bad: [] };
  const isTelemetry = url => /^(?:https:\/\/(?:www\.)?google-analytics\.com\/g\/collect|https:\/\/www\.google\.com\/g\/collect|https:\/\/pagead2\.googlesyndication\.com\/measurement\/conversion|https:\/\/www\.googletagmanager\.com\/td)/.test(url);
  page.on('pageerror', error => proof.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') proof.errors.push(message.text()); });
  page.on('request', request => {
    const url = new URL(request.url());
    if (isTelemetry(request.url())) proof.telemetry.push(`${request.method()} ${request.url()}`);
    else {
      if (!['GET', 'HEAD'].includes(request.method())) proof.writes.push(`${request.method()} ${request.url()}`);
      if (!['127.0.0.1', 'localhost'].includes(url.hostname) && ['fetch', 'xhr', 'websocket'].includes(request.resourceType())) proof.externalData.push(request.url());
    }
    expect(request.postData() || '').not.toContain('PRIVATE MEME PIXELS');
  });
  page.on('response', response => { if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) proof.bad.push(`${response.status()} ${response.url()}`); });
  return proof;
}
async function fixture(page) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 900;
    const context = canvas.getContext('2d'); context.fillStyle = '#164e63'; context.fillRect(0, 0, 1200, 900);
    context.fillStyle = '#facc15'; context.fillRect(90, 90, 1020, 720);
    context.fillStyle = '#164e63'; context.fillRect(140, 140, 920, 620);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return { name: 'private-meme-pixels.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') };
}
async function getDownload(page) { const event = page.waitForEvent('download'); await page.locator('#downloadBtn').click(); const result = await event; return { name: result.suggestedFilename(), value: await bytes(result) }; }
async function controlled(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#sceneGrid .scene-btn')).toHaveCount(5);
  await page.locator('[data-source="upload"]').click();
  await page.locator('#imageInput').setInputFiles(await fixture(page));
  await expect(page.locator('#uploadMeta')).toContainText(route.startsWith('/sw/') ? 'Unatumia' : 'Using');
  await page.locator('#topText').fill('PRIVATE MEME PIXELS');
  await page.locator('#bottomText').fill('CONTROLLED OUTPUT');
  await page.locator('#textStyle').selectOption('classic');
  await page.locator('#fontSize').evaluate(node => { node.value = '12'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  const output = await getDownload(page);
  expect(output.name).toMatch(/^private-meme-pixels-.+-meme\.png$/);
  expect(pngSize(output.value)).toEqual([1200, 900]);
  return output.value;
}

test.beforeEach(async ({ page }) => page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', JSON.stringify({ analytics: false, marketing: false, functional: false }))));

test('English and Swahili preserve byte-identical uploaded-image PNG rendering', async ({ page }) => {
  const proof = observe(page);
  const english = await controlled(page, '/tools/meme-generator/');
  const swahili = await controlled(page, '/sw/zana/kitengeneza-meme/');
  expect(crypto.createHash('sha256').update(swahili).digest('hex')).toBe(crypto.createHash('sha256').update(english).digest('hex'));
  expect(proof.writes).toEqual([]); expect(proof.externalData).toEqual([]); expect(proof.bad).toEqual([]); expect(proof.errors).toEqual([]);
});

test('native starter scenes, packs, styles, reset, invalid input and PNG output remain deterministic', async ({ page }) => {
  const proof = observe(page);
  await page.goto('/sw/zana/kitengeneza-meme/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#sceneGrid .scene-btn')).toHaveCount(5);
  await expect(page.locator('#packGrid .pack-btn')).toHaveCount(6);
  const sceneHashes = [];
  for (const button of await page.locator('#sceneGrid .scene-btn').all()) {
    await button.click();
    sceneHashes.push(await page.locator('#memeCanvas').evaluate(canvas => canvas.toDataURL('image/png').slice(-120)));
  }
  expect(new Set(sceneHashes).size).toBe(5);
  for (const button of await page.locator('#packGrid .pack-btn').all()) { await button.click(); await expect(page.locator('#topText')).not.toHaveValue(''); await expect(page.locator('#bottomText')).not.toHaveValue(''); }
  for (const style of ['classic', 'warm', 'bold']) { await page.locator('#textStyle').selectOption(style); await expect(page.locator('#textStyle')).toHaveValue(style); }
  await page.locator('#fontSize').evaluate(node => { node.value = '18'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#fontSizeValue')).toHaveText('18%');
  await page.locator('#topText').fill('IMEBADILISHWA'); await page.locator('#resetBtn').click(); await expect(page.locator('#topText')).not.toHaveValue('IMEBADILISHWA');
  const starter = await getDownload(page); expect(pngSize(starter.value)).toEqual([1200, 900]);
  await page.locator('[data-source="upload"]').click();
  await page.locator('#imageInput').setInputFiles({ name: 'siri.txt', mimeType: 'text/plain', buffer: Buffer.from('PRIVATE MEME PIXELS') });
  await expect(page.locator('#statusText')).toHaveText('Tafadhali chagua faili ya picha.');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('PRIVATE MEME PIXELS');
  expect(await page.evaluate(() => location.search + location.hash)).toBe('');
  expect(proof.writes).toEqual([]); expect(proof.externalData).toEqual([]); expect(proof.bad).toEqual([]); expect(proof.errors).toEqual([]);
});

test('native route passes mobile, 200% reflow, themes, keyboard, a11y and SEO contracts', async ({ page }) => {
  const proof = observe(page);
  await page.goto('/sw/zana/kitengeneza-meme/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tengeneza meme za Kiafrika');
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kitengeneza-meme/');
  for (const lang of ['en', 'fr', 'sw', 'x-default']) await expect(page.locator(`link[rel=alternate][hreflang="${lang}"]`)).toHaveCount(1);
  expect(await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)))).toEqual(expect.arrayContaining([expect.objectContaining({ '@type': 'WebApplication', inLanguage: 'sw' })]));
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /meme-generator\.webp$/);
  await page.locator('[data-source="upload"]').click();
  await page.getByLabel('Chagua au dondosha picha ya meme').focus(); await expect(page.getByLabel('Chagua au dondosha picha ya meme')).toBeFocused();
  await expect(page.locator('#statusText')).toHaveAttribute('aria-live', 'polite');
  for (const width of [320, 375]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1); }
  await page.setViewportSize({ width: 750, height: 900 }); expect(await page.evaluate(() => { document.body.style.zoom = '2'; return document.documentElement.scrollWidth - document.documentElement.clientWidth; })).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.body.style.zoom = ''; document.documentElement.setAttribute('data-theme', 'dark'); }); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const visible = await page.locator('body').innerText();
  for (const leak of ['Choose your base image', 'Upload your image', 'Preview and download', 'Download PNG', 'Reset Text', 'Current caption pack']) expect(visible).not.toContain(leak);
  expect(proof.writes).toEqual([]); expect(proof.externalData).toEqual([]); expect(proof.bad).toEqual([]); expect(proof.errors).toEqual([]);
});

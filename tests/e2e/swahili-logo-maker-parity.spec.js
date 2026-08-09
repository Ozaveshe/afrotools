const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
test.setTimeout(90000);
async function bytes(download) { const stream = await download.createReadStream(); const chunks = []; for await (const chunk of stream) chunks.push(chunk); return Buffer.concat(chunks); }
function pngSize(value) { expect(value.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); return [value.readUInt32BE(16), value.readUInt32BE(20)]; }
function observe(page) {
  const proof = { errors: [], writes: [], externalData: [], telemetry: [], bad: [] };
  const isTelemetry = url => /^(?:https:\/\/(?:www\.)?google-analytics\.com\/g\/collect|https:\/\/www\.google\.com\/g\/collect|https:\/\/pagead2\.googlesyndication\.com\/measurement\/conversion|https:\/\/www\.googletagmanager\.com\/td)/.test(url);
  page.on('pageerror', e => proof.errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') proof.errors.push(m.text()); });
  page.on('request', request => {
    const url = new URL(request.url());
    if (isTelemetry(request.url())) proof.telemetry.push(`${request.method()} ${request.url()}`);
    else {
      if (!['GET', 'HEAD'].includes(request.method())) proof.writes.push(`${request.method()} ${request.url()}`);
      if (!['127.0.0.1', 'localhost'].includes(url.hostname) && ['fetch', 'xhr', 'websocket'].includes(request.resourceType())) proof.externalData.push(request.url());
    }
    expect(request.postData() || '').not.toContain('SIRI YA BRAND');
  });
  page.on('response', response => { if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) proof.bad.push(`${response.status()} ${response.url()}`); }); return proof;
}
async function download(page, selector) { const pending = page.waitForEvent('download'); await page.locator(selector).click(); const item = await pending; return { name: item.suggestedFilename(), value: await bytes(item) }; }
async function controlled(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.locator('#logoText').fill('SIRI YA BRAND'); await page.locator('#fontSelect').selectOption('DM Sans'); await page.locator('#textColor').evaluate(node => { node.value = '#112233'; node.dispatchEvent(new Event('change', { bubbles: true })); }); await page.locator('#bgColor').evaluate(node => { node.value = '#f1f5f9'; node.dispatchEvent(new Event('change', { bubbles: true })); }); await page.locator('#layout').selectOption('icon-top'); await page.locator('#iconSelect').selectOption({ index: 2 });
  const svg = await download(page, '#downloadSvgBtn'); expect(svg.name).toBe('logo.svg'); expect(svg.value.toString()).toContain('SIRI YA BRAND'); expect(svg.value.toString()).toContain('viewBox="0 0 200 150"');
  const png = await download(page, '#downloadPngBtn'); expect(png.name).toBe('logo.png'); expect(pngSize(png.value)).toEqual([400, 300]); return { svg: svg.value, png: png.value };
}
test.beforeEach(async ({ page }) => page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', JSON.stringify({ analytics: false, marketing: false, functional: false }))));
test('English and Swahili produce byte-identical controlled SVG and PNG', async ({ page }) => {
  const proof = observe(page); const en = await controlled(page, '/tools/logo-maker/'); const sw = await controlled(page, '/sw/zana/kitengeneza-logo/');
  for (const kind of ['svg', 'png']) expect(crypto.createHash('sha256').update(sw[kind]).digest('hex')).toBe(crypto.createHash('sha256').update(en[kind]).digest('hex'));
  expect(proof.writes).toEqual([]); expect(proof.externalData).toEqual([]); expect(proof.bad).toEqual([]); expect(proof.errors).toEqual([]);
});
test('all source presets, fonts, layouts and icons remain functional with fallback output', async ({ page }) => {
  const proof = observe(page); await page.goto('/sw/zana/kitengeneza-logo/', { waitUntil: 'domcontentloaded' }); await expect(page.locator('.logo-preset')).toHaveCount(6); await expect(page.locator('#fontSelect option')).toHaveCount(6); await expect(page.locator('#layout option')).toHaveCount(3); await expect(page.locator('#iconSelect option')).toHaveCount(9);
  for (const preset of await page.locator('.logo-preset').all()) { await preset.click(); await expect(preset).toHaveAttribute('aria-pressed', 'true'); expect(await page.locator('#logoPreview text').count()).toBeGreaterThan(0); }
  await page.locator('#logoText').fill(''); await expect(page.locator('#logoPreview')).toContainText('Logo'); const svg = await download(page, '#downloadSvgBtn'); expect(svg.value.toString()).toContain('>Logo<'); expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('SIRI YA BRAND'); expect(await page.evaluate(() => location.search + location.hash)).toBe('');
  expect(proof.writes).toEqual([]); expect(proof.externalData).toEqual([]); expect(proof.bad).toEqual([]); expect(proof.errors).toEqual([]);
});
test('native route passes mobile, 200% reflow, themes, keyboard, a11y and SEO', async ({ page }) => {
  const proof = observe(page); await page.goto('/sw/zana/kitengeneza-logo/', { waitUntil: 'domcontentloaded' }); await expect(page.locator('html')).toHaveAttribute('lang', 'sw'); await expect(page.getByRole('heading', { level: 1 })).toContainText('Kitengeneza Logo'); await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kitengeneza-logo/');
  for (const lang of ['en', 'fr', 'sw', 'x-default']) await expect(page.locator(`link[rel=alternate][hreflang="${lang}"]`)).toHaveCount(1); expect(await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)))).toEqual(expect.arrayContaining([expect.objectContaining({ '@type': 'WebApplication', inLanguage: 'sw' })])); await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /logo-maker\.webp$/);
  await page.getByLabel('Biashara yako').focus(); await expect(page.getByLabel('Biashara yako')).toBeFocused(); await page.keyboard.press('Tab'); await expect(page.locator('#fontSelect')).toBeFocused();
  for (const width of [320, 375]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1); }
  await page.setViewportSize({ width: 750, height: 900 }); expect(await page.evaluate(() => { document.body.style.zoom = '2'; return document.documentElement.scrollWidth - document.documentElement.clientWidth; })).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.body.style.zoom = ''; document.documentElement.setAttribute('data-theme', 'dark'); }); expect(await page.locator('.card').first().evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe('rgb(255, 255, 255)'); await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const visible = await page.locator('body').innerText(); for (const leak of ['Logo Settings', 'African Starter Kits', 'Logo Text', 'Background Color', 'Text Only', 'Professional quality']) expect(visible).not.toContain(leak);
  expect(proof.writes).toEqual([]); expect(proof.externalData).toEqual([]); expect(proof.bad).toEqual([]); expect(proof.errors).toEqual([]);
});

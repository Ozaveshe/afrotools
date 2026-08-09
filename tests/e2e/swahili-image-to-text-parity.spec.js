const { test, expect } = require('@playwright/test');

test.setTimeout(240000);
async function bytes(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
function observe(page) {
  const proof = { errors: [], writes: [], external: [], telemetry: [], bad: [] };
  const isTelemetry = url => /^(?:https:\/\/(?:www\.)?google-analytics\.com\/g\/collect|https:\/\/www\.google\.com\/g\/collect|https:\/\/pagead2\.googlesyndication\.com\/measurement\/conversion|https:\/\/www\.googletagmanager\.com\/td)/.test(url);
  page.on('pageerror', error => proof.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') proof.errors.push(message.text()); });
  page.on('request', request => {
    const url = new URL(request.url());
    if (isTelemetry(request.url())) proof.telemetry.push(`${request.method()} ${request.url()}`);
    else {
      if (!['GET', 'HEAD'].includes(request.method())) proof.writes.push(`${request.method()} ${request.url()}`);
      if (!['127.0.0.1', 'localhost'].includes(url.hostname) && ['fetch', 'xhr', 'websocket'].includes(request.resourceType())) proof.external.push(request.url());
    }
    expect(request.postData() || '').not.toContain('AFROTOOLS OCR TEST');
  });
  page.on('response', response => { if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) proof.bad.push(`${response.status()} ${response.url()}`); });
  return proof;
}
async function fixture(page, name = 'private-ocr-fixture.png') {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000; canvas.height = 360;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000'; context.font = 'bold 76px Arial';
    context.fillText('AFROTOOLS OCR TEST', 55, 120);
    context.fillText('TOTAL USD 1250.00', 55, 225);
    context.font = 'bold 58px Arial'; context.fillText('DATE 2026-08-08', 55, 315);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return { name, mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
}
function normalized(value) { return String(value).toUpperCase().replace(/[^A-Z0-9.]+/g, ' ').replace(/\s+/g, ' ').trim(); }
async function download(page, button) {
  const event = page.waitForEvent('download');
  await page.locator(button).click();
  const item = await event;
  return { name: item.suggestedFilename(), value: await bytes(item) };
}
async function runOcr(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#ocrStatus')).toContainText(/Ready|Tayari/);
  const image = await fixture(page);
  await page.locator('#ocrInput').setInputFiles(image);
  await expect(page.locator('#ocrRunBtn')).toBeEnabled();
  await page.locator('#ocrGrayscale').uncheck();
  await page.locator('#ocrContrast').evaluate(node => { node.value = '0'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#ocrThreshold').evaluate(node => { node.value = '0'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#ocrScale').selectOption('1');
  await page.locator('#ocrLanguage').selectOption('eng');
  await page.locator('#ocrView').selectOption('clean');
  await page.locator('#ocrRunBtn').click();
  await expect(page.locator('#ocrRunBtn')).toBeEnabled({ timeout: 180000 });
  await expect(page.locator('#ocrTextArea')).not.toHaveValue('');
  const clean = await page.locator('#ocrTextArea').inputValue();
  expect(normalized(clean)).toContain('AFROTOOLS OCR TEST');
  expect(normalized(clean)).toContain('1250.00');
  const txt = await download(page, '#ocrDownloadTxtBtn');
  expect(txt.name).toMatch(/\.txt$/); expect(txt.value.toString('utf8')).toContain('AFROTOOLS');
  await page.locator('#ocrView').selectOption('markdown');
  const md = await download(page, '#ocrDownloadMdBtn');
  expect(md.name).toMatch(/\.md$/); expect(md.value.toString('utf8')).toContain(route.startsWith('/sw/') ? '# Maelezo ya OCR' : '# OCR Notes');
  const jsonDownload = await download(page, '#ocrDownloadJsonBtn');
  const json = JSON.parse(jsonDownload.value.toString('utf8'));
  expect(json).toMatchObject({ source: 'private-ocr-fixture.png', language: 'eng' });
  expect(normalized(json.rawText)).toContain('AFROTOOLS OCR TEST');
  expect(json.fields).toHaveProperty('amounts');
  const csv = await download(page, '#ocrDownloadCsvBtn');
  expect(csv.value.toString('utf8').split(/\r?\n/)[0]).toBe('type,value');
  await page.locator('#ocrCopyBriefBtn').click();
  const clipboard = await page.evaluate(() => window.__ocrClipboard);
  expect(clipboard).toContain(route.startsWith('/sw/') ? 'Muhtasari wa Studio ya OCR ya Picha' : 'Image to Text OCR Studio handoff');
  return { clean, json, txt: txt.value.toString('utf8') };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', JSON.stringify({ analytics: false, marketing: false, functional: false }));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__ocrClipboard = value; } } });
  });
});

test('real local OCR and every advertised export preserve controlled English/Swahili parity', async ({ page }) => {
  const proof = observe(page);
  const english = await runOcr(page, '/tools/image-to-text/');
  const swahili = await runOcr(page, '/sw/zana/kutoa-maandishi-kwenye-picha/');
  expect(normalized(swahili.clean)).toBe(normalized(english.clean));
  expect(normalized(swahili.txt)).toBe(normalized(english.txt));
  expect(normalized(swahili.json.rawText)).toBe(normalized(english.json.rawText));
  expect(proof.writes).toEqual([]);
  expect(proof.external).toEqual([]);
  expect(proof.bad).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test('queue, invalid input, cleanup reset and local privacy boundary fail closed', async ({ page }) => {
  const proof = observe(page);
  await page.goto('/sw/zana/kutoa-maandishi-kwenye-picha/', { waitUntil: 'domcontentloaded' });
  await page.locator('#ocrInput').setInputFiles({ name: 'siri.txt', mimeType: 'text/plain', buffer: Buffer.from('AFROTOOLS OCR TEST SECRET') });
  await expect(page.locator('#ocrRunBtn')).toBeDisabled();
  await expect(page.locator('#ocrStatus')).toContainText('Chagua');
  const one = await fixture(page, 'one.png'); const two = await fixture(page, 'two.png');
  await page.locator('#ocrInput').setInputFiles([one, two]);
  await expect(page.locator('#ocrQueue .ocr-queue-item')).toHaveCount(2);
  await expect(page.locator('#ocrBatchBtn')).toBeEnabled();
  await page.locator('#ocrContrast').evaluate(node => { node.value = '70'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#ocrResetImageBtn').click();
  await expect(page.locator('#ocrContrast')).toHaveValue('34');
  const storage = await page.evaluate(() => JSON.stringify(localStorage));
  expect(storage).not.toContain('AFROTOOLS OCR TEST');
  expect(storage).not.toContain('data:image');
  expect(await page.evaluate(() => location.search)).toBe('');
  expect(proof.writes).toEqual([]); expect(proof.external).toEqual([]); expect(proof.bad).toEqual([]); expect(proof.errors).toEqual([]);
});

test('native UI passes mobile, true 200% reflow, themes, keyboard, a11y and SEO contracts', async ({ page }) => {
  const proof = observe(page);
  await page.goto('/sw/zana/kutoa-maandishi-kwenye-picha/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('maandishi yanayoharirika');
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kutoa-maandishi-kwenye-picha/');
  for (const lang of ['en', 'fr', 'sw', 'x-default']) await expect(page.locator(`link[rel=alternate][hreflang="${lang}"]`)).toHaveCount(1);
  expect(await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)))).toEqual(expect.arrayContaining([expect.objectContaining({ '@type': 'WebApplication', inLanguage: 'sw' })]));
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /image-to-text\.webp$/);
  await expect(page.getByLabel('Chagua, bandika au dondosha picha kwa OCR')).toBeVisible();
  await page.getByLabel('Chagua, bandika au dondosha picha kwa OCR').focus();
  await expect(page.getByLabel('Chagua, bandika au dondosha picha kwa OCR')).toBeFocused();
  await expect(page.locator('#ocrStatus')).toHaveAttribute('aria-live', 'polite');
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => ({ delta: document.documentElement.scrollWidth - document.documentElement.clientWidth, bad: [...document.querySelectorAll('body *')].filter(node => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && getComputedStyle(node).position !== 'fixed').slice(0, 5).map(node => `${node.tagName}#${node.id}.${node.className}`) }))).toEqual({ delta: 0, bad: [] });
  }
  await page.setViewportSize({ width: 750, height: 900 });
  expect(await page.evaluate(() => { document.body.style.zoom = '2'; return document.documentElement.scrollWidth - document.documentElement.clientWidth; })).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.body.style.zoom = ''; document.documentElement.setAttribute('data-theme', 'dark'); });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const visible = await page.locator('body').innerText();
  for (const leak of ['Loading editor', 'Choose images', 'Process queue', 'Result summary', 'Session history']) expect(visible).not.toContain(leak);
  expect(proof.writes).toEqual([]); expect(proof.external).toEqual([]); expect(proof.bad).toEqual([]); expect(proof.errors).toEqual([]);
});

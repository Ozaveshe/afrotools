const { test, expect } = require('@playwright/test');

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

function pngDimensions(value) {
  expect(value.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return { width: value.readUInt32BE(16), height: value.readUInt32BE(20) };
}

test('shared payload engine preserves exact text, WiFi and vCard semantics in both locales', async ({ page }) => {
  for (const route of ['/tools/qr-generator/', '/sw/zana/kitengeneza-qr/']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const results = await page.evaluate(() => ({
      text: window.AfroTools.QrPayload.buildPayload({ mode: 'text', text: 'Habari Afrika' }),
      wifi: window.AfroTools.QrPayload.buildPayload({ mode: 'wifi', ssid: 'Duka:Kuu', password: 'siri;1234', security: 'WPA' }),
      vcard: window.AfroTools.QrPayload.buildPayload({ mode: 'vcard', name: 'Amina; Njeri', phone: '+254700000000', email: 'amina@example.test', org: 'Soko, Ltd' })
    }));
    expect(results).toEqual({
      text: { ok: true, data: 'Habari Afrika' },
      wifi: { ok: true, data: 'WIFI:T:WPA;S:Duka\\:Kuu;P:siri\\;1234;;' },
      vcard: { ok: true, data: 'BEGIN:VCARD\nVERSION:3.0\nFN:Amina\\; Njeri\nTEL:+254700000000\nEMAIL:amina@example.test\nORG:Soko\\, Ltd\nEND:VCARD' }
    });
    await page.locator('[data-mode="text"]').click();
    await page.locator('#textInput').fill('Habari Afrika');
    await page.locator('#generateBtn').click();
    await expect(page.locator('#qrcode canvas')).toHaveJSProperty('width', 256);
    const pngEvent = page.waitForEvent('download');
    await page.locator('#downloadPNG').click();
    const png = await pngEvent;
    expect(png.suggestedFilename()).toBe(route.startsWith('/sw/') ? 'maandishi-qr.png' : 'text-qr.png');
    expect(pngDimensions(await buffer(png))).toEqual({ width: 256, height: 256 });
    const svgEvent = page.waitForEvent('download');
    await page.locator('#downloadSVG').click();
    const svg = await svgEvent;
    expect(svg.suggestedFilename()).toBe(route.startsWith('/sw/') ? 'maandishi-qr.svg' : 'text-qr.svg');
    expect((await buffer(svg)).toString('utf8')).toMatch(/width="1024" height="1024"/);
  }
});

test('Swahili owner validates stale state and reopens exact PNG and SVG exports', async ({ page }) => {
  const proof = observe(page);
  await page.goto('/sw/zana/kitengeneza-qr/', { waitUntil: 'domcontentloaded' });
  await page.locator('#generateBtn').click();
  await expect(page.locator('#qrStatus')).toContainText('Jaza sehemu zote');
  await expect(page.locator('#downloadPNG')).toBeDisabled();

  await page.getByRole('button', { name: 'WiFi', exact: true }).click();
  await page.locator('#wifiSSID').fill('Duka:Kuu');
  await page.locator('#wifiPassword').fill('fupi');
  await page.locator('#generateBtn').click();
  await expect(page.locator('#qrStatus')).toContainText('herufi 8 hadi 63');
  await expect(page.locator('#qrcode canvas')).toHaveCount(0);

  await page.locator('#wifiPassword').fill('siri;1234');
  await page.locator('#darkColor').fill('#112233');
  await page.locator('#lightColor').fill('#fefefe');
  await page.locator('#generateBtn').click();
  await expect(page.locator('#qrcode canvas')).toHaveCount(1);
  await expect(page.locator('#qrcode canvas')).toHaveJSProperty('width', 256);
  await expect(page.locator('#qrcode canvas')).toHaveJSProperty('height', 256);

  await page.locator('#wifiPassword').fill('fupi');
  await page.locator('#generateBtn').click();
  await expect(page.locator('#qrcode canvas')).toHaveCount(0);
  await expect(page.locator('#downloadPNG')).toBeDisabled();
  await page.locator('#wifiPassword').fill('siri;1234');
  await page.locator('#generateBtn').click();
  await expect(page.locator('#qrcode canvas')).toHaveCount(1);

  const pngEvent = page.waitForEvent('download');
  await page.locator('#downloadPNG').click();
  const png = await pngEvent;
  expect(png.suggestedFilename()).toBe('wifi-qr.png');
  expect(pngDimensions(await buffer(png))).toEqual({ width: 256, height: 256 });

  const svgEvent = page.waitForEvent('download');
  await page.locator('#downloadSVG').click();
  const svg = await svgEvent;
  expect(svg.suggestedFilename()).toBe('wifi-qr.svg');
  const svgText = (await buffer(svg)).toString('utf8');
  expect(svgText).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+" width="1024" height="1024"/);
  expect(svgText).toContain('fill="#112233"');
  expect(svgText).toContain('fill="#fefefe"');
  expect((svgText.match(/M\d+ \d+h1v1h-1z/g) || []).length).toBeGreaterThan(100);

  await page.locator('#resetBtn').click();
  await expect(page.locator('#qrcode canvas')).toHaveCount(0);
  await expect(page.locator('#downloadPNG')).toBeDisabled();
  await expect(page.locator('#qrStatus')).toContainText('imewekwa upya');
  expect(proof.writes).toEqual([]);
  expect(proof.data).toEqual([]);
  expect(proof.badResources).toEqual([]);
  expect(proof.errors).toEqual([]);
});

test('Swahili QR route reflows, supports keyboard/theme and has complete localized SEO', async ({ page }) => {
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sw/zana/kitengeneza-qr/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kitengeneza-qr/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/qr-generator/');
  await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kitengeneza-qr/');
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.map(JSON.parse).some(value => value.inLanguage === 'sw')).toBe(true);
  await page.getByRole('button', { name: 'Maandishi', exact: true }).focus();
  await expect(page.getByRole('button', { name: 'Maandishi', exact: true })).toBeFocused();
  const lightBackground = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  const darkBackground = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
  expect(darkBackground).not.toBe(lightBackground);
  await expect(page.locator('#qrStatus')).toHaveAttribute('role', 'status');
  expect(await page.locator('iframe').count()).toBe(0);
});

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const manifest = require('../../data/localization/sw-education-affordability-parity.json');
const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173').origin;

test.describe.configure({ mode: 'serial' });

for (const app of manifest.apps) {
  test(`${app.id}: native workflow, exports, privacy and responsive UI`, async ({ page }, testInfo) => {
    const errors = [];
    const outbound = [];
    const privateMarker = app.id === 'ke-helb' ? '123456.78' : 'XTS';
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (new URL(request.url()).origin !== localOrigin) outbound.push(request.url()); });
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(`/sw/zana/${app.slug}/`, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('h1')).toHaveText(app.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com/sw/zana/${app.slug}/`);
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${app.english}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `https://afrotools.com/assets/img/tools/${app.image}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
    if (app.id === 'ke-helb') await page.locator('[name="balance"]').fill(privateMarker);
    else await page.locator('[name="currency"]').fill(privateMarker);
    await page.getByRole('button', { name: 'Kokotoa' }).click();
    await expect(page.locator('#swEduResult')).toBeVisible();
    await expect(page.locator('.metric')).toHaveCount(app.metrics.length);
    await expect(page.locator('#swEduStatus')).toContainText('Hesabu imekamilika');

    const jsonPending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Pakua JSON' }).click();
    const jsonDownload = await jsonPending;
    const jsonPath = await jsonDownload.path();
    const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    expect(parsed.app).toBe(app.id); expect(Object.keys(parsed.matokeo)).toEqual(app.metrics.map(metric => metric[0]));

    const txtPending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Pakua TXT' }).click();
    const txtPath = await (await txtPending).path();
    const text = fs.readFileSync(txtPath, 'utf8');
    expect(text).toContain(app.title); expect(text).toContain('Matokeo:'); expect(text).toContain('makadirio ya kupanga');

    const pdfPending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Pakua PDF' }).click();
    const pdfPath = await (await pdfPending).path();
    const pdfBuffer = fs.readFileSync(pdfPath);
    expect(pdfBuffer.subarray(0, 5).toString()).toBe('%PDF-');
    const parsedPdf = await pdfParse(pdfBuffer);
    expect(parsedPdf.text).toContain('Matokeo:');

    await page.getByRole('button', { name: 'Mandhari nyeusi' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('input[type="number"]').first().fill('');
    await page.getByRole('button', { name: 'Kokotoa' }).click();
    await expect(page.locator('#swEduError')).not.toBeEmpty();
    await expect(page.locator('#swEduResult')).toBeHidden();
    await page.getByRole('button', { name: 'Futa' }).click();
    await expect(page.locator('#swEduError')).toBeEmpty();
    await page.setViewportSize({ width: 375, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.setViewportSize({ width: 640, height: 800 });
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
    expect(outbound.some(url => decodeURIComponent(url).includes(privateMarker))).toBe(false);
    expect(outbound.filter(url => /(?:openai|anthropic|supabase)|\/api\//i.test(url))).toEqual([]);
    await testInfo.attach(`${app.id}-320-dark`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });
}

for (const hub of ['/sw/elimu/', '/sw/zana-za-elimu/']) {
  test(`${hub}: discovers the exact eight-app family without mobile overflow`, async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(hub, { waitUntil: 'networkidle' });
    for (const app of manifest.apps) await expect(page.locator(`a[href="/sw/zana/${app.slug}/"]`).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

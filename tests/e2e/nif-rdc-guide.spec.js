const { test, expect } = require('@playwright/test');
const fs = require('fs');
const route = '/fr/tools/guide-nif/dr-congo/';

for (const width of [375, 1280]) {
  test(`RDC NIF preparation stays local and exports checked steps at ${width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    const writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') writes.push(request.method()); });
    await page.route('**/*', request => new URL(request.request().url()).origin === new URL(baseURL).origin ? request.continue() : request.abort());
    await page.goto(route, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('NIF en RDC : préparer votre demande');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${route}`);
    await expect(page.getByRole('link', { name: 'Ouvrir le portail officiel e-NIF' })).toHaveAttribute('href', 'https://e-nif.dgirdc.cd/');
    await expect(page.getByRole('checkbox')).toHaveCount(4);
    await page.getByRole('checkbox').first().focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('status')).toHaveText('1 repère préparé sur 4.');
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger ma liste TXT' }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe('preparation-nif-rdc.txt');
    const content = fs.readFileSync(await download.path(), 'utf8');
    expect(content).toContain('[x] J’ai identifié le portail ou le service fiscal compétent.');
    expect(content).toContain('[ ] J’ai demandé les pièces adaptées à ma situation.');
    expect(content).toContain('ne vaut ni demande, ni attestation, ni validation');
    expect(content).toContain('https://e-nif.dgirdc.cd/');
    await page.evaluate(() => { window.__nifPrintCalled = false; window.print = () => { window.__nifPrintCalled = true; }; });
    await page.getByRole('button', { name: 'Imprimer la page' }).click();
    expect(await page.evaluate(() => window.__nifPrintCalled)).toBe(true);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('afro-navbar')).toBeHidden();
    await expect(page.locator('afro-footer')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Sources et limites' })).toBeVisible();
    await page.emulateMedia({ media: 'screen' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('checkbox').first()).not.toBeChecked();
  });
}

test('RDC NIF guidance and official links remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}${route}`);
  await expect(page.getByRole('heading', { name: 'Comment demander un NIF en RDC ?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ouvrir le portail officiel e-NIF' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Télécharger ma liste TXT' })).toBeHidden();
  await context.close();
});

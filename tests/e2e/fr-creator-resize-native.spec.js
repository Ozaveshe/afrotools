const { test, expect } = require('@playwright/test');
const path = require('node:path');

const JSZip = require(path.join(process.cwd(), 'assets/vendor/jszip/jszip.min.js'));

const routes = [
  {
    locale: 'en',
    path: '/tools/creator-resize/app.html',
    drop: 'Drop your image here',
    focal: 'Focal point:',
    square: 'IG Square',
    downloaded: 'Downloaded',
    all: 'All social',
    custom: 'Custom selection'
  },
  {
    locale: 'fr',
    path: '/fr/tools/redimensionnement-pour-createur/app.html',
    drop: 'Déposez votre image ici',
    focal: 'Point focal :',
    square: 'Carré Instagram',
    downloaded: 'téléchargé',
    all: 'Tous les réseaux',
    custom: 'Sélection personnalisée'
  }
];

function pngDimensions(buffer) {
  expect(buffer.subarray(1, 4).toString('ascii')).toBe('PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

async function syntheticPng(page) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 100;
    const context = canvas.getContext('2d');
    context.fillStyle = '#0d9488';
    context.fillRect(0, 0, 160, 100);
    context.fillStyle = '#f59e0b';
    context.fillRect(80, 0, 80, 100);
    context.fillStyle = '#ffffff';
    context.font = 'bold 24px sans-serif';
    context.fillText('AFRO', 45, 58);
    return canvas.toDataURL('image/png');
  });
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function assertNoOverflow(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
}

for (const route of routes) {
  test(`${route.locale} CreatorResize creates and reopens PNG and ZIP exports`, async ({ page }) => {
    test.setTimeout(300000);
    const externalRequests = [];
    const pageErrors = [];
    const consoleErrors = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.addInitScript(() => {
      localStorage.setItem('afrotools_cookie_consent', 'declined');
      localStorage.setItem('aft_theme', 'light');
      localStorage.removeItem('crz-preset');
      localStorage.removeItem('crz-fill-mode');
    });
    await page.goto(route.path);
    await expect(page.locator('html')).toHaveAttribute('lang', route.locale);
    await expect(page.getByText(route.drop, { exact: true })).toBeVisible();
    await expect(page.locator('#crzDropZone')).toHaveAttribute('tabindex', '0');

    const input = page.locator('#crzFileInput');
    await input.setInputFiles({
      name: 'synthetic-afro.png',
      mimeType: 'image/png',
      buffer: await syntheticPng(page)
    });
    await expect(page.locator('#crzEditor')).toBeVisible();
    await expect(page.locator('.crz-size-card')).toHaveCount(12);
    await expect(page.locator('.crz-size-name').first()).toHaveText(route.square);
    await expect(page.locator('#crzFocalLabel')).toContainText(route.focal);

    await page.locator('#crzOriginalImg').click({ position: { x: 120, y: 40 } });
    await expect(page.locator('#crzFocalLabel')).not.toContainText('50%, 50%');

    await page.getByRole('button', { name: route.custom, exact: true }).click();
    await page.locator('.crz-size-toggle').first().click();
    await expect(page.locator('.crz-size-card.active')).toHaveCount(11);
    await page.getByRole('button', { name: route.all, exact: true }).click();
    await expect(page.locator('.crz-size-card.active')).toHaveCount(12);

    const firstCard = page.locator('.crz-size-card').first();
    await firstCard.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#crzModal')).toHaveClass(/open/);
    await expect(page.locator('#crzModalLabel')).toHaveText(route.square);
    await page.keyboard.press('Escape');
    await expect(page.locator('#crzModal')).not.toHaveClass(/open/);
    await expect(firstCard).toBeFocused();

    const pngDownloadPromise = page.waitForEvent('download');
    await page.locator('.crz-size-dl').first().click();
    const pngDownload = await pngDownloadPromise;
    const pngBuffer = await require('node:fs/promises').readFile(await pngDownload.path());
    expect(pngDownload.suggestedFilename()).toBe('instagram-square.png');
    expect(pngDimensions(pngBuffer)).toEqual({ width: 1080, height: 1080 });
    await expect(page.locator('#crzToast')).toContainText(route.downloaded);

    const zipDownloadPromise = page.waitForEvent('download');
    await page.locator('#crzDownloadAll').click();
    const zipDownload = await zipDownloadPromise;
    const zipBuffer = await require('node:fs/promises').readFile(await zipDownload.path());
    expect(zipDownload.suggestedFilename()).toBe('synthetic-afro-all-sizes.zip');
    const zip = await JSZip.loadAsync(zipBuffer);
    const pngEntries = Object.values(zip.files).filter((entry) => !entry.dir && entry.name.endsWith('.png'));
    expect(pngEntries).toHaveLength(12);
    const squareEntry = pngEntries.find((entry) => entry.name.endsWith('/instagram-square.png'));
    expect(squareEntry).toBeTruthy();
    expect(pngDimensions(await squareEntry.async('nodebuffer'))).toEqual({ width: 1080, height: 1080 });

    await assertNoOverflow(page, 320);
    await assertNoOverflow(page, 375);
    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    await page.evaluate(() => {
      document.documentElement.style.zoom = '';
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    const darkBackground = await page.locator('#crzApp').evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const lightBackground = await page.locator('#crzApp').evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(darkBackground).not.toBe(lightBackground);

    expect(externalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test('French CreatorResize launcher is native, indexed, reciprocal and responsive', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('aft_theme', 'light');
  });
  await page.goto('/fr/tools/redimensionnement-pour-createur/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Une image, douze formats sociaux');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/redimensionnement-pour-createur/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/creator-resize/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/creator-resize.webp');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Redimensionner mon image' })).toHaveAttribute('href', '/fr/tools/redimensionnement-pour-createur/app');
  await assertNoOverflow(page, 320);
  await assertNoOverflow(page, 375);
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  expect(pageErrors).toEqual([]);
});

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/localization/fr-religious-cultural-parity.json'), 'utf8'));
const TEST_ORIGIN = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

test.describe.configure({ mode: 'serial' });

async function blockExternalTraffic(page, interactionRequests) {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === TEST_ORIGIN || ['data:', 'blob:'].includes(url.protocol)) {
      if (interactionRequests.active) interactionRequests.urls.push(request.url());
      return route.continue();
    }
    if (interactionRequests.active) interactionRequests.urls.push(request.url());
    else interactionRequests.loadUrls.push(request.url());
    if (/^https:\/\/cdn\.jsdelivr\.net\/gh\/twitter\/twemoji@14\.0\.2\/assets\/svg\/1f1f3-1f1ec\.svg$/.test(request.url())) {
      return route.continue();
    }
    return route.abort();
  });
}

for (const [index, tool] of manifest.tools.entries()) {
  test(`${index + 1}/22 ${tool.sourceId}: native French workflow, invalid state, keyboard, dark mode and reopened export`, async ({ page }) => {
    const width = index % 2 === 0 ? 320 : 375;
    await page.setViewportSize({ width, height: 900 });
    const consoleErrors = [];
    const pageErrors = [];
    const requests = { active: false, urls: [], loadUrls: [] };
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await blockExternalTraffic(page, requests);

    await page.goto(tool.route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toHaveText(tool.title);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Ouvrir le calculateur complet');
    const visibleText = await page.locator('body').innerText();
    expect(visibleText).not.toMatch(/\b(?:Calculate|Reset|Download|Copy|Results?|All Tools|Open the full calculator)\b/);
    await expect(page.locator('#fr-rc-output')).toBeVisible();
    await expect(page.locator('#fr-rc-status')).toContainText('calculé localement');
    await expect(page.locator('meta[name="afrotools-ai-mode"]')).toHaveAttribute('content', 'deterministic-local');

    const initialOverflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - document.body.clientWidth,
      main: document.getElementById('fr-rc-main').scrollWidth - document.getElementById('fr-rc-main').clientWidth
    }));
    expect(initialOverflow.body).toBeLessThanOrEqual(1);
    expect(initialOverflow.main).toBeLessThanOrEqual(1);

    await page.evaluate(() => window.AfroTools.darkMode.set('dark'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const darkBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(darkBackground).not.toBe('rgb(255, 255, 255)');

    const invalidControl = page.locator('#fr-rc-form input[required], #fr-rc-form textarea[required]').first();
    await invalidControl.fill('');
    await page.locator('#fr-rc-calculate').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#fr-rc-status')).toHaveAttribute('data-state', 'error');
    await expect(page.locator('#fr-rc-output')).toBeHidden();
    await expect(invalidControl).toBeFocused();

    await page.locator('#fr-rc-reset').click();
    await expect(page.locator('#fr-rc-output')).toBeVisible();
    await page.locator('#fr-rc-calculate').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#fr-rc-output')).toBeVisible();
    const resultText = await page.locator('#fr-rc-output').innerText();
    expect(resultText).not.toMatch(/(?:^|\s)(?:NaN|undefined|null)(?:\s|$)/i);

    requests.active = true;
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#fr-rc-download').click();
    const download = await downloadPromise;
    const downloadedPath = await download.path();
    const payload = JSON.parse(fs.readFileSync(downloadedPath, 'utf8'));
    expect(payload.locale).toBe('fr');
    expect(payload.tool).toBe(tool.sourceId);
    expect(payload.route).toBe(tool.route);
    expect(payload.result).toBeTruthy();
    expect(payload.privacy).toContain('localement');
    expect(payload.boundary).toBe(tool.boundary);
    expect(requests.urls.filter((url) => !url.startsWith(TEST_ORIGIN) && !url.startsWith('blob:') && !url.startsWith('data:'))).toEqual([]);
    requests.active = false;

    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const reflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - document.body.clientWidth,
      main: document.getElementById('fr-rc-main').scrollWidth - document.getElementById('fr-rc-main').clientWidth
    }));
    expect(reflow.body).toBeLessThanOrEqual(1);
    expect(reflow.main).toBeLessThanOrEqual(1);

    expect(pageErrors).toEqual([]);
    expect(requests.loadUrls.every((url) => /^https:\/\/cdn\.jsdelivr\.net\/gh\/twitter\/twemoji@14\.0\.2\/assets\/svg\/1f1f3-1f1ec\.svg$/.test(url))).toBe(true);
    expect(consoleErrors.filter((message) => !/favicon|Failed to load resource: net::ERR_FAILED/i.test(message))).toEqual([]);
  });
}

test('French Religious & Cultural hub exposes exactly 22 native routes with system dark mode and keyboard focus', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(manifest.hub.route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.fr-rc-tool-link')).toHaveCount(22);
  await expect(page.locator('.fr-rc-tool-link').first()).toHaveAttribute('href', manifest.tools[0].route);
  await page.locator('.fr-rc-tool-link').first().focus();
  await expect(page.locator('.fr-rc-tool-link').first()).toBeFocused();
  const overflow = await page.evaluate(() => document.body.scrollWidth - document.body.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

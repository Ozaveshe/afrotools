const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const evidenceDir = path.resolve(__dirname, '../../artifacts/day5-language-external-lane-a/evidence');
const routes = [
  { slug: 'swahili-translator', count: 194, query: 'Where is the airport?', target: 'Uwanja wa ndege uko wapi?' },
  { slug: 'yoruba-translator', count: 175, query: 'Cough', target: 'Ikọ́' },
  { slug: 'hausa-translator', count: 131, query: 'ATM / cash machine', target: 'Injin cire kuɗi / ATM' },
  { slug: 'igbo-translator', count: 129, query: 'Loan', target: 'Mgbazinye ego' },
];

fs.mkdirSync(evidenceDir, { recursive: true });

for (const route of routes) {
  test(`${route.slug} local-first VIP flow, privacy, exports, and responsive evidence`, async ({ page }) => {
    const cloudRequests = [];
    const networkRequests = [];
    page.on('request', (request) => {
      networkRequests.push({ url: request.url(), body: request.postData() || '' });
    });
    await page.route('**/api/translate', async (handler) => {
      cloudRequests.push(handler.request().postDataJSON());
      await handler.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
        body: JSON.stringify({
          translatedText: route.target,
          provider: 'review-fixture',
          unchanged: true,
          fallbackUsed: false,
        }),
      });
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(`/tools/${route.slug}/`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[data-vip-inventory]')).toHaveText(String(route.count));
    await expect(page.getByLabel(new RegExp(`Search English or`, 'i'))).toBeVisible();
    const search = page.locator('#search');
    if (route.slug === 'swahili-translator') {
      await expect(page.locator('[data-df-upgrade], [data-df-form], .df-faq')).toHaveCount(0);
      const allCategory = page.getByRole('button', { name: 'All', exact: true });
      const travelCategory = page.getByRole('button', { name: 'Travel', exact: true });
      await expect(allCategory).toHaveAttribute('aria-pressed', 'true');
      await travelCategory.click();
      await expect(travelCategory).toHaveAttribute('aria-pressed', 'true');
      await expect(allCategory).toHaveAttribute('aria-pressed', 'false');
      await allCategory.click();
      const listenNames = await page.locator('.speak-btn').evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));
      expect(listenNames).toHaveLength(route.count);
      expect(new Set(listenNames).size).toBeGreaterThan(180);
      expect(listenNames.every((name) => /^Listen to .+ in Swahili$/.test(name || ''))).toBe(true);
      await search.fill('High blood pressure');
      await expect(page.locator('#phrases')).toContainText('Shinikizo la juu la damu');
      await search.fill('Do you have this?');
      await expect(page.locator('#phrases .verification-note')).toContainText('noun class');
      await page.locator('#swahiliMeaningSelect').selectOption('sorry');
      await expect(page.locator('#swahiliMeaningOutput')).toContainText('Samahani');
    }
    await page.screenshot({ path: path.join(evidenceDir, `${route.slug}-desktop-light.png`), fullPage: true });

    await search.fill(route.query);
    await expect(page.locator('#phrases')).toContainText(route.target);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#downloadPhrasebookTxt').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`${route.slug}-phrasebook.txt`);
    await expect(page.locator('#vipExportStatus')).toContainText('prepared locally');
    await page.evaluate(() => {
      window.__swahiliPrintCalls = 0;
      window.print = () => { window.__swahiliPrintCalls += 1; };
    });
    await page.locator('#printPhrasebookPdf').click();
    expect(await page.evaluate(() => window.__swahiliPrintCalls)).toBe(1);
    await expect(page.locator('#vipExportStatus')).toContainText('print dialog');

    const raw = `Private synthetic fixture ${route.slug}`;
    await page.locator('#translateInput').fill(raw);
    await page.locator('#translateInput').press('Enter');
    expect(cloudRequests).toHaveLength(0);
    expect(networkRequests.filter((request) => (request.url + request.body).includes(raw))).toHaveLength(0);
    await expect(page.locator('[data-external-translation-status]')).toContainText('opt in');

    await page.locator('[data-external-translation-accept]').check();
    await page.locator('#translateBtn').click();
    await expect.poll(() => cloudRequests.length).toBe(1);
    await expect(page.locator('#translateOutput')).toHaveText(route.target);
    await expect(page.locator('#translateStatus')).toContainText('unchanged');
    expect(cloudRequests[0].allowFallback).toBe(false);
    const rawNetworkRequests = networkRequests.filter((request) => (request.url + request.body).includes(raw));
    expect(rawNetworkRequests).toHaveLength(1);
    expect(rawNetworkRequests[0].url).toContain('/api/translate');

    const persisted = await page.evaluate((values) => ({
      local: Object.keys(localStorage).some((key) => values.some((value) => String(localStorage.getItem(key)).includes(value))),
      session: Object.keys(sessionStorage).some((key) => values.some((value) => String(sessionStorage.getItem(key)).includes(value))),
      url: values.some((value) => location.href.includes(value) || location.href.includes(encodeURIComponent(value))),
    }), [raw, route.target]);
    expect(persisted).toEqual({ local: false, session: false, url: false });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-external-translation-accept]')).not.toBeChecked();
    await expect(page.locator('#translateBtn')).toBeDisabled();

    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(`/tools/${route.slug}/`, { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: path.join(evidenceDir, `${route.slug}-mobile-dark-375.png`), fullPage: true });

    await page.setViewportSize({ width: 320, height: 700 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator('#downloadPhrasebookTxt')).toBeVisible();
    await page.keyboard.press('Tab');
    const focusVisible = await page.evaluate(() => document.activeElement !== document.body);
    expect(focusVisible).toBe(true);
  });
}

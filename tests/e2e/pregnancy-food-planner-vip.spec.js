const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

test.describe('pregnancy food variety planner VIP', () => {
  test('builds a non-prescriptive local discussion card and exports its contents', async ({ page }) => {
    const requests = [];
    const consoleErrors = [];
    const pageErrors = [];
    page.on('request', (request) => requests.push(request.url()));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('/tools/pregnancy-nutrition/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pregnancy food variety planner');
    await page.getByLabel(/Vegetables/).check();
    await page.getByLabel(/Staples or whole grains/).check();
    await page.getByLabel(/Beans, peas, nuts or seeds/).check();
    await page.getByLabel(/Safe water and clean/).check();
    await page.getByLabel(/Wash fruit and vegetables/).check();
    await page.getByLabel(/Plan no alcohol/).check();
    await page.getByLabel('Supplement conversation').selectOption('provider-plan');
    await page.getByRole('button', { name: 'Build discussion card' }).click();

    await expect(page.locator('#selected-groups')).toContainText('Vegetables');
    await expect(page.locator('#selected-groups')).toContainText('Beans, peas, nuts or seeds');
    await expect(page.locator('#variety-questions')).toContainText('washed local fruit');
    await expect(page.locator('#safety-questions')).toContainText('animal foods will be cooked thoroughly');
    await expect(page.locator('#pregnancy-food-results')).toContainText('Not a nutrition assessment');

    const txtPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const txt = fs.readFileSync(await (await txtPromise).path(), 'utf8');
    expect(txt).toContain('AFROTOOLS PREGNANCY FOOD VARIETY DISCUSSION CARD');
    expect(txt).toContain('Food groups selected:');
    expect(txt).toContain('This card does not assess adequacy, prescribe food or supplements');
    expect(txt).toContain('Sources checked: 26 July 2026');
    expect(txt).toContain('No account, email, upload, analytics or saved browser record');

    const pdfPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const pdf = fs.readFileSync(await (await pdfPromise).path());
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    const pdfText = (await pdfParse(pdf)).text;
    expect(pdfText).toContain('AFROTOOLS PREGNANCY FOOD VARIETY DISCUSSION CARD');
    expect(pdfText).toContain('This card does not assess adequacy');
    expect(pdfText).toContain('No account, email, upload, analytics or saved browser record');

    expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /pregnan|food|nutri|supplement/i.test(key)))).toEqual([]);
    expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => /pregnan|food|nutri|supplement/i.test(key)))).toEqual([]);
    expect(await page.evaluate(async () => {
      if (!indexedDB.databases) return [];
      return (await indexedDB.databases())
        .map((database) => database.name || '')
        .filter((name) => /pregnan|food|nutri|supplement/i.test(name));
    })).toEqual([]);
    expect(requests.filter((url) => /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|\/api\//i.test(url))).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('passes keyboard, 320px dark and 200% text, then captures 375px evidence', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/pregnancy-nutrition/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(13, 21, 18)');
    const contrast = await page.locator('.pnv-card').first().evaluate((element) => {
      function rgb(value) {
        const parts = value.match(/\d+(?:\.\d+)?/g).slice(0, 3).map(Number);
        return parts.map((channel) => {
          channel /= 255;
          return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
        });
      }
      function luminance(channels) {
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      }
      const style = getComputedStyle(element);
      const foreground = luminance(rgb(style.color));
      const background = luminance(rgb(style.backgroundColor));
      return (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    await page.getByLabel(/Vegetables/).focus();
    await expect(page.getByLabel(/Vegetables/)).toBeFocused();
    expect(await page.evaluate(() => window.AfroPregnancyFoodPlanner.getOverflowDetails())).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.getByLabel(/Vegetables/).check();
    await page.getByLabel(/Staples or whole grains/).check();
    await page.getByRole('button', { name: 'Build discussion card' }).click();
    await expect(page.locator('#results-title')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.evaluate(() => window.AfroPregnancyFoodPlanner.getOverflowDetails())).toEqual([]);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.screenshot({
      path: path.join(evidenceDir, 'route-12-pregnancy-food-mobile-dark-375.png'),
      fullPage: true
    });
  });

  test('captures desktop light evidence', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/tools/pregnancy-nutrition/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/Vegetables/).check();
    await page.getByLabel(/Fruit/).check();
    await page.getByLabel(/Staples or whole grains/).check();
    await page.getByLabel(/Beans, peas, nuts or seeds/).check();
    await page.getByLabel(/Safe water and clean/).check();
    await page.getByLabel(/Wash fruit and vegetables/).check();
    await page.getByLabel(/Plan no alcohol/).check();
    await page.getByRole('button', { name: 'Build discussion card' }).click();
    await page.screenshot({
      path: path.join(evidenceDir, 'route-12-pregnancy-food-desktop-light.png'),
      fullPage: true
    });
  });
});

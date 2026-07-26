const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

test.describe('pregnancy date range estimator VIP', () => {
  test('calculates LMP and IVF ranges and exports parsed local files', async ({ page }) => {
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/tools/due-date/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pregnancy date range estimator');
    await page.getByLabel('First day of your last menstrual period').fill('2026-01-01');
    await page.getByLabel('Usual cycle length in days').fill('28');
    await page.getByRole('button', { name: 'Estimate date range' }).click();
    await expect(page.locator('#estimated-due-date')).toHaveText('8 October 2026');
    await expect(page.locator('#week-37-date')).toHaveText('17 September 2026');
    await expect(page.locator('#week-42-date')).toHaveText('22 October 2026');

    const txtPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const txt = fs.readFileSync(await (await txtPromise).path(), 'utf8');
    expect(txt).toContain('Conventional estimated due date: 8 October 2026');
    expect(txt).toContain('not confirmation of pregnancy');
    expect(txt).toContain('Sources checked: 26 July 2026');
    expect(txt).toContain('No account, email, upload, analytics or saved browser record');

    const pdfPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const pdf = fs.readFileSync(await (await pdfPromise).path());
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    const pdfText = (await pdfParse(pdf)).text;
    expect(pdfText).toContain('AFROTOOLS PREGNANCY DATE RANGE ESTIMATE');
    expect(pdfText).toContain('Conventional estimated due date: 8 October 2026');
    expect(pdfText).toContain('No account, email, upload, analytics or saved browser record');

    await page.getByLabel('Documented embryo transfer').check();
    await page.getByLabel('Embryo transfer date from your fertility clinic').fill('2026-02-01');
    await page.getByLabel('Embryo age at transfer').selectOption('5');
    await page.getByRole('button', { name: 'Estimate date range' }).click();
    await expect(page.locator('#estimated-due-date')).toHaveText('20 October 2026');
    await expect(page.locator('#method-summary')).toContainText('ACOG 261-day offset');

    expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /due|pregnan/i.test(key)))).toEqual([]);
    expect(requests.filter((url) => /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|\/api\//i.test(url))).toEqual([]);
  });

  test('clears stale results on method changes and invalid submissions', async ({ page }) => {
    await page.goto('/tools/due-date/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('First day of your last menstrual period').fill('2026-01-01');
    await page.getByRole('button', { name: 'Estimate date range' }).click();
    await expect(page.locator('#date-range-results')).toBeVisible();

    await page.getByLabel('Documented embryo transfer').check();
    await expect(page.locator('#date-range-results')).toBeHidden();
    expect(await page.evaluate(() => window.AfroDueDateRange.getResult())).toBeNull();

    await page.getByLabel('Last menstrual period (LMP)').check();
    await page.getByLabel('First day of your last menstrual period').fill('2026-01-01');
    await page.getByLabel('Usual cycle length in days').fill('20');
    await page.getByRole('button', { name: 'Estimate date range' }).click();
    await expect(page.locator('#date-range-results')).toBeHidden();
    await expect(page.getByLabel('Usual cycle length in days')).toBeFocused();
    expect(await page.evaluate(() => window.AfroDueDateRange.getResult())).toBeNull();
    await expect(page.locator('#form-error')).toContainText('21 to 35 days');

    await page.getByLabel('Documented embryo transfer').check();
    await page.getByLabel('Embryo transfer date from your fertility clinic').fill('2099-01-01');
    await page.getByRole('button', { name: 'Estimate date range' }).click();
    await expect(page.locator('#date-range-results')).toBeHidden();
    await expect(page.getByLabel('Embryo transfer date from your fertility clinic')).toBeFocused();
    expect(await page.evaluate(() => window.AfroDueDateRange.getResult())).toBeNull();
  });

  test('passes 320px dark 200% text, keyboard focus and 375px evidence', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });

    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/due-date/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-theme'))).toBe(false);
    const systemDarkContrast = await page.evaluate(() => {
      function rgb(value) {
        return (value.match(/\d+(?:\.\d+)?/g) || []).slice(0, 3).map(Number);
      }
      function luminance(value) {
        return rgb(value).map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.03928
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
        }).reduce((sum, channel, index) =>
          sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
      }
      function ratio(foregroundSelector, backgroundSelector) {
        const foreground = getComputedStyle(document.querySelector(foregroundSelector)).color;
        const background = getComputedStyle(document.querySelector(backgroundSelector)).backgroundColor;
        const foregroundLuminance = luminance(foreground);
        const backgroundLuminance = luminance(background);
        return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
          / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
      }
      return {
        card: ratio('.ddv-card', '.ddv-card'),
        safety: ratio('.ddv-safety p', '.ddv-safety'),
        step: ratio('.ddv-card .ddv-step', '.ddv-card'),
        sourceLink: ratio('.ddv-sources a', '.ddv-info-grid .ddv-card:last-child'),
        secondaryButton: ratio('.ddv-secondary', '.ddv-secondary'),
        primaryButton: ratio('.ddv-primary', '.ddv-primary'),
      };
    });
    for (const [surface, contrast] of Object.entries(systemDarkContrast)) {
      expect(contrast, `${surface} system-dark contrast`).toBeGreaterThanOrEqual(4.5);
    }
    await page.getByLabel('First day of your last menstrual period').focus();
    await expect(page.getByLabel('First day of your last menstrual period')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.evaluate(() => window.AfroDueDateRange.getOverflowDetails())).toEqual([]);
    await page.getByLabel('First day of your last menstrual period').fill('2026-01-01');
    await page.getByRole('button', { name: 'Estimate date range' }).click();
    await expect(page.locator('#results-title')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.evaluate(() => window.AfroDueDateRange.getOverflowDetails())).toEqual([]);

    await page.setViewportSize({ width: 375, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.evaluate(() => window.AfroDueDateRange.getOverflowDetails())).toEqual([]);
    await page.screenshot({
      path: path.join(evidenceDir, 'route-10-date-range-mobile-dark-375.png'),
      fullPage: true,
    });
  });

  test('renders desktop light evidence', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/tools/due-date/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('First day of your last menstrual period').fill('2026-01-01');
    await page.getByRole('button', { name: 'Estimate date range' }).click();
    await page.screenshot({
      path: path.join(evidenceDir, 'route-10-date-range-desktop-light.png'),
      fullPage: true,
    });
  });
});

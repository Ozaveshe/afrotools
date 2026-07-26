const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function freezeReviewDate(page) {
  await page.clock.setFixedTime(new Date('2026-07-26T12:00:00Z'));
}

test.describe('cycle window estimator VIP', () => {
  test('shows broad ranges without fertility, contraception or pregnancy claims', async ({ page }) => {
    await freezeReviewDate(page);
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/tools/ovulation-calc/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cycle window estimator');
    await page.getByLabel('First day of the most recent period').fill('2026-07-01');
    await page.getByLabel('Shortest recent cycle').fill('28');
    await page.getByLabel('Longest recent cycle').fill('30');
    await page.getByRole('button', { name: 'Estimate broad window' }).click();

    await expect(page.locator('#next-period-window')).toHaveText('29 July 2026 to 31 July 2026');
    await expect(page.locator('#ovulation-window')).toHaveText('13 July 2026 to 19 July 2026');
    await expect(page.locator('#pregnancy-possible-window')).toHaveText('8 July 2026 to 20 July 2026');
    await expect(page.locator('#cycle-window-results')).toContainText('cannot confirm ovulation, fertility, infertility, pregnancy, or contraceptive safety');

    const txtPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const txt = fs.readFileSync(await (await txtPromise).path(), 'utf8');
    expect(txt).toContain('Possible ovulation estimate: 13 July 2026 to 19 July 2026');
    expect(txt).toContain('Do not treat dates outside the span as safe for unprotected sex');
    expect(txt).toContain('Sources checked: 26 July 2026');
    expect(txt).toContain('No account, email, upload, analytics or saved browser record');

    const pdfPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const pdf = fs.readFileSync(await (await pdfPromise).path());
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    const pdfText = (await pdfParse(pdf)).text;
    expect(pdfText).toContain('AFROTOOLS CYCLE WINDOW ESTIMATE');
    expect(pdfText).toContain('Do not treat dates outside the span as safe for unprotected sex');
    expect(pdfText).toContain('No account, email, upload, analytics or saved browser record');

    expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /cycle|ovulat|fertil|period/i.test(key)))).toEqual([]);
    expect(requests.filter((url) => /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|\/api\//i.test(url))).toEqual([]);
    expect(requests.some((url) => url.includes('2026-07-01'))).toBe(false);
  });

  test('passes 320px dark at 200% text and captures 375px evidence', async ({ page }) => {
    await freezeReviewDate(page);
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/ovulation-calc/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByLabel('First day of the most recent period').focus();
    await expect(page.getByLabel('First day of the most recent period')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.evaluate(() => window.AfroCycleWindow.getOverflowDetails())).toEqual([]);

    await page.getByLabel('First day of the most recent period').fill('2026-07-01');
    await page.getByLabel('Shortest recent cycle').fill('28');
    await page.getByLabel('Longest recent cycle').fill('30');
    await page.getByRole('button', { name: 'Estimate broad window' }).click();
    await expect(page.locator('#results-title')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.evaluate(() => window.AfroCycleWindow.getOverflowDetails())).toEqual([]);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByLabel('First day of the most recent period').fill('2026-07-01');
    await page.getByLabel('Shortest recent cycle').fill('28');
    await page.getByLabel('Longest recent cycle').fill('30');
    await page.getByRole('button', { name: 'Estimate broad window' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.evaluate(() => window.AfroCycleWindow.getOverflowDetails())).toEqual([]);
    await page.screenshot({
      path: path.join(evidenceDir, 'route-11-cycle-window-mobile-dark-375.png'),
      fullPage: true,
    });
  });

  test('captures desktop light evidence', async ({ page }) => {
    await freezeReviewDate(page);
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/tools/ovulation-calc/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('First day of the most recent period').fill('2026-07-01');
    await page.getByLabel('Shortest recent cycle').fill('28');
    await page.getByLabel('Longest recent cycle').fill('30');
    await page.getByRole('button', { name: 'Estimate broad window' }).click();
    await page.screenshot({
      path: path.join(evidenceDir, 'route-11-cycle-window-desktop-light.png'),
      fullPage: true,
    });
  });

  test('focuses the invalid cycle field and rejects an expired cycle window', async ({ page }) => {
    await freezeReviewDate(page);
    await page.goto('/tools/ovulation-calc/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('First day of the most recent period').fill('2026-07-01');
    await page.getByLabel('Shortest recent cycle').fill('46');
    await page.getByLabel('Longest recent cycle').fill('45');
    await page.getByRole('button', { name: 'Estimate broad window' }).click();
    await expect(page.getByLabel('Shortest recent cycle')).toBeFocused();
    await expect(page.locator('#form-error')).toContainText('shortest completed cycle');

    await page.getByLabel('First day of the most recent period').fill('2026-05-01');
    await page.getByLabel('Shortest recent cycle').fill('28');
    await page.getByLabel('Longest recent cycle').fill('30');
    await page.getByRole('button', { name: 'Estimate broad window' }).click();
    await expect(page.getByLabel('First day of the most recent period')).toBeFocused();
    await expect(page.locator('#form-error')).toContainText('cycle window has already passed');
  });
});

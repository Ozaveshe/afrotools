const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function fillBudget(page) {
  await page.getByLabel('Currency code').fill('NGN');
  await page.getByLabel('Quote or assumption date').fill('2026-07-01');
  await page.getByLabel('Figure source').selectOption('written-provider');
  await page.getByLabel("Provider's planned care quote").fill('200000.50');
  await page.getByLabel(/Professional, theatre or anaesthesia/).fill('50000');
  await page.getByLabel(/Medicines, blood or supplies/).fill('25000.25');
  await page.getByLabel(/Tests, newborn or postnatal/).fill('10000');
  await page.getByLabel(/Transport, accommodation or support/).fill('15000');
  await page.getByLabel('Household contingency amount').fill('20000');
  await page.getByLabel(/Written payer contribution/).fill('100000');
}

test.describe('provider-quote childbirth budget VIP', () => {
  test('calculates only dated user-entered figures and exports the boundary', async ({ page }) => {
    const requests = [];
    const runtimeErrors = [];
    page.on('request', (request) => requests.push(request.url()));
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    await page.goto('/tools/childbirth-cost/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Provider-quote childbirth budget');
    await expect(page.getByRole('main')).toHaveCount(1);
    await fillBudget(page);
    await page.getByRole('button', { name: 'Calculate from my figures' }).click();

    await expect(page.locator('#gross-total')).toContainText('320,000.75');
    await expect(page.locator('#contribution-total')).toContainText('100,000.00');
    await expect(page.locator('#household-total')).toContainText('220,000.75');
    await expect(page.locator('#source-summary')).toHaveText('Written provider quote, dated 1 July 2026.');
    await expect(page.locator('#childbirth-budget-results')).toContainText('Not a price quote or care recommendation');

    const txtPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const txt = fs.readFileSync(await (await txtPromise).path(), 'utf8');
    expect(txt).toContain('AFROTOOLS PROVIDER-QUOTE CHILDBIRTH BUDGET');
    expect(txt).toContain('Quote or assumption date: 1 July 2026');
    expect(txt).toContain('Every amount was user-entered');
    expect(txt).toContain('A zero field means no amount entered, not free care');
    expect(txt).toContain('Sources checked: 26 July 2026');
    expect(txt).toContain('No account, email, upload, analytics or saved browser record');

    const pdfPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const pdf = fs.readFileSync(await (await pdfPromise).path());
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    const pdfText = (await pdfParse(pdf)).text;
    expect(pdfText).toContain('AFROTOOLS PROVIDER-QUOTE CHILDBIRTH BUDGET');
    expect(pdfText).toContain('Every amount was user-entered');
    expect(pdfText).toContain('No account, email, upload, analytics or saved browser record');

    expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /birth|cost|quote|maternity/i.test(key)))).toEqual([]);
    expect(requests.filter((url) => /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|\/api\//i.test(url))).toEqual([]);
    expect(runtimeErrors).toEqual([]);
  });

  test('passes 320px dark at 200% text and captures 375px evidence', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/childbirth-cost/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => ({
      background: getComputedStyle(document.body).backgroundColor,
      font: getComputedStyle(document.body).fontFamily
    }))).toEqual(expect.objectContaining({
      background: 'rgb(18, 15, 11)',
      font: expect.stringContaining('DM Sans')
    }));
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.fontSize = '200%';
    });
    await page.getByLabel('Currency code').focus();
    await expect(page.getByLabel('Currency code')).toBeFocused();
    expect(await page.evaluate(() => window.AfroChildbirthBudget.getOverflowDetails())).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await fillBudget(page);
    await page.getByRole('button', { name: 'Calculate from my figures' }).click();
    await expect(page.locator('#results-title')).toBeFocused();
    expect(await page.evaluate(() => window.AfroChildbirthBudget.getOverflowDetails())).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.screenshot({
      path: path.join(evidenceDir, 'route-15-childbirth-budget-mobile-dark-375.png'),
      fullPage: true
    });
  });

  test('captures desktop light evidence', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/tools/childbirth-cost/', { waitUntil: 'domcontentloaded' });
    await fillBudget(page);
    await page.getByRole('button', { name: 'Calculate from my figures' }).click();
    await page.screenshot({
      path: path.join(evidenceDir, 'route-15-childbirth-budget-desktop-light.png'),
      fullPage: true
    });
  });
});

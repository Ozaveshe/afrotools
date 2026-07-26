const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

test.describe('birth options question builder VIP', () => {
  test('builds balanced questions without ranking mode by cost', async ({ page }) => {
    const requests = [];
    const runtimeErrors = [];
    page.on('request', (request) => requests.push(request.url()));
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    await page.goto('/tools/csection-vs-natural/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Birth options question builder');
    await expect(page.getByRole('main')).toHaveCount(1);
    await page.getByLabel('Current conversation').selectOption('previous-caesarean');
    await page.getByLabel(/Reason and clinical evidence/).check();
    await page.getByLabel(/Individual benefits and risks/).check();
    await page.getByLabel(/Facility capability and emergency plan/).check();
    await page.getByLabel('Cost conversation').selectOption('need-quote');
    await page.getByRole('button', { name: 'Build neutral question card' }).click();

    await expect(page.locator('#context-label')).toHaveText('Discussion after previous caesarean');
    await expect(page.locator('#question-list')).toContainText('What benefits and risks of vaginal and caesarean birth matter in my individual circumstances?');
    await expect(page.locator('#question-list')).toContainText('previous operation details');
    await expect(page.locator('#cost-box')).toContainText('Cost must not rank or recommend a delivery mode');
    await expect(page.locator('#birth-options-results')).toContainText('No mode is recommended by this card');

    const txtPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const txt = fs.readFileSync(await (await txtPromise).path(), 'utf8');
    expect(txt).toContain('AFROTOOLS BIRTH OPTIONS QUESTION CARD');
    expect(txt).toContain('Cost questions are separate from clinical suitability');
    expect(txt).toContain('Do not delay urgent maternity care');
    expect(txt).toContain('Sources checked: 26 July 2026');
    expect(txt).toContain('No account, email, health-history upload, analytics or saved browser record');

    const pdfPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const pdf = fs.readFileSync(await (await pdfPromise).path());
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    const pdfText = (await pdfParse(pdf)).text;
    expect(pdfText).toContain('AFROTOOLS BIRTH OPTIONS QUESTION CARD');
    expect(pdfText).toContain('does not rank or recommend a mode of birth');
    expect(pdfText).toContain('No account, email, health-history upload, analytics or saved browser record');

    expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /birth|caes|vaginal|delivery/i.test(key)))).toEqual([]);
    expect(requests.filter((url) => /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|\/api\//i.test(url))).toEqual([]);
    expect(runtimeErrors).toEqual([]);
  });

  test('passes 320px dark at 200% text and captures 375px evidence', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/csection-vs-natural/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => ({
      background: getComputedStyle(document.body).backgroundColor,
      font: getComputedStyle(document.body).fontFamily
    }))).toEqual(expect.objectContaining({
      background: 'rgb(19, 14, 16)',
      font: expect.stringContaining('DM Sans')
    }));
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.fontSize = '200%';
    });
    await page.getByLabel('Current conversation').focus();
    await expect(page.getByLabel('Current conversation')).toBeFocused();
    expect(await page.evaluate(() => window.AfroBirthOptions.getOverflowDetails())).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.getByLabel(/Reason and clinical evidence/).check();
    await page.getByLabel(/Consent, comfort and support/).check();
    await page.getByRole('button', { name: 'Build neutral question card' }).click();
    await expect(page.locator('#results-title')).toBeFocused();
    expect(await page.evaluate(() => window.AfroBirthOptions.getOverflowDetails())).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.screenshot({
      path: path.join(evidenceDir, 'route-14-birth-options-mobile-dark-375.png'),
      fullPage: true
    });
  });

  test('captures desktop light evidence', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/tools/csection-vs-natural/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Current conversation').selectOption('caesarean-discussion');
    await page.getByLabel(/Reason and clinical evidence/).check();
    await page.getByLabel(/Individual benefits and risks/).check();
    await page.getByLabel(/Alternatives and changing plans/).check();
    await page.getByLabel(/Recovery and newborn care/).check();
    await page.getByRole('button', { name: 'Build neutral question card' }).click();
    await page.screenshot({
      path: path.join(evidenceDir, 'route-14-birth-options-desktop-light.png'),
      fullPage: true
    });
  });
});

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

test.describe('private feeding and nappy log VIP', () => {
  test('keeps a session-only record and exports safety boundaries', async ({ page }) => {
    const requests = [];
    const consoleErrors = [];
    const pageErrors = [];
    page.on('request', (request) => requests.push(request.url()));
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('/tools/breastfeeding-tracker/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Private feeding and nappy log');
    await page.getByLabel('Event type').selectOption('breastfeed');
    await page.getByLabel('Date and local time').fill('2026-07-26T08:30');
    await page.getByLabel('Side recorded').selectOption('left');
    await page.getByLabel(/Duration in minutes/).fill('0');
    await page.getByRole('button', { name: 'Add to temporary log' }).click();
    await expect(page.getByLabel(/Duration in minutes/)).toBeFocused();
    await expect(page.locator('#form-error')).toContainText('whole number from 1 to 180');
    await page.getByLabel(/Duration in minutes/).fill('18');
    await page.getByRole('button', { name: 'Add to temporary log' }).click();

    await expect(page.locator('#event-count')).toHaveText('1 event');
    await expect(page.locator('#event-list')).toContainText('Breastfeeding session');
    await expect(page.locator('#event-list')).toContainText('Recorded duration: 18 minutes');
    await expect(page.locator('#log-boundary')).toContainText('cannot confirm feeding adequacy, milk supply, hydration, weight gain or illness');

    await page.getByLabel('Event type').selectOption('wet-nappy');
    await expect(page.locator('#feed-fields')).toBeHidden();
    await page.getByLabel('Date and local time').fill('2026-07-26T09:00');
    await page.getByRole('button', { name: 'Add to temporary log' }).click();
    await expect(page.locator('#event-count')).toHaveText('2 events');

    const txtPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const txt = fs.readFileSync(await (await txtPromise).path(), 'utf8');
    expect(txt).toContain('AFROTOOLS PRIVATE FEEDING AND NAPPY LOG');
    expect(txt).toContain('Breastfeeding session');
    expect(txt).toContain('Wet nappy');
    expect(txt).toContain('cannot confirm feeding adequacy, milk supply, hydration, weight gain or illness');
    expect(txt).toContain('Sources checked: 26 July 2026');
    expect(txt).toContain('No account, email, upload, analytics, localStorage or sessionStorage');

    const pdfPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const pdf = fs.readFileSync(await (await pdfPromise).path());
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    const pdfText = (await pdfParse(pdf)).text;
    expect(pdfText).toContain('AFROTOOLS PRIVATE FEEDING AND NAPPY LOG');
    expect(pdfText).toContain('cannot confirm feeding adequacy');
    expect(pdfText).toContain('No account, email, upload, analytics, localStorage or sessionStorage');
    expect(pdfText).toContain('Sensitive family-health data');

    await page.getByRole('button', { name: /Remove Wet nappy/ }).click();
    await expect(page.locator('#event-count')).toHaveText('1 event');
    await page.getByLabel('Event type').selectOption('expressed-milk');
    await page.getByLabel(/Duration in minutes/).fill('12');
    await page.getByLabel(/Expressed amount/).fill('75');
    await page.getByRole('button', { name: 'Clear entire log' }).click();
    await expect(page.locator('#event-count')).toHaveText('0 events');
    await expect(page.getByLabel(/Duration in minutes/)).toHaveValue('');
    await expect(page.getByLabel(/Expressed amount/)).toHaveValue('');
    expect(await page.evaluate(() => window.AfroFeedingLog.getEntries())).toEqual([]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#event-count')).toHaveText('0 events');

    expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /feed|breast|nappy|baby/i.test(key)))).toEqual([]);
    expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => /feed|breast|nappy|baby/i.test(key)))).toEqual([]);
    expect(requests.filter((url) => /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|\/api\//i.test(url))).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('passes 320px dark at 200% text and captures 375px evidence', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/breastfeeding-tracker/', { waitUntil: 'domcontentloaded' });
    expect(await page.locator('html').getAttribute('data-theme')).toBeNull();
    expect(await page.locator('.bfl-card').first().evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(23, 32, 44)');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await page.getByLabel('Event type').focus();
    await expect(page.getByLabel('Event type')).toBeFocused();
    expect(await page.evaluate(() => window.AfroFeedingLog.getOverflowDetails())).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.getByLabel('Date and local time').fill('2026-07-26T08:30');
    await page.getByLabel('Side recorded').selectOption('both');
    await page.getByLabel(/Duration in minutes/).fill('12');
    await page.getByRole('button', { name: 'Add to temporary log' }).click();
    await expect(page.locator('#log-title')).toBeFocused();
    expect(await page.evaluate(() => window.AfroFeedingLog.getOverflowDetails())).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.screenshot({
      path: path.join(evidenceDir, 'route-13-feeding-log-mobile-dark-375.png'),
      fullPage: true
    });
  });

  test('captures desktop light evidence', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/tools/breastfeeding-tracker/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Date and local time').fill('2026-07-26T08:30');
    await page.getByLabel('Side recorded').selectOption('right');
    await page.getByLabel(/Duration in minutes/).fill('16');
    await page.getByRole('button', { name: 'Add to temporary log' }).click();
    await page.getByLabel('Event type').selectOption('expressed-milk');
    await page.getByLabel('Date and local time').fill('2026-07-26T10:00');
    await page.getByLabel(/Expressed amount/).fill('75');
    await page.getByRole('button', { name: 'Add to temporary log' }).click();
    await page.screenshot({
      path: path.join(evidenceDir, 'route-13-feeding-log-desktop-light.png'),
      fullPage: true
    });
  });
});

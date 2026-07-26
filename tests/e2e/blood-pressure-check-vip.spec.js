const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function fillReading(page, options = {}) {
  await page.getByLabel('Measurement context').selectOption(options.context || 'adult');
  await page.getByLabel('Systolic 1 (mmHg)').fill(options.systolic1 || '148');
  await page.getByLabel('Diastolic 1 (mmHg)').fill(options.diastolic1 || '92');
  await page.getByLabel('Systolic 2 (mmHg)').fill(options.systolic2 || '144');
  await page.getByLabel('Diastolic 2 (mmHg)').fill(options.diastolic2 || '90');
  for (const label of [
    /rested quietly for at least 5 minutes/,
    /back supported, feet flat/,
    /correctly sized upper-arm cuff/,
    /did not talk or use a phone/
  ]) {
    await page.getByLabel(label).check();
  }
}

test.describe('blood pressure measurement check VIP', () => {
  test('keeps readings private, uses context boundaries and exports them locally', async ({ page }) => {
    const requests = [];
    const runtimeErrors = [];
    page.on('request', (request) => requests.push(request.url()));
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    await page.goto('/tools/blood-pressure/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blood pressure measurement check');
    await expect(page.getByRole('main')).toHaveCount(1);
    await fillReading(page);
    await page.getByRole('button', { name: 'Review these readings' }).click();

    await expect(page.locator('#reading-one')).toHaveText('148/92 mmHg');
    await expect(page.locator('#reading-two')).toHaveText('144/90 mmHg');
    await expect(page.locator('#reading-average')).toHaveText('146/91 mmHg');
    await expect(page.locator('#action-title')).toHaveText('Arrange a blood-pressure review');
    await expect(page.locator('#action-text')).toContainText('two different days');
    await expect(page.locator('#blood-pressure-results')).toContainText('do not confirm or exclude');

    const txtPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const txt = fs.readFileSync(await (await txtPromise).path(), 'utf8');
    expect(txt).toContain('AFROTOOLS BLOOD PRESSURE MEASUREMENT CHECK');
    expect(txt).toContain('Reading 1: 148/92 mmHg');
    expect(txt).toContain('Reading 2: 144/90 mmHg');
    expect(txt).toContain('WHO diagnosis requires qualifying measurements on two different days');
    expect(txt).toContain('Sources checked: 26 July 2026');
    expect(txt).toContain('No account, email, upload, analytics or saved browser history');
    expect(txt).toContain('sensitive health data');

    const pdfPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const pdf = fs.readFileSync(await (await pdfPromise).path());
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    const pdfText = (await pdfParse(pdf)).text;
    expect(pdfText).toContain('AFROTOOLS BLOOD PRESSURE MEASUREMENT CHECK');
    expect(pdfText).toContain('Reading 1: 148/92 mmHg');
    expect(pdfText).toContain('This export contains sensitive health data');

    expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /blood|pressure|bp|reading|health/i.test(key)))).toEqual([]);
    expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => /blood|pressure|bp|reading|health/i.test(key)))).toEqual([]);
    expect(requests.filter((url) => /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|\/api\//i.test(url))).toEqual([]);
    expect(runtimeErrors).toEqual([]);
  });

  test('applies pregnancy urgent boundaries and passes 320px dark at 200% text', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/tools/blood-pressure/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => ({
      background: getComputedStyle(document.body).backgroundColor,
      font: getComputedStyle(document.body).fontFamily
    }))).toEqual(expect.objectContaining({
      background: 'rgb(11, 20, 18)',
      font: expect.stringContaining('DM Sans')
    }));
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.fontSize = '200%';
    });
    await page.getByLabel('Measurement context').focus();
    await expect(page.getByLabel('Measurement context')).toBeFocused();
    expect(await page.evaluate(() => window.AfroBloodPressureCheck.getOverflowDetails())).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await fillReading(page, {
      context: 'pregnant',
      systolic1: '162',
      diastolic1: '108',
      systolic2: '158',
      diastolic2: '111'
    });
    await page.getByRole('button', { name: 'Review these readings' }).click();
    await expect(page.locator('#results-title')).toBeFocused();
    await expect(page.locator('#action-title')).toHaveText('Contact maternity emergency care now');
    await expect(page.locator('#action-text')).toContainText('urgent maternity assessment');
    expect(await page.evaluate(() => window.AfroBloodPressureCheck.getOverflowDetails())).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.screenshot({
      path: path.join(evidenceDir, 'route-16-blood-pressure-mobile-dark-375.png'),
      fullPage: true
    });
  });

  test('captures desktop light evidence and emergency symptoms override low numbers', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/tools/blood-pressure/', { waitUntil: 'domcontentloaded' });
    await fillReading(page, {
      context: 'postpartum',
      systolic1: '112',
      diastolic1: '72',
      systolic2: '110',
      diastolic2: '70'
    });
    await page.getByLabel(/urgent symptoms listed/).check();
    await page.getByRole('button', { name: 'Review these readings' }).click();
    await expect(page.locator('#action-title')).toHaveText('Seek local emergency help now');
    await expect(page.locator('#action-text')).toContainText('Do not wait');
    await page.screenshot({
      path: path.join(evidenceDir, 'route-16-blood-pressure-desktop-light.png'),
      fullPage: true
    });
  });
});

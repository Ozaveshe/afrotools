const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

test.describe('antenatal appointment date planner VIP', () => {
  test('calculates deterministic dates and exports private TXT, PDF and calendar files', async ({ page }) => {
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/health/pregnancy-due-date/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Antenatal appointment date planner');
    await page.getByLabel('First day of last menstrual period').check();
    await page.getByLabel('First day of your last menstrual period').fill('2026-01-01');
    await page.getByRole('button', { name: 'Build appointment date plan' }).click();

    await expect(page.locator('#due-date-output')).toHaveText('8 October 2026');
    await expect(page.locator('#birth-window-output')).toContainText('17 September 2026');
    await expect(page.locator('#contact-plan-body tr')).toHaveCount(8);
    expect(await page.evaluate(() => localStorage.getItem('afrotools.health.pregnancyAppointmentPlan.v1'))).toBeNull();

    const txtPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT plan' }).click();
    const txtDownload = await txtPromise;
    const txtPath = await txtDownload.path();
    const txt = fs.readFileSync(txtPath, 'utf8');
    expect(txt).toContain('Working estimated due date: 8 October 2026');
    expect(txt).toContain('WHO ROUTINE CONTACT TIMING');
    expect(txt).toContain('not booked appointments or medical advice');
    expect(txt).toContain('Sources checked: 26 July 2026');

    const calendarPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download calendar dates' }).click();
    const calendarDownload = await calendarPromise;
    const calendar = fs.readFileSync(await calendarDownload.path(), 'utf8');
    expect(calendar).toContain('BEGIN:VCALENDAR');
    expect(calendar).toContain('SUMMARY:Review antenatal contact 1 with clinic');
    expect(calendar).toContain('Planning date only');
    expect(calendar.match(/^DTSTAMP:\d{8}T\d{6}Z$/gm)).toHaveLength(8);
    expect(calendar.match(/^DTEND;VALUE=DATE:\d{8}$/gm)).toHaveLength(8);

    const pdfPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF plan' }).click();
    const pdfDownload = await pdfPromise;
    expect(pdfDownload.suggestedFilename()).toBe('afrotools-health-antenatal-appointment-plan.pdf');
    const pdfBytes = fs.readFileSync(await pdfDownload.path());
    expect(pdfBytes.subarray(0, 4).toString()).toBe('%PDF');
    const pdfText = (await pdfParse(pdfBytes)).text;
    expect(pdfText).toContain('AFROTOOLS ANTENATAL APPOINTMENT DATE PLAN');
    expect(pdfText).toContain('Working estimated due date: 8 October 2026');
    expect(pdfText).toContain('No account or email required');

    expect(requests.filter((url) => /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|\/api\//i.test(url))).toEqual([]);
    expect(requests.some((url) => url.includes('2026-01-01'))).toBe(false);
  });

  test('is keyboard-labelled and overflow-safe at 320px dark and 200% text', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/health/pregnancy-due-date/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByLabel('Estimated due date from your maternity team')).toBeVisible();
    await page.getByLabel('Estimated due date from your maternity team').focus();
    await expect(page.getByLabel('Estimated due date from your maternity team')).toBeFocused();
    const overflowBefore = await page.evaluate(() => window.AfroPregnancyAppointmentPlanner.getOverflowDetails());
    expect(overflowBefore, JSON.stringify(overflowBefore)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.getByLabel('Estimated due date from your maternity team').fill('2026-12-20');
    await page.getByRole('button', { name: 'Build appointment date plan' }).click();
    await expect(page.locator('#results-title')).toBeFocused();
    const overflowAfter = await page.evaluate(() => window.AfroPregnancyAppointmentPlanner.getOverflowDetails());
    expect(overflowAfter, JSON.stringify(overflowAfter)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test('renders desktop light and 375px mobile dark evidence', async ({ page }) => {
    const evidenceDir = path.join(process.cwd(), 'artifacts', 'day5-health-external-lane-a');
    fs.mkdirSync(evidenceDir, { recursive: true });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/health/pregnancy-due-date/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Estimated due date from your maternity team').fill('2026-12-20');
    await page.getByRole('button', { name: 'Build appointment date plan' }).click();
    await expect(page.locator('#appointment-results')).toBeVisible();
    await page.screenshot({
      path: path.join(evidenceDir, 'route-09-antenatal-planner-desktop-light.png'),
      fullPage: true,
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByLabel('Estimated due date from your maternity team').fill('2026-12-20');
    await page.getByRole('button', { name: 'Build appointment date plan' }).click();
    await expect(page.locator('#appointment-results')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({
      path: path.join(evidenceDir, 'route-09-antenatal-planner-mobile-dark-375.png'),
      fullPage: true,
    });
  });

  test('stores dates only after opt-in and clears the saved and rendered plan', async ({ page }) => {
    const storageKey = 'afrotools.health.pregnancyAppointmentPlan.v1';
    await page.goto('/health/pregnancy-due-date/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Remember these dates on this device').check();
    await page.getByLabel('Estimated due date from your maternity team').fill('2026-12-20');
    await page.getByRole('button', { name: 'Build appointment date plan' }).click();

    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey)).toEqual({
      basis: 'confirmed-edd',
      date: '2026-12-20',
      cycleLength: null,
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('Remember these dates on this device')).toBeChecked();
    await expect(page.getByLabel('Estimated due date from your maternity team')).toHaveValue('2026-12-20');
    await page.getByRole('button', { name: 'Build appointment date plan' }).click();
    await page.getByRole('button', { name: 'Clear this device' }).click();

    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
    await expect(page.locator('#appointment-results')).toBeHidden();
    await expect(page.getByLabel('Estimated due date from your maternity team')).toHaveValue('');
  });
});

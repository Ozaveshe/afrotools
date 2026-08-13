const fs = require('fs');
const { test, expect } = require('@playwright/test');

async function downloadedText(download) {
  const filePath = await download.path();
  return fs.readFileSync(filePath, 'utf8');
}

test.describe('Leave and PTO calendar exports', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('downloads parseable reminders and preserves day-based parental leave', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/tools/leave-calculator/');
    await expect(page.getByRole('heading', { name: /Leave & PTO Calculator/i })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.getByRole('tab', { name: /Accrual/ }).focus();
    await page.keyboard.press('Enter');
    await page.getByLabel(/COUNTRY \(auto-fills entitlement\)/i).selectOption('KE');
    await page.getByLabel(/EMPLOYMENT START DATE/i).fill('2026-01-01');
    await page.getByLabel(/CALCULATION DATE/i).fill('2026-08-13');
    await expect(page.getByRole('button', { name: 'Download balance reminder' })).toBeVisible();
    const accrualDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download balance reminder' }).click();
    const accrualIcs = await downloadedText(await accrualDownload);
    expect(accrualIcs).toContain('BEGIN:VCALENDAR');
    expect(accrualIcs).toContain('SUMMARY:Review leave balance - Kenya');
    expect(accrualIcs).toContain('BEGIN:VALARM');

    await page.getByRole('tab', { name: /Parental Planner/ }).focus();
    await page.keyboard.press('Enter');
    const parentalPanel = page.getByRole('tabpanel', { name: /Parental Planner/ });
    await parentalPanel.getByLabel(/^COUNTRY$/i).selectOption('KE');
    await parentalPanel.getByLabel(/LEAVE TYPE/i).selectOption('pat');
    await parentalPanel.getByLabel(/EXPECTED DUE DATE/i).fill('2026-09-01');
    await expect(parentalPanel.getByText(/Paternity Leave Plan \(14 days\)/)).toBeVisible();
    const parentalDownload = page.waitForEvent('download');
    await parentalPanel.getByRole('button', { name: /Download \.ics Calendar File/ }).click();
    const parentalIcs = await downloadedText(await parentalDownload);
    expect(parentalIcs).toContain('DTSTART;VALUE=DATE:20260901');
    expect(parentalIcs).toContain('DTEND;VALUE=DATE:20260915');
    expect(parentalIcs).toContain('DTSTART;VALUE=DATE:20260915');
    expect(parentalIcs).toContain('DTEND;VALUE=DATE:20260916');

    await page.getByRole('tab', { name: /Long Weekends/ }).focus();
    await page.keyboard.press('Enter');
    const holidayPanel = page.getByRole('tabpanel', { name: /Long Weekends/ });
    await holidayPanel.getByLabel(/^COUNTRY$/i).selectOption('UG');
    await expect(holidayPanel.getByRole('button', { name: 'Download holiday calendar' })).toBeVisible();
    const holidayDownload = page.waitForEvent('download');
    await holidayPanel.getByRole('button', { name: 'Download holiday calendar' }).click();
    const holidayIcs = await downloadedText(await holidayDownload);
    expect((holidayIcs.match(/BEGIN:VEVENT/g) || []).length).toBe(17);
    expect(holidayIcs).toContain('DTSTART;VALUE=DATE:20260512');
    expect(holidayIcs).toContain('Presidential swearing-in public holiday');

    expect(pageErrors).toEqual([]);
  });
});

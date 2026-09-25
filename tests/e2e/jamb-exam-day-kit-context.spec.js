const { expect, test } = require('@playwright/test');

test('exam day kit uses only the candidate appointment and never shows an expired zero countdown', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/jamb/exam-day-kit/', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await expect(page.locator('#appointmentStatus')).toContainText('No official appointment is assumed');
  await expect(page.locator('#countdown-mini .cd-mini-box')).toHaveCount(0);

  await page.locator('#appointmentTime').fill('2099-04-16T09:00');
  await page.getByRole('button', { name: 'Save appointment' }).click();
  await expect(page.locator('#countdown-mini .cd-mini-box')).toHaveCount(3);
  await page.reload();
  await expect(page.locator('#appointmentTime')).toHaveValue('2099-04-16T09:00');

  await page.locator('#appointmentTime').fill('2026-04-16T09:00');
  await page.getByRole('button', { name: 'Save appointment' }).click();
  await expect(page.locator('#appointmentStatus')).toContainText('has passed');
  await expect(page.locator('#countdown-mini .cd-mini-box')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Plug in headphones');
});

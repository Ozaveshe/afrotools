const { test, expect } = require('@playwright/test');

test('Swahili crypto CGT calculator uses the shared verified Kenya engine', async ({ page }) => {
  await page.goto('/sw/zana/kodi-ya-sarafu-za-kidijitali/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('h1')).toContainText('Kodi ya crypto bila kudhani kila muamala ni sawa');

  await page.selectOption('#cc-country', 'KE');
  await page.selectOption('#cc-classification', 'capital-confirmed');
  await page.check('#cc-confirm');
  await page.fill('#cc-proceeds', '20000000');
  await page.fill('#cc-cost', '10000000');
  await page.fill('#cc-sell-costs', '1000000');
  await page.click('#cc-form button[type="submit"]');

  await expect(page.locator('#cc-tax')).toContainText('1,350,000');
  await expect(page.locator('#cc-method')).toContainText('15%');
  await expect(page.locator('#cc-breakdown')).toContainText('9,000,000');
});

test('Swahili crypto CGT calculator fails closed for uncertain classification', async ({ page }) => {
  await page.goto('/sw/zana/kodi-ya-sarafu-za-kidijitali/');
  await page.selectOption('#cc-classification', 'uncertain');
  await page.click('#cc-form button[type="submit"]');
  await expect(page.locator('#cc-status')).toContainText('Hakuna makadirio');
});

test('Swahili crypto CGT calculator fits a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/sw/zana/kodi-ya-sarafu-za-kidijitali/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

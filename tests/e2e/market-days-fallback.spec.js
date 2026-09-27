const { test, expect } = require('@playwright/test');

test('market-day fallback does not claim a stale date when scripts are disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto('/tools/market-days/');
  await expect(page.locator('main noscript p')).toBeVisible();
  await expect(page.locator('main noscript p')).toContainText('Enable JavaScript');
  await expect(page.locator('#selectedDateMeta')).not.toContainText('April 2026');
  await expect(page.locator('#nigeriaDayName')).toHaveText('Waiting for date');
  await expect(page.locator('#deviceDayName')).toHaveText('Waiting for date');
  await expect(page.locator('#monthLabel')).toHaveText('Calendar loading');
  await context.close();
});

test('market-day calculator replaces fallback with the current date and supports lookup', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tools/market-days/');
  await expect(page.locator('#nigeriaDayName')).toHaveText('Orie');
  await expect(page.locator('#selectedDayName')).toHaveText('Orie');
  await expect(page.locator('#selectedDateMeta')).toContainText('1 January 2026');
  await page.getByLabel('Pick any Gregorian date').fill('2026-01-04');
  await expect(page.locator('#selectedDayName')).toHaveText('Eke');
  await expect(page.locator('#selectedDateMeta')).toContainText('4 January 2026');
  await page.locator('#lookupDate').click();
  const answerPosition = await page.evaluate(() => ({
    inputBottom: document.querySelector('#lookupDate').getBoundingClientRect().bottom,
    answerTop: document.querySelector('#selectedDayName').getBoundingClientRect().top,
    viewportHeight: innerHeight
  }));
  expect(answerPosition.answerTop).toBeGreaterThan(answerPosition.inputBottom);
  expect(answerPosition.answerTop).toBeLessThan(answerPosition.viewportHeight);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('market-day planner surfaces keep readable contrast in dark mode', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/market-days/?date=2026-01-04');
  await page.locator('afro-navbar .burger').click();
  await page.locator('afro-navbar #mobThemeToggle').click();
  await expect.poll(() => page.locator('html').getAttribute('data-theme')).toBe('dark');
  const contrastRatios = await page.evaluate(() => {
    const luminance = color => {
      const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
        const normalized = value / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    return ['.today-card', '.cycle-item:not(.is-active)', '.calendar-day:not(.is-selected)', '.calendar-nav', '.upcoming-item', '.schedule-pill'].map(selector => {
      const style = getComputedStyle(document.querySelector(selector));
      const light = Math.max(luminance(style.color), luminance(style.backgroundColor));
      const dark = Math.min(luminance(style.color), luminance(style.backgroundColor));
      return { selector, foreground: style.color, background: style.backgroundColor, ratio: (light + 0.05) / (dark + 0.05) };
    });
  });
  for (const { selector, foreground, background, ratio } of contrastRatios) {
    expect.soft(ratio, `${selector} ${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
  }
});

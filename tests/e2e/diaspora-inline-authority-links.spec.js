const { test, expect } = require('@playwright/test');

test('diaspora authority links remain inline prose on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/diaspora-guide/', { waitUntil: 'domcontentloaded' });

  const links = page.locator('.disclaimer a');
  await expect(links).toHaveCount(5);
  const noticeColor = await page.locator('.disclaimer').evaluate((element) => getComputedStyle(element).color);
  await expect(page.locator('.disclaimer strong')).toHaveCSS('color', noticeColor);

  for (let index = 0; index < 5; index += 1) {
    const styles = await links.nth(index).evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        display: computed.display,
        minHeight: parseFloat(computed.minHeight) || 0,
        height: element.getBoundingClientRect().height,
        fontSize: computed.fontSize
      };
    });
    expect(styles.display).toBe('inline');
    expect(styles.minHeight).toBe(0);
    expect(styles.height).toBeLessThan(30);
    expect(styles.fontSize).toBe('13.12px');
    await expect(links.nth(index)).toHaveCSS('color', noticeColor);
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
});

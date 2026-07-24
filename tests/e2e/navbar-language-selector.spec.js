const { test, expect } = require('@playwright/test');

const route = '/';

test.describe('navbar language selector', () => {
  for (const colorScheme of ['light', 'dark']) {
    test(`desktop keeps every launched language visible and aligned in ${colorScheme} mode`, async ({ browser }) => {
      const context = await browser.newContext({
        colorScheme,
        viewport: { width: 1024, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(route);

      const navbar = page.locator('afro-navbar');
      const trigger = navbar.locator('#langBtn');
      const menu = navbar.locator('#langDrop');
      await trigger.click();

      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(menu).toBeVisible();
      await expect(menu.locator('[data-locale-target="fr"]')).toContainText('Français');
      await expect(menu.locator('[data-locale-target="fr"]')).toHaveAttribute('role', 'menuitem');

      const box = await menu.boundingBox();
      expect(box).not.toBeNull();
      expect(box.y).toBeGreaterThanOrEqual(56);
      expect(box.y + box.height).toBeLessThanOrEqual(900);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1024);

      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await context.close();
    });
  }

  test('mobile drawer exposes French without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);

    const navbar = page.locator('afro-navbar');
    await navbar.locator('.burger').click();
    const french = navbar.locator('.mob-lang-opt[data-locale-target="fr"]');

    await expect(french).toBeVisible();
    await expect(french).toContainText('Français');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});

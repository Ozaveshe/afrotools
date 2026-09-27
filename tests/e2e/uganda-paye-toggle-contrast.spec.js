const { test, expect } = require('@playwright/test');

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`Uganda PAYE selected payroll choices are readable at ${width}px in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.addInitScript(selectedTheme => {
        localStorage.setItem('aft_theme', selectedTheme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
      }, theme);
      await page.goto('/uganda/ug-paye');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.locator('[data-tog="lst"]').click();

      const samples = await page.evaluate(() => {
        const luminance = color => {
          const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
            const normalized = value / 255;
            return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
          });
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        const contrast = (foreground, background) => {
          const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
          return (values[0] + 0.05) / (values[1] + 0.05);
        };
        return ['resident', 'nssf', 'lst'].flatMap(name => {
          const button = document.querySelector(`[data-tog="${name}"]`);
          const background = getComputedStyle(button).backgroundColor;
          return ['.tog-label', '.tog-rate'].map(selector => {
            const label = button.querySelector(selector);
            const foreground = getComputedStyle(label).color;
            return { name, selector, foreground, background, ratio: contrast(foreground, background) };
          });
        });
      });

      for (const sample of samples) {
        expect(sample.ratio, `${sample.name} ${sample.selector}: ${JSON.stringify(sample)}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }
}

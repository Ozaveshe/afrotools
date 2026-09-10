const { test, expect } = require('@playwright/test');

for (const width of [320, 390, 1280]) {
  for (const textSize of [100, 200]) {
    test(`education hub card content remains readable at ${width}px and ${textSize}% text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/tools/education-hub/', { waitUntil: 'load' });
      await expect(page.locator('#readinessList .hub-readiness-card')).toHaveCount(4);
      await page.addStyleTag({ content: `html{font-size:${textSize}%!important}` });
      await page.evaluate(() => document.fonts.ready);
      const cards = page.locator('.hub-source-banner, .hub-readiness-card, .hub-surface-card, .hub-action-item, .hub-route-step');
      expect(await cards.count()).toBeGreaterThan(12);
      // Page overflow alone misses content clipped by an ancestor card.
      const clipped = await cards.evaluateAll(nodes => nodes.flatMap(card => {
        const outer = card.getBoundingClientRect();
        return [...card.children].filter(child => {
          const bounds = child.getBoundingClientRect();
          return bounds.width > 0 && (bounds.left < outer.left - 1 || bounds.right > outer.right + 1 || child.scrollWidth > child.clientWidth + 1);
        }).map(child => ({ card: card.className, text: child.textContent.trim(), width: card.clientWidth }));
      }));
      expect(clipped).toEqual([]);
    });
  }
}

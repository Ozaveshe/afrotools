const { test, expect } = require('@playwright/test');

test('AfroKitchen home section labels stay readable in dark mode at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/afrokitchen/', { waitUntil: 'domcontentloaded' });
  await page.locator('html').evaluate((html) => html.setAttribute('data-theme', 'dark'));

  const labels = ['Start here', 'Sources & verification', 'First bites', 'Showstopper board', 'Regional atlas', 'Menu builder'];
  const contrast = await page.locator('.ak-section-kicker').evaluateAll((kickers, expected) => {
    function luminance(color) {
      const channels = color.match(/\d+/g).slice(0, 3).map(Number).map((value) => {
        const unit = value / 255;
        return unit <= 0.04045 ? unit / 12.92 : Math.pow((unit + 0.055) / 1.055, 2.4);
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }
    return expected.map((label) => {
      const kicker = kickers.find((item) => item.textContent.trim() === label);
      if (!kicker) return { label, ratio: 0 };
      const panel = kicker.closest('.ak-browse-shell,.ak-method-card,.ak-support-card');
      const text = luminance(getComputedStyle(kicker).color);
      const background = luminance(getComputedStyle(panel).backgroundColor);
      return { label, ratio: (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05) };
    });
  }, labels);
  for (const item of contrast) expect(item.ratio, item.label).toBeGreaterThanOrEqual(4.5);

  const ctaColors = await page.locator('.ak-cta-banner .ak-section-kicker').evaluate((kicker) => ({
    text: getComputedStyle(kicker).color,
    accent: getComputedStyle(kicker, '::before').backgroundColor,
  }));
  expect(ctaColors).toEqual({ text: 'rgb(244, 180, 0)', accent: 'rgb(244, 180, 0)' });
});

const { expect, test } = require('@playwright/test');

test.use({ hasTouch: true });

for (const width of [320, 390]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`AFCON inputs and Ask remain separately tappable at ${width}px in ${colorScheme} mode`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
        return route.fulfill({ status: 204, body: '' });
      });
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      const response = await page.goto('/tools/afcon-predictor/', { waitUntil: 'domcontentloaded' });
      expect(response.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);

      const assistant = page.locator('afro-site-assistant');
      const ask = page.locator('#afcon-ask');
      const panel = assistant.locator('#panel');
      await expect(ask).toBeVisible();
      expect((await ask.boundingBox()).height).toBeGreaterThanOrEqual(44);
      // Ask itself is the first interaction and should finish the lazy load.
      await ask.tap();
      await expect(assistant).toHaveCount(1);
      await expect(panel).toHaveAttribute('aria-hidden', 'false');
      await assistant.locator('#close').tap();
      await expect(panel).toHaveAttribute('aria-hidden', 'true');

      // Tap the right edge where the floating assistant used to intercept the form.
      const input = page.locator(width === 320 ? '#sports-favorite' : '#sports-formBoost');
      await input.scrollIntoViewIfNeeded();
      await expect(assistant).toHaveCSS('visibility', 'hidden');
      const box = await input.boundingBox();
      const x = box.x + box.width - 10;
      const y = box.y + box.height / 2;
      const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, { x, y });
      expect(hit).toBe(await input.getAttribute('id'));
      await page.touchscreen.tap(x, y);
      await expect(input).toBeFocused();

      const initialResult = await page.locator('.sports-result-value').textContent();
      await page.locator('#sports-formBoost').fill('10');
      await page.locator('#sports-tool-form button[type="submit"]').tap();
      await expect(page.locator('.sports-result-value')).not.toHaveText(initialResult.trim());
      await page.locator('[data-reset]').tap();
      await expect(page.locator('.sports-result-value')).toHaveText(initialResult.trim());

      await ask.scrollIntoViewIfNeeded();
      await ask.tap();
      await expect(panel).toHaveAttribute('aria-hidden', 'false');
      await expect(assistant).toHaveCSS('visibility', 'visible');
      await assistant.locator('#close').tap();
      await expect(panel).toHaveAttribute('aria-hidden', 'true');
      await expect(assistant).toHaveCSS('visibility', 'hidden');
      await expect(ask).toBeFocused();

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(assistant).toHaveCSS('visibility', 'visible');
      await assistant.locator('#fab').tap();
      await expect(panel).toHaveAttribute('aria-hidden', 'false');
      await assistant.locator('#close').tap();

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }
}

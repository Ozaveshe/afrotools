const { test, expect } = require('@playwright/test');

const styles = '**/assets/css/navbar*.css*';
const routes = ['/', '/fr/', '/sw/', '/ha/', '/yo/'];

for (const route of routes) {
  for (const width of [320, 390, 1280]) {
    for (const failure of ['delayed', 'main-error', 'language-error', 'both-errors']) {
      test(`navbar remains usable with ${failure} at ${width}px: ${route}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        let releaseStyles;
        const heldStyles = new Promise(resolve => { releaseStyles = resolve; });
        await page.route(styles, async request => {
          if (failure === 'delayed') {
            await heldStyles;
            return request.continue();
          }
          const language = request.request().url().includes('navbar-language-switcher.css');
          const shouldFail = failure === 'both-errors' || (failure === 'language-error' ? language : !language);
          return shouldFail ? request.abort('failed') : request.continue();
        });

        try {
          await page.goto(route, { waitUntil: 'commit' });
          const navbar = page.locator('afro-navbar');
          const fallback = navbar.locator('.styles-fallback');
          await expect(fallback).toHaveCount(1);
          const first = await navbar.evaluate(host => ({
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            ready: host.hasAttribute('data-styles-ready'),
          }));
          expect(first.overflow).toBeLessThanOrEqual(1);
          expect(first.ready).toBe(false);
          // Responses remain held beyond the former unconditional 1500ms reveal.
          await expect(fallback).toBeVisible();
          await expect(navbar).not.toHaveAttribute('data-styles-ready');
          await expect(navbar.locator('nav')).toBeHidden();
          await expect(navbar.locator('.burger')).toBeHidden();
          const links = fallback.locator('a');
          await expect(links).toHaveCount(4);
          await expect(links.first()).toHaveAttribute('href', route);
          const layout = await links.evaluateAll(items => items.map(link => {
            const rect = link.getBoundingClientRect();
            return { height: rect.height, left: rect.left, right: rect.right, name: link.getAttribute('aria-label') || link.textContent.trim() };
          }));
          for (const link of layout) {
            expect(link.height).toBeGreaterThanOrEqual(44);
            expect(link.left).toBeGreaterThanOrEqual(0);
            expect(link.right).toBeLessThanOrEqual(width + 1);
            expect(link.name).not.toBe('');
          }
          await links.first().focus();
          await page.keyboard.press('Tab');
          await expect(links.nth(1)).toBeFocused();
          expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

          if (failure === 'delayed') {
            releaseStyles();
            await expect(navbar).toHaveAttribute('data-styles-ready', '');
            await expect(fallback).toBeHidden();
            await expect(navbar.locator('.logo')).toBeFocused();
          } else {
            // A failed response keeps ordinary links available; a healthy reload restores the full navigation.
            await page.unroute(styles);
            await page.reload();
            await expect(navbar).toHaveAttribute('data-styles-ready', '');
            await expect(fallback).toBeHidden();
          }
          expect(await navbar.evaluate(host => getComputedStyle(host).overflow)).not.toBe('hidden');
          if (width < 940) {
            const burger = navbar.locator('.burger');
            await burger.click();
            await expect(navbar.locator('.mob')).toBeVisible();
            await expect(navbar.locator('#mobClose')).toBeFocused();
            await page.keyboard.press('Escape');
            await expect(navbar.locator('.mob')).toBeHidden();
            await expect(burger).toBeFocused();
          } else {
            await expect(navbar.locator('.logo')).toBeVisible();
            await expect(navbar.locator('#allBtn')).toBeVisible();
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
          expect(errors).toEqual([]);
        } finally {
          releaseStyles();
        }
      });
    }
  }
}

const { test, expect } = require('@playwright/test');

// Release real locale assets after the navbar is usable. Record the exact
// synchronous render boundary as well as subsequent frames; waiting for a
// recovered layout would miss the zero-height regression.
for (const width of [320, 390]) {
  for (const [styles, interaction] of [
    ['main-error', 'none'], ['main-error', 'focus'],
    ['normal', 'none'], ['normal', 'focus'], ['normal', 'menu'],
    ['delayed', 'none'], ['delayed', 'focus'],
  ]) {
    test(`locale refresh preserves usable navigation: ${styles}, ${interaction}, ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let releaseLocale, releaseStyles;
      const localeHeld = new Promise(resolve => { releaseLocale = resolve; });
      const stylesHeld = new Promise(resolve => { releaseStyles = resolve; });
      await page.route(/\/assets\/js\/data\/locale-manifest\.js(?:\?|$)/, async route => {
        await localeHeld;
        await route.continue();
      });
      await page.route('**/assets/css/navbar*.css*', async route => {
        if (styles === 'delayed') await stylesHeld;
        if (styles === 'main-error' && !route.request().url().includes('navbar-language-switcher.css')) return route.abort('failed');
        await route.continue();
      });
      try {
        await page.goto('/fr/', { waitUntil: 'commit' });
        const navbar = page.locator('afro-navbar');
        const fallback = navbar.locator('.styles-fallback');
        if (styles === 'normal') await expect(navbar).toHaveAttribute('data-styles-ready', '');
        else await expect(fallback).toBeVisible();

        await navbar.evaluate(host => {
          const root = host.shadowRoot;
          const retainedFallback = root.querySelector('.styles-fallback');
          const retainedLinks = Array.from(retainedFallback.querySelectorAll('a'));
          const retainedStyles = Array.from(root.querySelectorAll('style, link[rel="stylesheet"]'));
          const measure = link => {
            const rect = link.getBoundingClientRect();
            return { connected: link.isConnected, height: rect.height, left: rect.left, right: rect.right };
          };
          const sample = () => ({
            fallback: host.hasAttribute('data-styles-fallback'), ready: host.hasAttribute('data-styles-ready'),
            sameFallback: retainedFallback === root.querySelector('.styles-fallback'),
            sameStyles: retainedStyles.every((node, index) => node === root.querySelectorAll('style, link[rel="stylesheet"]')[index]),
            retained: retainedLinks.map(measure), current: Array.from(root.querySelectorAll('.styles-fallback a')).map(measure),
            burger: measure(root.querySelector('.burger')),
          });
          window.__localeRefresh = { renders: [], frames: [], sample };
          const original = host._render;
          host._render = function(...args) {
            const before = sample();
            const changed = original.apply(this, args);
            window.__localeRefresh.renders.push({ changed, before, after: sample() });
            return changed;
          };
          const frame = () => {
            window.__localeRefresh.frames.push(sample());
            if (!window.__localeRefresh.stop) requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });

        const focusTarget = styles === 'normal' ? navbar.locator('.burger') : fallback.locator('a').nth(1);
        if (interaction === 'focus') await focusTarget.focus();
        if (interaction === 'menu') {
          await navbar.locator('.burger').click();
          await expect(navbar.locator('#mobClose')).toBeFocused();
        }
        releaseLocale();
        await expect.poll(() => navbar.evaluate(host => host._localizationLoading)).toBe(false);
        if (interaction !== 'none') {
          await expect.poll(() => navbar.evaluate(host => host._navigationRefreshPending)).toBe(true);
          expect(await page.evaluate(() => window.__localeRefresh.renders.length)).toBe(0);
          if (interaction === 'menu') {
            await expect(navbar.locator('.mob')).toBeVisible();
            await expect(navbar.locator('#mobClose')).toBeFocused();
            await page.keyboard.press('Escape');
            await expect(navbar.locator('.burger')).toBeFocused();
          } else await expect(focusTarget).toBeFocused();
          // Move focus outside the component through the real focusin listener.
          await page.evaluate(() => {
            const button = document.createElement('button');
            button.textContent = 'Outside navigation';
            document.body.append(button);
            button.focus();
          });
        }
        await expect.poll(() => page.evaluate(() => window.__localeRefresh.renders.filter(row => row.changed).length)).toBeGreaterThan(0);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const trace = await page.evaluate(() => {
          window.__localeRefresh.stop = true;
          const { renders, frames } = window.__localeRefresh;
          return { renders, frames };
        });
        const samples = [...trace.renders.flatMap(row => [row.before, row.after]), ...trace.frames];
        expect(samples.length).toBeGreaterThan(2);
        for (const sample of samples) {
          expect(sample.sameFallback).toBe(true);
          expect(sample.sameStyles).toBe(true);
          if (styles === 'normal') {
            expect(sample.ready).toBe(true);
            expect(sample.burger.height).toBeGreaterThanOrEqual(44);
          } else {
            expect(sample.fallback).toBe(true);
            expect(sample.ready).toBe(false);
            expect(sample.retained).toHaveLength(4);
            expect(sample.current).toHaveLength(4);
            for (const link of [...sample.retained, ...sample.current]) {
              expect(link.connected).toBe(true);
              expect(link.height).toBeGreaterThanOrEqual(44);
              expect(link.left).toBeGreaterThanOrEqual(0);
              expect(link.right).toBeLessThanOrEqual(width + 1);
            }
          }
        }
        if (styles !== 'normal') {
          await fallback.locator('a').first().focus();
          await page.keyboard.press('Tab');
          await expect(fallback.locator('a').nth(1)).toBeFocused();
        }
        if (styles === 'delayed') {
          releaseStyles();
          await expect(navbar).toHaveAttribute('data-styles-ready', '');
          await expect(fallback).toBeHidden();
          await expect(navbar.locator('.logo')).toBeFocused();
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
        expect(errors).toEqual([]);
      } finally {
        releaseLocale();
        releaseStyles();
      }
    });
  }
}

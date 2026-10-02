const { test, expect } = require('@playwright/test');

const routes = [
  '/',
  '/tools/amount-words-gh/',
  '/tools/naira-to-words/',
  '/dashboard/',
  '/tools/market-days/',
  '/contact/'
];

async function settleRenderedContent(page) {
  // Visit deferred sections so theme transitions finish before the whole-page
  // audit reads them. Hidden disclosures can retain pending Firefox animations.
  for (const section of await page.locator('section, main, article, aside').all()) {
    if (await section.evaluate(element => getComputedStyle(element).contentVisibility === 'auto')) {
      await section.scrollIntoViewIfNeeded();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect.poll(() => page.evaluate(() => {
    const roots = [document];
    for (let index = 0; index < roots.length; index++) {
      for (const element of roots[index].querySelectorAll('*')) {
        if (element.shadowRoot) roots.push(element.shadowRoot);
      }
    }
    const animations = new Set(roots.flatMap(root => root.getAnimations()));
    return [...animations].filter(animation =>
      animation.playState === 'running' && Number.isFinite(animation.effect.getComputedTiming().endTime) &&
      (animation.effect.target?.checkVisibility?.({ contentVisibilityAuto: true, visibilityProperty: true }) ?? true)
    ).length;
  })).toBe(0);
}

for (const route of routes) {
  for (const systemTheme of ['light', 'dark']) {
    for (const width of [320, 1280]) {
      test(`${route} selected themes remain readable at ${width}px on a ${systemTheme} device with reduced motion`, async ({ page }, testInfo) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewportSize({ width, height: 844 });
        await page.emulateMedia({ colorScheme: systemTheme, reducedMotion: 'reduce' });
        const origin = new URL(testInfo.project.use.baseURL).origin;
        await page.route('**/*', request => {
          const url = request.request().url();
          const publicEmoji = url.startsWith('https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/');
          return (new URL(url).origin === origin || publicEmoji) && ['GET', 'HEAD'].includes(request.request().method())
            ? request.continue() : request.abort();
        });
        await page.addInitScript(() => {
          localStorage.setItem('aft_theme', 'light');
          localStorage.setItem('afrotools_cookie_consent', 'declined');
          window.AFROTOOLS_TEST_DISABLE_ANALYTICS = true;
        });
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('button', { name: width === 320 ? 'Open menu' : 'Switch to dark mode', exact: true })).toBeVisible();
        if (route === '/tools/market-days/' || route === '/tools/naira-to-words/') {
          await expect(page.locator('.afw-shell')).toBeAttached();
        }
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        for (const theme of ['light', 'dark', 'light']) {
          if (await page.locator('html').getAttribute('data-theme') !== theme) {
            if (width === 320) {
              await page.getByRole('button', { name: 'Open menu', exact: true }).click();
              await page.waitForLoadState('networkidle');
            }
            await page.getByRole('button', { name: `Switch to ${theme} mode`, exact: true }).press('Space');
            await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
            if (width === 320) {
              await page.keyboard.press('Escape');
              await expect(page.getByRole('dialog', { name: 'Navigation menu', exact: true })).not.toBeVisible();
              await expect(page.locator('afro-navbar .mob')).not.toBeVisible();
            }
          }
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          expect(await page.evaluate(() => localStorage.getItem('aft_theme'))).toBe(theme);
          await settleRenderedContent(page);
          const result = await page.evaluate(async () => {
            const audit = await window.axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }
            });
            return {
              violations: audit.violations.map(item => ({
                id: item.id,
                impact: item.impact,
                nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary }))
              })),
              incomplete: audit.incomplete.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })),
              width: innerWidth,
              documentWidth: document.documentElement.scrollWidth
            };
          });
          await testInfo.attach(`${theme}-accessibility`, { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
          expect(result.violations, `${theme}: ${JSON.stringify(result.violations)}`).toEqual([]);
          expect(result.documentWidth).toBeLessThanOrEqual(result.width + 1);
        }
        expect(errors).toEqual([]);
      });
    }
  }
}

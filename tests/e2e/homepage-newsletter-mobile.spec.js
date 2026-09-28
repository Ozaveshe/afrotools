const { test, expect } = require('@playwright/test');

test('settled mobile newsletter fits the viewport and keeps its controls usable', async ({ browser, baseURL }, testInfo) => {
  const origin = new URL(baseURL).origin;
  for (const width of [320, 390]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, serviceWorkers: 'block' });
      try {
        const page = await context.newPage();
        const errors = [];
        const requests = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', request => requests.push({ url: request.url(), method: request.method(), body: request.postData() || '' }));
        await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
        await page.addInitScript(theme => {
          localStorage.setItem('aft_theme', theme);
          localStorage.setItem('afrotools_cookie_consent', 'declined');
        }, theme);
        await page.goto(baseURL, { waitUntil: 'load' });
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(page.locator('html')).toHaveClass(/css-ready/);
        await page.waitForFunction(() => {
          const homepage = document.querySelector('link[href*="homepage-hero.css"]');
          const sharedTheme = document.querySelector('link[href*="theme-dark"]');
          return homepage?.sheet && sharedTheme?.sheet;
        });
        const box = page.locator('#newsletter .nl-box');
        await box.scrollIntoViewIfNeeded();
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        const layout = await box.evaluate(box => {
          const bounds = box.getBoundingClientRect();
          return {
            viewport: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
            box: { left: bounds.left, right: bounds.right },
            content: [...box.querySelectorAll('.nl-title, .nl-sub, .nl-form, .nl-inp, .nl-btn, .nl-note')].map(element => {
              const rect = element.getBoundingClientRect();
              return { left: rect.left, right: rect.right };
            })
          };
        });
        expect(layout.scrollWidth, `${width}px ${theme}: document overflow`).toBeLessThanOrEqual(width);
        for (const bounds of layout.content) {
          expect(bounds.left).toBeGreaterThanOrEqual(layout.box.left);
          expect(bounds.right).toBeLessThanOrEqual(layout.box.right);
        }
        await testInfo.attach(`newsletter-${width}-${theme}-layout`, {
          body: Buffer.from(JSON.stringify({ width, theme, ...layout }, null, 2)), contentType: 'application/json'
        });
        await box.screenshot({ path: testInfo.outputPath(`newsletter-${width}-${theme}.png`) });
        const email = box.getByRole('textbox', { name: 'Email address', exact: true });
        const notify = box.getByRole('button', { name: 'Notify Me', exact: false });
        await expect(email).toBeEditable();
        await expect(notify).toBeEnabled();
        await email.fill('not-an-email');
        expect(await email.evaluate(input => input.checkValidity())).toBe(false);
        await email.fill('sample@example.test');
        expect(await email.evaluate(input => input.checkValidity())).toBe(true);
        await email.focus();
        await page.keyboard.press('Tab');
        await expect(notify).toBeFocused();
        // Layout and keyboard checks never submit the newsletter or send the fixture.
        expect(requests.some(request => request.method === 'POST')).toBe(false);
        expect(requests.some(request => request.url.includes('example.test') || request.body.includes('example.test'))).toBe(false);
        expect(errors).toEqual([]);
      } finally {
        await context.close();
      }
    }
  }
});

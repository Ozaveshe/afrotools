const { test, expect } = require('@playwright/test');

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`Uganda PAYE result and save panel stay readable at ${width}px in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.addInitScript(selectedTheme => {
        localStorage.setItem('aft_theme', selectedTheme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
      }, theme);
      await page.goto('/uganda/ug-paye');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

      await page.getByRole('button', { name: /Calculate Take-Home Pay/ }).click();
      await expect(page.locator('#resAmount')).toContainText('1,086,750');
      await expect.poll(() => page.evaluate(() => {
        const amount = document.getElementById('resAmount').getBoundingClientRect();
        const nav = document.querySelector('afro-navbar').getBoundingClientRect();
        return Math.round(amount.top - nav.bottom);
      })).toBeGreaterThanOrEqual(8);
      const resultOverlap = await page.evaluate(() => {
        const fab = document.querySelector('afro-site-assistant')?.getBoundingClientRect();
        if (!fab) return false;
        const amount = document.getElementById('resAmount').getBoundingClientRect();
        const takeHomeRow = [...document.querySelectorAll('#resultsCard .res-row')]
          .find(row => row.textContent.includes('Take-Home Pay'))?.getBoundingClientRect();
        return [amount, takeHomeRow].some(rect => rect &&
          rect.left < fab.right && rect.right > fab.left && rect.top < fab.bottom && rect.bottom > fab.top);
      });
      expect(resultOverlap).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await expect(page.locator('#ugPayeAskBtn')).toBeVisible();
      await expect.poll(() => page.locator('afro-site-assistant').evaluate(element => getComputedStyle(element).display)).toBe('none');

      await page.getByLabel('Scenario name').fill('Synthetic Kampala payroll');
      await page.locator('#calcSaveBtn').click();
      await expect(page.locator('#calcSaveStatus')).toContainText('Saved on this device');
      await expect(page.locator('#calcSavedList')).toContainText('Synthetic Kampala payroll');
      await expect.poll(() => page.locator('afro-site-assistant').evaluate(element => getComputedStyle(element).display)).toBe('none');

      await page.locator('.bands-card .rate-toggle').first().click();
      await expect(page.locator('.bands-card .rate-toggle').first()).toHaveAttribute('aria-expanded', 'true');
      await expect.poll(() => page.locator('afro-site-assistant').evaluate(element => getComputedStyle(element).display)).toBe('none');

      await page.locator('#ugPayeAskBtn').click();
      await expect.poll(() => page.locator('afro-site-assistant').evaluate(element => element.shadowRoot.getElementById('panel').getAttribute('aria-hidden'))).toBe('false');
      await expect(page.locator('afro-site-assistant')).toBeVisible();
      await page.locator('afro-site-assistant').locator('#close').click();
      await expect.poll(() => page.locator('afro-site-assistant').evaluate(element => getComputedStyle(element).display)).toBe('none');
      await expect(page.locator('#ugPayeAskBtn')).toBeFocused();

      // A panel opened from the regular floating button must stay available
      // while the user scrolls back through the calculator results.
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => page.locator('afro-site-assistant').evaluate(element => getComputedStyle(element).display)).not.toBe('none');
      await page.locator('afro-site-assistant').locator('#fab').click();
      await expect.poll(() => page.locator('afro-site-assistant').evaluate(element => element.shadowRoot.getElementById('panel').getAttribute('aria-hidden'))).toBe('false');
      await page.locator('#calcSaveShell').scrollIntoViewIfNeeded();
      await expect(page.locator('afro-site-assistant')).toBeVisible();
      await page.locator('afro-site-assistant').locator('#close').click();
      await expect.poll(() => page.locator('afro-site-assistant').evaluate(element => getComputedStyle(element).display)).toBe('none');

      if (theme === 'dark') {
        const colors = await page.evaluate(() => {
          const luminance = value => {
            const channels = value.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => {
              const normalized = channel / 255;
              return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
            });
            return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
          };
          const contrast = (foreground, background) => {
            const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
            return (lighter + 0.05) / (darker + 0.05);
          };
          const shell = document.getElementById('calcSaveShell');
          const shellStyle = getComputedStyle(shell);
          const card = shell.querySelector('.calc-save-card');
          const cardBackground = getComputedStyle(card).backgroundColor;
          const selectors = [
            ['heading', '.calc-save-head h3', shellStyle.backgroundColor],
            ['name label', '.calc-save-name-field label', shellStyle.backgroundColor],
            ['description', '.calc-save-head p', shellStyle.backgroundColor],
            ['dashboard link', '.calc-save-head a', shellStyle.backgroundColor],
            ['save status', '.calc-save-status', shellStyle.backgroundColor],
            ['saved title', '.calc-save-card h3', cardBackground],
            ['load action', '.calc-save-card-actions button[data-action="load"]'],
            ['delete action', '.calc-save-card-actions button[data-action="delete"]']
          ];
          return {
            backgroundImage: shellStyle.backgroundImage,
            samples: selectors.map(([name, selector, background]) => {
              const element = shell.querySelector(selector);
              const style = getComputedStyle(element);
              const surface = background || style.backgroundColor;
              return { name, foreground: style.color, background: surface, ratio: contrast(style.color, surface), height: element.getBoundingClientRect().height };
            })
          };
        });
        expect(colors.backgroundImage).toBe('none');
        for (const sample of colors.samples) {
          expect(sample.ratio, JSON.stringify(sample)).toBeGreaterThanOrEqual(4.5);
          if (sample.name.endsWith('action')) expect(sample.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  }
}

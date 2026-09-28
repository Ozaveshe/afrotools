const { test, expect } = require('@playwright/test');

async function settleFilterLayout(page) {
  // WebKit updates native Tab order after the newly visible/non-inert layout paints.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function expectVisibleFocus(locator) {
  await expect(locator).toBeFocused();
  await expect(locator).toBeVisible();
  await expect.poll(() => locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const atPoint = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return {
      insideViewport: rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight,
      receivesPointer: atPoint === element || element.contains(atPoint),
    };
  })).toEqual({ insideViewport: true, receivesPointer: true });
}

async function textContrast(locator) {
  return locator.evaluate(element => {
    const rgba = value => {
      const numbers = value.match(/[\d.]+/g).map(Number);
      return [numbers[0], numbers[1], numbers[2], numbers[3] == null ? 1 : numbers[3]];
    };
    const blend = (foreground, background) => foreground.slice(0, 3).map((value, index) =>
      value * foreground[3] + background[index] * (1 - foreground[3]));
    const ancestors = [];
    for (let node = element; node; node = node.parentElement) ancestors.unshift(node);
    let background = [255, 255, 255];
    for (const node of ancestors) background = blend(rgba(getComputedStyle(node).backgroundColor), background);
    const foreground = blend(rgba(getComputedStyle(element).color), background);
    const luminance = color => color.map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const first = luminance(foreground);
    const second = luminance(background);
    return { ratio: (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05), foreground, background };
  });
}

for (const width of [320, 390, 768, 1280]) {
  for (const theme of ['light', 'dark']) {
    test(`search filters and query stay accessible at ${width}px ${theme}`, async ({ page, baseURL }) => {
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.setViewportSize({ width, height: 850 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.addInitScript(selectedTheme => {
        localStorage.setItem('aft_theme', selectedTheme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
      }, theme);
      await page.route('**/*', route => {
        const sameOrigin = new URL(route.request().url()).origin === new URL(baseURL).origin;
        return sameOrigin ? route.continue() : route.abort();
      });
      await page.goto('/search/?q=Kenya%20PAYE', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const input = page.getByRole('textbox', { name: 'Search AfroTools' });
      const toggle = page.getByRole('button', { name: 'Filters', exact: true });
      const panel = page.locator('#filter-panel');
      const all = panel.locator('[data-filter="all"]');
      const finance = panel.locator('[data-filter="financial"]');
      const kenya = page.locator('#results-container a[href="/kenya/ke-paye"]');
      await expect(kenya).toBeVisible();
      await expect(page.locator('#results-container')).toHaveAttribute('aria-busy', 'false');
      const letterIcon = page.locator('#results-container a[href="/fr/kenya/ke-paye"] .rc-icon');
      await expect(letterIcon).toBeVisible();
      await expect(letterIcon).toHaveText('KE');
      const iconContrast = await textContrast(letterIcon);
      expect(iconContrast.ratio, `KE icon: ${JSON.stringify(iconContrast)}`).toBeGreaterThanOrEqual(4.5);
      const layout = await input.evaluate(element => ({
        fieldWidth: element.getBoundingClientRect().width,
        barWidth: element.closest('.search-bar').getBoundingClientRect().width,
        overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      }));
      expect(layout.overflow).toBe(0);
      expect(layout.fieldWidth).toBeGreaterThan(layout.barWidth * 0.6);
      await input.focus();
      await page.keyboard.press('Tab');
      await expectVisibleFocus(page.getByRole('button', { name: 'Clear search', exact: true }));
      for (const selector of ['.rc-desc', '.rc-desc mark', '.rc-name mark']) {
        const contrast = await textContrast(kenya.locator(selector).first());
        expect(contrast.ratio, `${selector}: ${JSON.stringify(contrast)}`).toBeGreaterThanOrEqual(4.5);
      }

      if (width < 641) {
        await expect(panel).toBeHidden();
        await expect(panel).toHaveAttribute('inert', '');
        await expect(panel.getByRole('button')).toHaveCount(0);
        await toggle.focus();
        await page.keyboard.press('Tab');
        await expectVisibleFocus(page.getByRole('combobox', { name: 'Sort results' }));
        await page.evaluate(() => {
          document.getElementById('search-input').focus({ preventScroll: true });
          const sort = document.getElementById('sort-select');
          window.scrollBy({ top: sort.getBoundingClientRect().top, behavior: 'instant' });
          sort.focus({ preventScroll: true });
        });
        await expectVisibleFocus(page.getByRole('combobox', { name: 'Sort results' }));
        await toggle.focus();
        await page.keyboard.press('Enter');
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(panel).toBeVisible();
        await expect(panel).not.toHaveAttribute('inert', '');
        await settleFilterLayout(page);
        await page.keyboard.press('Tab');
        await expectVisibleFocus(all);
        await finance.focus();
        await page.keyboard.press('Enter');
        await expectVisibleFocus(toggle);
        await expect(panel).toBeHidden();
        await expect(panel.getByRole('button')).toHaveCount(0);
        await expect(finance).toHaveAttribute('aria-pressed', 'true');
        await expect(page).toHaveURL(/f=financial/);
        await expect(kenya).toBeVisible();
        await toggle.click();
        await finance.focus();
        await page.keyboard.press('Escape');
        await expectVisibleFocus(toggle);
        await expect(panel).toBeHidden();
        await toggle.click();
        await toggle.click();
        await expectVisibleFocus(toggle);
        await expect(panel).toBeHidden();

        await page.setViewportSize({ width: 768, height: 850 });
        await expect(finance).toBeVisible();
        await expect(panel).not.toHaveAttribute('inert', '');
        await expect(panel).not.toHaveAttribute('aria-hidden', 'true');
        await settleFilterLayout(page);
        await finance.focus();
        await page.keyboard.press('Tab');
        await expectVisibleFocus(panel.locator('[data-filter="document-pdf"]'));
        await page.setViewportSize({ width, height: 850 });
        await expectVisibleFocus(toggle);
        await expect(panel.getByRole('button')).toHaveCount(0);
        await toggle.click();
      } else {
        await expect(toggle).toBeHidden();
        await expect(panel).toBeVisible();
        await expect(panel).not.toHaveAttribute('inert', '');
        await finance.focus();
        await page.keyboard.press('Enter');
        await expectVisibleFocus(finance);
        await expect(finance).toHaveAttribute('aria-pressed', 'true');
        await expect(kenya).toBeVisible();
      }

      await all.click();
      if (width < 641) await expectVisibleFocus(toggle);
      await page.getByRole('button', { name: 'Clear search', exact: true }).click();
      await expect(input).toBeFocused();
      await expect(input).toHaveValue('');
      await expect(page.locator('#results-meta')).toBeHidden();
      await input.fill('zzzzz-nonexistent-483');
      await expect(page.locator('#results-container')).toContainText('No tools found');
      await page.locator('#results-container [data-query="Nigeria PAYE"]').click();
      await expect(input).toHaveValue('Nigeria PAYE');
      await expect(page.locator('#results-container a[href="/nigeria/ng-salary-tax"]')).toBeVisible();
      expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth))).toBe(0);
      expect(pageErrors).toEqual([]);
    });
  }
}

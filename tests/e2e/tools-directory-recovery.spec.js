const { test, expect } = require('@playwright/test');

async function directoryCounts(page) {
  const summary = await page.locator('#directory-result-summary').innerText();
  const counts = summary.match(/^Showing (\d+) of (\d+) matching tools\.$/);
  expect(counts, summary).not.toBeNull();
  const shown = Number(counts[1]);
  const total = Number(counts[2]);
  expect(await page.locator('#tools-container .tc').count()).toBe(shown);
  expect(total).toBeGreaterThanOrEqual(shown);
  return { shown, total };
}

async function expectUsefulSearchFocus(search) {
  await expect(search).toBeFocused();
  await expect.poll(() => search.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth
      && (target === element || element.contains(target));
  })).toBe(true);
}

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`directory compound filters recover by keyboard and pointer at ${width}px ${theme}`, async ({ page, baseURL }) => {
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.setViewportSize({ width, height: 850 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const countryPreference = JSON.stringify({ code: 'NG', selectedAt: '2026-09-28T00:00:00.000Z' });
      await page.addInitScript(({ theme, countryPreference }) => {
        localStorage.setItem('aft_theme', theme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        localStorage.setItem('afrotools.countryContext.v1', countryPreference);
      }, { theme, countryPreference });
      await page.route('**/*', route => {
        const sameOrigin = new URL(route.request().url()).origin === new URL(baseURL).origin;
        return sameOrigin ? route.continue() : route.abort();
      });
      await page.goto('/tools/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const search = page.getByRole('textbox', { name: 'Search tools', exact: true });
      const country = page.getByRole('combobox', { name: 'Filter by country' });
      const status = page.getByRole('combobox', { name: 'Filter by status' });
      const language = page.getByRole('combobox', { name: 'Filter by language' });
      const sort = page.getByRole('combobox', { name: 'Sort tools' });
      const filterGroup = page.getByRole('group', { name: 'Filter tools by category or availability' });
      const all = filterGroup.locator('[data-cat="all"]');
      const finance = filterGroup.locator('[data-cat="financial"]');
      const live = filterGroup.locator('[data-cat="live"]');
      const empty = page.locator('#no-results');
      const reset = page.getByRole('button', { name: 'Clear search and filters', exact: true });
      await expect(all).toHaveAttribute('aria-pressed', 'true');
      await country.selectOption('all');
      const initial = await directoryCounts(page);
      expect(initial.shown).toBeGreaterThan(0);
      await expect(reset).toBeHidden();

      for (const activateBy of ['keyboard', 'pointer']) {
        await country.selectOption('KE');
        await status.selectOption('live');
        await language.selectOption('en');
        await sort.selectOption('name');
        if (activateBy === 'keyboard') {
          await finance.focus();
          await page.keyboard.press('Enter');
        } else await finance.click();
        await expect(finance).toHaveAttribute('aria-pressed', 'true');
        await expect(all).toHaveAttribute('aria-pressed', 'false');
        await expect(filterGroup.locator('[aria-pressed="true"]')).toHaveCount(1);
        await search.fill('Kenya PAYE');
        await expect(page.locator('#tools-container a[href="/kenya/ke-paye"]')).toBeVisible();
        const filtered = await directoryCounts(page);
        expect(filtered.total).toBeLessThan(initial.total);
        await search.fill('zzzzz-nonexistent-483');
        await expect(empty).toBeVisible();
        await expect(reset).toBeVisible();
        expect(await directoryCounts(page)).toEqual({ shown: 0, total: 0 });
        if (activateBy === 'keyboard') {
          await sort.focus();
          await page.keyboard.press('Tab');
          await expect(reset).toBeFocused();
          await page.keyboard.press('Enter');
        } else await reset.click();
        await expectUsefulSearchFocus(search);
        await expect(search).toHaveValue('');
        for (const control of [country, status, language]) await expect(control).toHaveValue('all');
        await expect(sort).toHaveValue('popular');
        await expect(all).toHaveAttribute('aria-pressed', 'true');
        await expect(finance).toHaveAttribute('aria-pressed', 'false');
        await expect(filterGroup.locator('[aria-pressed="true"]')).toHaveCount(1);
        await expect(empty).toBeHidden();
        await expect(page.locator('#tools-country-context')).toBeHidden();
        expect(await directoryCounts(page)).toEqual(initial);
      }

      await live.click();
      await expect(live).toHaveAttribute('aria-pressed', 'true');
      await expect(all).toHaveAttribute('aria-pressed', 'false');
      await status.selectOption('coming-soon');
      await expect(reset).toBeVisible();
      await reset.click();
      await expectUsefulSearchFocus(search);
      await expect(live).toHaveAttribute('aria-pressed', 'false');
      expect(await directoryCounts(page)).toEqual(initial);

      await page.goto('/tools/?goal=documents&country=KE', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#goal-context')).toBeVisible();
      await search.fill('zzzzz-nonexistent-483');
      await expect(reset).toBeVisible();
      await reset.click();
      await expectUsefulSearchFocus(search);
      await expect(page.locator('#goal-context')).toBeHidden();
      await expect(all).toBeVisible();
      await expect(search).toHaveAttribute('placeholder', /^Search [\d,+]+ tools\.\.\.$/);
      expect(new URL(page.url()).searchParams.has('goal')).toBe(false);
      expect(new URL(page.url()).searchParams.has('country')).toBe(false);
      expect(await directoryCounts(page)).toEqual(initial);
      expect(await page.evaluate(() => localStorage.getItem('afrotools.countryContext.v1'))).toBe(countryPreference);
      expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth))).toBe(0);
      expect(pageErrors).toEqual([]);
    });
  }
}

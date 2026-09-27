const { expect, test } = require('@playwright/test');

for (const width of [320, 390]) {
  test(`compliance calendar keeps weekdays aligned and opens deadlines by keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/tools/compliance-calendar/calendar.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    await expect(page.locator('#ccal-grid-body .ccal-grid-cell').first()).toBeVisible();

    const grid = await page.evaluate(() => {
      const wrap = document.querySelector('.ccal-grid-wrap');
      return {
        weekdays: [...document.querySelectorAll('.ccal-grid-head-cell')]
          .map((cell) => Math.round(cell.getBoundingClientRect().left)),
        columns: getComputedStyle(document.querySelector('.ccal-grid-body')).gridTemplateColumns.split(' ').length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        wrapWidth: wrap.clientWidth,
        contentWidth: wrap.scrollWidth,
        background: getComputedStyle(wrap).backgroundColor,
      };
    });
    expect(new Set(grid.weekdays).size).toBe(7);
    expect(grid.columns).toBe(7);
    expect(grid.overflow).toBeLessThanOrEqual(1);
    expect(grid.background).toBe('rgb(18, 32, 54)');
    if (width === 320) expect(grid.contentWidth).toBeGreaterThan(grid.wrapWidth);

    const deadline = page.locator('.ccal-dot').first();
    await expect(deadline).toBeVisible();
    await deadline.focus();
    await deadline.press('Enter');
    await expect(page.getByRole('dialog', { name: /.+/ }).first()).toBeVisible();
    await expect(page.locator('#ccal-drawer-close')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(deadline).toBeFocused();
  });

  test(`social media calendar keeps seven days together at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/tools/social-media-calendar/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    const lateStartMonth = await page.evaluate(() => {
      const year = new Date().getFullYear();
      return String(Array.from({ length: 12 }, (_, month) => month)
        .find((month) => new Date(year, month, 1).getDay() >= 4));
    });
    await page.locator('#startMonth').selectOption(lateStartMonth);
    await page.getByRole('button', { name: /Generate 30-Day Content Calendar/i }).click();
    await expect(page.locator('#calendar .cal-day').first()).toBeVisible();

    const grid = await page.evaluate(() => {
      const wrap = document.querySelector('.cal-scroll');
      return {
        weekdays: [...document.querySelectorAll('#calHeaders .cal-header')]
          .map((cell) => Math.round(cell.getBoundingClientRect().left)),
        columns: getComputedStyle(document.querySelector('#calendar')).gridTemplateColumns.split(' ').length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        wrapWidth: wrap.clientWidth,
        contentWidth: wrap.scrollWidth,
        scrollLeft: wrap.scrollLeft,
        firstDayLeft: document.querySelector('#calendar .cal-day').getBoundingClientRect().left,
        visibleLeft: wrap.getBoundingClientRect().left,
        visibleRight: wrap.getBoundingClientRect().right,
      };
    });
    expect(new Set(grid.weekdays).size).toBe(7);
    expect(grid.columns).toBe(7);
    expect(grid.contentWidth).toBeGreaterThan(grid.wrapWidth);
    expect(grid.overflow).toBeLessThanOrEqual(1);
    expect(grid.scrollLeft).toBeGreaterThan(0);
    expect(grid.firstDayLeft).toBeGreaterThanOrEqual(grid.visibleLeft - 1);
    expect(grid.firstDayLeft).toBeLessThan(grid.visibleRight);
    await expect(page.locator('.cal-scroll')).toHaveAttribute('tabindex', '0');
  });
}

test('compliance deadline drawer stays usable with cookie consent visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/compliance-calendar/calendar.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.removeItem('afrotools_cookie_consent'); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#afro-cookie-consent')).toBeVisible();
  await page.locator('.ccal-dot').first().click();
  await page.locator('#ccal-add-reminder').click();
  await expect(page.locator('#ccal-alert-modal')).toBeVisible();
  await expect(page.locator('#ccal-modal-close')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ccal-alert-modal')).toBeHidden();
});

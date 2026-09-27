const { test, expect } = require('@playwright/test');

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`planting calendar keeps months readable at ${width}px in ${theme} mode`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/tools/planting-calendar/');
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);

      await expect(page.locator('#calendarGrid .month-header')).toHaveCount(12);
      const calendar = page.locator('#calendarGrid');
      const state = await calendar.evaluate(element => ({
        columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
        cropCount: element.querySelectorAll('.crop-name').length,
        cellCount: element.querySelectorAll('.cell').length,
      }));
      expect(state.columns).toBe(6);
      expect(state.cropCount).toBeGreaterThan(0);
      expect(state.cellCount).toBe(state.cropCount * 12);
      await expect(calendar.locator('.cell[role="img"][aria-label]')).toHaveCount(state.cellCount);
      await expect(calendar.locator('.cell').first().locator('.cell-month')).toBeVisible();

      await page.selectOption('#country', { label: 'South Africa' });
      await expect(page.locator('#zone')).toHaveValue('southern');

      await page.selectOption('#zone', 'forest');
      await page.selectOption('#rainfall', 'bimodal');
      await expect(page.locator('#calendarGrid .crop-name')).not.toHaveCount(0);
      await expect(page.getByText(/two planting seasons shown/i)).toBeVisible();
      await expect(page.locator('#calendarStatus')).toContainText('Planting calendar updated:');
      const noteAndGrid = await calendar.evaluate(element => ({
        noteWidth: element.querySelector('.calendar-note').getBoundingClientRect().width,
        gridWidth: element.getBoundingClientRect().width,
      }));
      expect(noteAndGrid.noteWidth).toBeCloseTo(noteAndGrid.gridWidth, 0);

      await page.locator('#rainfall').focus();
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Tab');
      await expect(page.locator('#rainfall')).toHaveValue('unimodal');
      await expect(page.getByText(/forest zones often have two seasons/i)).toBeVisible();

      const layout = await page.evaluate(() => ({
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        legendRight: document.querySelector('.legend').getBoundingClientRect().right,
      }));
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport + 1);
      expect(layout.legendRight).toBeLessThanOrEqual(layout.viewport + 1);
      expect(errors).toEqual([]);
    });
  }
}

for (const width of [820, 960, 1280]) {
  test(`planting calendar retains twelve month columns at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/tools/planting-calendar/');
    const state = await page.locator('#calendarGrid').evaluate(element => ({
      columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
      pageWidth: document.documentElement.scrollWidth,
    }));
    expect(state.columns).toBe(12);
    expect(state.pageWidth).toBeLessThanOrEqual(width + 1);
  });
}

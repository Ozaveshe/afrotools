const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

for (const width of [320, 390, 1280]) for (const theme of ['light', 'dark']) {
  test(`Lobola budget and exports are easy to reach at ${width}px ${theme}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const origin = new URL(testInfo.project.use.baseURL).origin;
    await page.route('**/*', request => new URL(request.request().url()).origin === origin
      && ['GET', 'HEAD'].includes(request.request().method()) ? request.continue() : request.abort());
    await page.addInitScript(theme => {
      localStorage.setItem('aft_theme', theme);
      localStorage.setItem('afrotools_cookie_consent', 'declined');
    }, theme);
    await page.goto('/tools/lobola-calculator/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Build a respectful family plan' })).toBeVisible();
    const planner = await page.locator('#lobola-planner').boundingBox();
    if (width < 640) expect(planner.y).toBeLessThan(844);

    await page.locator('.lb-country-options summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.lb-country-options')).toHaveJSProperty('open', true);
    await expect(page.locator('.lb-pills').getByRole('link', { name: 'Zimbabwe (roora)' })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('.lb-country-options')).toHaveJSProperty('open', false);

    await page.getByRole('button', { name: 'Build my family plan', exact: true }).click();
    await expect(page.locator('#rTotal')).toHaveText('R 198,000');
    const geometry = await page.evaluate(() => {
      const result = document.querySelector('#results').getBoundingClientRect();
      const total = document.querySelector('#rTotal').getBoundingClientRect();
      const actions = document.querySelector('#resultActions').getBoundingClientRect();
      return { totalOffset: total.top - result.top, actionsOffset: actions.top - result.top,
        overflow: document.documentElement.scrollWidth > innerWidth,
        controls: [...document.querySelectorAll('#resultActions .btn')].map(button => {
          const rect = button.getBoundingClientRect();
          return { left: rect.left, right: rect.right, height: rect.height,
            textFits: button.scrollWidth <= button.clientWidth };
        }) };
    });
    expect(geometry.totalOffset).toBeLessThan(260);
    expect(geometry.actionsOffset).toBeLessThan(440);
    expect(geometry.overflow).toBe(false);
    for (const control of geometry.controls) {
      expect(control.left).toBeGreaterThanOrEqual(0);
      expect(control.right).toBeLessThanOrEqual(width);
      expect(control.height).toBeGreaterThanOrEqual(44);
      expect(control.textFits).toBe(true);
    }
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => (await axe.run({ include: [
      '.plan-result-heading', '.stat-row', '#resultActions'
    ] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations
      .map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) })));
    expect(violations).toEqual([]);
    await testInfo.attach('result-geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
    await page.getByRole('button', { name: 'Edit amounts' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#familyExpectation')).toBeFocused();
    await expect(page.locator('#results')).toBeVisible();
    await page.locator('#familyExpectation').fill('1000');
    await expect(page.locator('#results')).not.toBeVisible();
    await page.getByRole('button', { name: 'Build my family plan', exact: true }).click();
    await expect(page.locator('#rTotal')).toHaveText('R 1,100');
    const promised = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download summary TXT' }).click();
    const download = await promised;
    const filename = testInfo.outputPath('current-summary.txt');
    await download.saveAs(filename);
    expect(fs.readFileSync(filename, 'utf8')).toContain('R 1,100');
    await page.getByRole('button', { name: 'Edit amounts' }).click();
    await page.locator('#familyExpectation').fill('1000000000');
    await page.getByRole('button', { name: 'Build my family plan', exact: true }).click();
    expect(await page.locator('.stat-card').evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth))).toBe(true);
    await page.locator('#results').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('result.png') });
    expect(errors).toEqual([]);
  });
}

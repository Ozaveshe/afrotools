const { test, expect } = require('@playwright/test');

for (const route of ['/tools/za-uif/', '/fr/tools/za-uif/']) {
  test(`${route} UIF VIP calculator works at mobile width and in dark mode`, async ({ page }) => {
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible();
    const unlabeledInputs = await page.locator('.uif-panel input').evaluateAll(inputs => inputs.filter(input => !input.labels || input.labels.length === 0).length);
    expect(unlabeledInputs).toBe(0);
    await expect(page.locator('[role="tabpanel"]')).toHaveCount(3);
    await page.locator('#uif-remuneration').fill('25000');
    await page.locator('#uif-contribution-form button[type="submit"]').click();
    await expect(page.locator('#uif-contribution-results')).toContainText('177');
    await page.locator('.uif-tab[aria-controls="uif-benefit-panel"]').click();
    await page.locator('#uif-credits').fill('365');
    await page.locator('#uif-requested').fill('239');
    await page.locator('#uif-benefit-form button[type="submit"]').click();
    await expect(page.locator('#uif-benefit-results')).toContainText('239');
    await page.locator('.uif-tab[aria-controls="uif-maternity-panel"]').click();
    await page.locator('#uif-maternity-average').fill('30000');
    await page.locator('#uif-employer-pay').fill('25000');
    await page.locator('#uif-maternity-form button[type="submit"]').click();
    await expect(page.locator('#uif-maternity-results')).toContainText('121');
    await expect(page.locator('#uif-maternity-results')).toContainText(/19[\s\u00a0\u202f]890,41/);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await expect(page.locator('.uif-card').first()).toHaveCSS('background-color', 'rgb(18, 26, 39)');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    await page.setViewportSize({ width: 360, height: 800 });
    const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow360).toBe(false);
    expect(errors).toEqual([]);
  });
}

const { test, expect } = require('@playwright/test');

test('Gambia PAYE widget matches the reviewed app engine', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const consoleErrors = [];
  const nonGetRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', request => {
    if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.goto('/widgets/iframe/financial-gambia-paye.html?theme=dark');
  await expect(page.locator('[data-gm-result]')).toBeHidden();
  await page.locator('[data-gm-gross]').fill('50000');
  await page.locator('[data-gm-calculate]').click();
  await expect(page.locator('[data-gm-net]')).toHaveText('GMD 36,166.67');
  await expect(page.locator('[data-gm-paye]')).toHaveText('GMD 11,333.33');
  await expect(page.locator('[data-gm-employee]')).toHaveText('GMD 2,500.00');
  await expect(page.locator('[data-gm-employer]')).toHaveText('GMD 5,000.00');
  await expect(page.locator('[data-gm-iicf-result]')).toHaveText('GMD 15.00');
  await expect(page.locator('[data-gm-cost]')).toHaveText('GMD 55,015.00');

  await page.locator('[data-gm-scheme]').selectOption('FPS');
  await expect(page.locator('[data-gm-result]')).toBeHidden();
  await page.locator('[data-gm-calculate]').click();
  await expect(page.locator('[data-gm-net]')).toHaveText('GMD 38,666.67');
  await expect(page.locator('[data-gm-employee]')).toHaveText('GMD 0.00');
  await expect(page.locator('[data-gm-employer]')).toHaveText('GMD 7,500.00');
  await expect(page.locator('[data-gm-cost]')).toHaveText('GMD 57,515.00');

  await page.locator('[data-gm-gross]').fill('0');
  await page.locator('[data-gm-calculate]').click();
  await expect(page.locator('[data-gm-result]')).toBeHidden();
  await expect(page.locator('[data-gm-status]')).toContainText('greater than zero');

  const presentation = await page.locator('body').evaluate(node => ({
    background: getComputedStyle(node).backgroundColor,
    foreground: getComputedStyle(node).color,
    width: document.documentElement.scrollWidth
  }));
  expect(presentation.background).not.toBe(presentation.foreground);
  expect(presentation.width).toBeLessThanOrEqual(375);
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Gambia PAYE widget standalone fallback stays in formula parity', async ({ page }) => {
  await page.goto('/widgets/iframe/financial-gambia-paye.html');
  await page.evaluate(() => {
    delete window.AfroTools.gambiaPaye;
    const standalone = document.createElement('div');
    standalone.id = 'standalone-widget';
    document.body.appendChild(standalone);
    window.AfroWidgets.gm_paye(standalone);
  });
  const standalone = page.locator('#standalone-widget');
  await standalone.locator('[data-gm-gross]').fill('50000');
  await standalone.locator('[data-gm-calculate]').click();
  await expect(standalone.locator('[data-gm-net]')).toHaveText('GMD 36,166.67');
  await expect(standalone.locator('[data-gm-paye]')).toHaveText('GMD 11,333.33');
  await standalone.locator('[data-gm-scheme]').selectOption('FPS');
  await standalone.locator('[data-gm-calculate]').click();
  await expect(standalone.locator('[data-gm-net]')).toHaveText('GMD 38,666.67');
  await expect(standalone.locator('[data-gm-cost]')).toHaveText('GMD 57,515.00');
});

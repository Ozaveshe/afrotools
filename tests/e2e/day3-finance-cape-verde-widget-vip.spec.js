const { test, expect } = require('@playwright/test');

test('Cape Verde PAYE widget matches the reviewed app engine', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const consoleErrors = [];
  const nonGetRequests = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', request => { if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`); });
  await page.goto('/widgets/iframe/financial-cape-verde-paye.html?theme=dark');
  await expect(page.locator('[data-cv-result]')).toBeHidden();
  await page.locator('[data-cv-gross]').fill('100000');
  await page.locator('[data-cv-calculate]').click();
  await expect(page.locator('[data-cv-net]')).toHaveText('CVE 81,225');
  await expect(page.locator('[data-cv-tax]')).toHaveText('CVE 10,275');
  await expect(page.locator('[data-cv-employee]')).toHaveText('CVE 8,500');
  await expect(page.locator('[data-cv-employer]')).toHaveText('CVE 16,000');
  await expect(page.locator('[data-cv-cost]')).toHaveText('CVE 116,000');
  await page.locator('[data-cv-regime]').selectOption('DOMESTIC');
  await expect(page.locator('[data-cv-result]')).toBeHidden();
  await page.locator('[data-cv-calculate]').click();
  await expect(page.locator('[data-cv-net]')).toHaveText('CVE 81,725');
  await expect(page.locator('[data-cv-employee]')).toHaveText('CVE 8,000');
  await expect(page.locator('[data-cv-employer]')).toHaveText('CVE 15,000');
  await expect(page.locator('[data-cv-cost]')).toHaveText('CVE 115,000');
  await page.locator('[data-cv-gross]').fill('0');
  await page.locator('[data-cv-calculate]').click();
  await expect(page.locator('[data-cv-result]')).toBeHidden();
  await expect(page.locator('[data-cv-status]')).toContainText('greater than zero');
  const presentation = await page.locator('body').evaluate(node => ({ background: getComputedStyle(node).backgroundColor, foreground: getComputedStyle(node).color, width: document.documentElement.scrollWidth }));
  expect(presentation.background).not.toBe(presentation.foreground);
  expect(presentation.width).toBeLessThanOrEqual(375);
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Cape Verde PAYE widget standalone fallback stays in formula parity', async ({ page }) => {
  await page.goto('/widgets/iframe/financial-cape-verde-paye.html');
  await page.evaluate(() => {
    delete window.AfroTools.capeVerdePaye;
    const standalone = document.createElement('div');
    standalone.id = 'standalone-widget';
    document.body.appendChild(standalone);
    window.AfroWidgets.cv_paye(standalone);
  });
  const standalone = page.locator('#standalone-widget');
  await standalone.locator('[data-cv-gross]').fill('36607');
  await standalone.locator('[data-cv-calculate]').click();
  await expect(standalone.locator('[data-cv-tax]')).toHaveText('CVE 100');
  await standalone.locator('[data-cv-gross]').fill('100000');
  await standalone.locator('[data-cv-calculate]').click();
  await expect(standalone.locator('[data-cv-net]')).toHaveText('CVE 81,225');
  await expect(standalone.locator('[data-cv-cost]')).toHaveText('CVE 116,000');
});

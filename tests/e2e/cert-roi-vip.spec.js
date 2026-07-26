const { test, expect } = require('@playwright/test');

const route = '/tools/cert-roi/';

test.beforeEach(async ({ page }) => {
  await page.goto(route);
  await expect.poll(() => page.evaluate(() => window.AFROTOOLS_CERT_ROI_VIP)).toBe(true);
});

async function fillScenario(page) {
  await page.locator('#crName').fill('My credential');
  await page.locator('#crCurrency').fill('KES');
  await page.locator('#crDirectCost').fill('1000');
  await page.locator('#crOtherCost').fill('200');
  await page.locator('#crStudyHours').fill('100');
  await page.locator('#crHourValue').fill('10');
  await page.locator('#crAnnualUplift').fill('1200');
  await page.locator('#crStudyMonths').fill('6');
  await page.locator('#crDelayMonths').fill('3');
  await page.locator('#crHorizon').fill('3');
}

test('calculates investment, timing, net gain, ROI and calendar payback', async ({ page }) => {
  await fillScenario(page);
  await page.getByRole('button', { name: 'Calculate this scenario' }).click();
  await expect(page.locator('#crStats')).toContainText('KES 2,200');
  await expect(page.locator('#crStats')).toContainText('KES 2,700');
  await expect(page.locator('#crStats')).toContainText('KES 500');
  await expect(page.locator('#crStats')).toContainText('22.7%');
  await expect(page.locator('#crVerdict')).toContainText('22 months after income change begins');
  await expect(page.locator('#crVerdict')).toContainText('month 31');
  await expect(page.locator('#crResultContext')).toContainText('income change begins at month 9');
});

test('reports no payback for a zero income-change scenario', async ({ page }) => {
  await fillScenario(page);
  await page.locator('#crAnnualUplift').fill('0');
  await page.getByRole('button', { name: 'Calculate this scenario' }).click();
  await expect(page.locator('#crStats')).toContainText('-100%');
  await expect(page.locator('#crVerdict')).toContainText('No payback is calculated');
});

test('rejects missing investment and invalid boundaries', async ({ page }) => {
  await page.locator('#crHorizon').fill('11');
  await page.getByRole('button', { name: 'Calculate this scenario' }).click();
  await expect(page.locator('#crStatus')).toContainText('between 1 and 10 years');
  await expect(page.locator('#crResults')).not.toHaveClass(/show/);
});

test('contains no market cost, salary, return or FX presets', async ({ page }) => {
  const body = page.locator('body');
  await expect(body).not.toContainText('Typical premium');
  await expect(body).not.toContainText('built-in FX');
  await expect(body).not.toContainText('$10,000');
  await expect(body).not.toContainText('highest ROI');
  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.locator('.cr-warning')).toContainText('Scenario, not forecast');
});

test('saving is explicit and clearable', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#crDirectCost').fill('1000');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.certRoi.v3'))).toBe(null);
  await page.getByRole('button', { name: 'Save on this device' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.certRoi.v3'))).not.toBe(null);
  await page.getByRole('button', { name: 'Clear saved scenario' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.certRoi.v3'))).toBe(null);
});

test('escapes user-provided certification and currency labels', async ({ page }) => {
  await fillScenario(page);
  await page.locator('#crName').fill('\"><img src=x onerror=window.__certXss=1>');
  await page.locator('#crCurrency').fill('\"><img src=x onerror=window.__certXss=1>');
  await page.getByRole('button', { name: 'Calculate this scenario' }).click();
  expect(await page.evaluate(() => window.__certXss)).toBeUndefined();
  await expect(page.locator('#crResults img')).toHaveCount(0);
});

test('exports local text and a valid browser PDF', async ({ page }) => {
  await fillScenario(page);
  await page.getByRole('button', { name: 'Calculate this scenario' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download TXT' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('certification-roi-scenario.txt');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(10000);
});

test('is mobile-safe, dark-capable, labelled and self-hosted', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await expect(page.locator('.cr-card').first()).toHaveCSS('background-color', 'rgb(16, 35, 55)');
  await expect(page.getByLabel('Training, exam and registration cost')).toBeVisible();
  expect(await page.locator('.cr-form-card input').count()).toBe(10);
  expect(await page.locator('.cr-form-card label[for]').count()).toBe(10);
  expect(await page.locator('.cr-form-card input').evaluateAll((inputs) => inputs.every((input) => {
    const label = document.querySelector(`label[for="${input.id}"]`);
    return Boolean(input.id && label && label.textContent.trim());
  }))).toBe(true);
  await expect(page.locator('#crActionStatus')).toHaveAttribute('aria-live', 'polite');
  const head = await page.locator('head').innerHTML();
  expect(head).not.toContain('fonts.googleapis.com');
  expect(head).toContain('/assets/fonts/typography.css');
});

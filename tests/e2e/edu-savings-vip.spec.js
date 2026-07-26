const { test, expect } = require('@playwright/test');

const route = '/tools/edu-savings/';

test.beforeEach(async ({ page }) => {
  await page.goto(route);
  await expect.poll(() => page.evaluate(() => window.AFROTOOLS_EDU_SAVINGS_VIP)).toBe(true);
});

async function fillZeroGrowth(page) {
  await page.locator('#esGoal').fill('Example goal');
  await page.locator('#esCurrency').fill('KES');
  await page.locator('#esTodayCost').fill('10000');
  await page.locator('#esMonths').fill('12');
  await page.locator('#esInflation').fill('0');
  await page.locator('#esCurrent').fill('1000');
  await page.locator('#esMonthly').fill('500');
  await page.locator('#esGrowth').fill('0');
  await page.locator('#esTiming').selectOption('end');
}

test('separates target, fund, difference and required contribution at zero growth', async ({ page }) => {
  await fillZeroGrowth(page);
  await page.getByRole('button', { name: 'Calculate this savings scenario' }).click();
  await expect(page.locator('#esStats')).toContainText('KES 10,000');
  await expect(page.locator('#esStats')).toContainText('KES 7,000');
  await expect(page.locator('#esStats')).toContainText('KES -3,000');
  await expect(page.locator('#esStats')).toContainText('KES 750');
  await expect(page.locator('#esBreakdown tr').filter({ hasText: 'Modeled nominal growth' })).toContainText('KES 0');
  await expect(page.locator('#esVerdict')).toContainText('not a contribution recommendation');
});

test('compounds education-cost inflation for the exact entered timing', async ({ page }) => {
  await fillZeroGrowth(page);
  await page.locator('#esMonths').fill('24');
  await page.locator('#esInflation').fill('10');
  await page.getByRole('button', { name: 'Calculate this savings scenario' }).click();
  await expect(page.locator('#esStats')).toContainText('KES 12,100');
  await expect(page.locator('#esResultContext')).toContainText('24 months (2 years)');
});

test('rejects invalid targets and fractional month counts', async ({ page }) => {
  await page.locator('#esTodayCost').fill('10000');
  await page.locator('#esMonths').fill('12.5');
  await page.getByRole('button', { name: 'Calculate this savings scenario' }).click();
  await expect(page.locator('#esStatus')).toContainText('whole number');
  await expect(page.locator('#esResults')).not.toHaveClass(/show/);
});

test('contains no country, tuition, product-return or insurance presets', async ({ page }) => {
  const body = page.locator('body');
  await expect(body).not.toContainText('Typical return');
  await expect(body).not.toContainText('education insurance plans for higher returns');
  await expect(body).not.toContainText('Multi-Country');
  await expect(page.locator('#esCountry')).toHaveCount(0);
  await expect(page.locator('.es-warning')).toContainText('Growth is not guaranteed');
});

test('saving is explicit and clearable', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#esTodayCost').fill('10000');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.eduSavings.v3'))).toBe(null);
  await page.getByRole('button', { name: 'Save on this device' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.eduSavings.v3'))).not.toBe(null);
  await page.getByRole('button', { name: 'Clear saved scenario' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.eduSavings.v3'))).toBe(null);
});

test('escapes user-provided goal and currency labels', async ({ page }) => {
  await fillZeroGrowth(page);
  await page.locator('#esGoal').fill('\"><img src=x onerror=window.__savingsXss=1>');
  await page.locator('#esCurrency').fill('\"><img src=x onerror=window.__savingsXss=1>');
  await page.getByRole('button', { name: 'Calculate this savings scenario' }).click();
  expect(await page.evaluate(() => window.__savingsXss)).toBeUndefined();
  await expect(page.locator('#esResults img')).toHaveCount(0);
});

test('exports local text and a valid browser PDF', async ({ page }) => {
  await fillZeroGrowth(page);
  await page.getByRole('button', { name: 'Calculate this savings scenario' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download TXT' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('education-savings-projection.txt');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(10000);
});

test('is mobile-safe, dark-capable, fully labelled and self-hosted', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await expect(page.locator('.es-card').first()).toHaveCSS('background-color', 'rgb(16, 35, 55)');
  await expect(page.getByLabel('Education cost in today’s money')).toBeVisible();
  expect(await page.locator('.es-form-card input, .es-form-card select').count()).toBe(9);
  expect(await page.locator('.es-form-card label[for]').count()).toBe(9);
  expect(await page.locator('.es-form-card input, .es-form-card select').evaluateAll((controls) => controls.every((control) => {
    const label = document.querySelector(`label[for="${control.id}"]`);
    return Boolean(control.id && label && label.textContent.trim());
  }))).toBe(true);
  await expect(page.locator('#esActionStatus')).toHaveAttribute('aria-live', 'polite');
  const head = await page.locator('head').innerHTML();
  expect(head).not.toContain('fonts.googleapis.com');
  expect(head).toContain('/assets/fonts/typography.css');
});

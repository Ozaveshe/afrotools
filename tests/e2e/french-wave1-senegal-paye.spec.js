const { test, expect } = require('@playwright/test');

test.describe('French Wave 1 Senegal payroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/senegal/calculateur-salaire-net');
    await page.waitForLoadState('domcontentloaded');
  });

  test('uses capped IPRES and the 43% IRPP band above 50m taxable', async ({ page }) => {
    await page.fill('#grossSalary', '60000000');
    await page.click('.calc-btn');
    const result = await page.evaluate(() => window.RESULT);
    expect(result.ipres).toBe(290304);
    expect(result.bandBreakdown.at(-1).rate).toBe(0.43);
    expect(result.css).toBe(0);
    await expect(page.locator('#resContent')).not.toContainText('CSS');
  });

  test('does not expose salary-sharing AI or an email PDF gate', async ({ page }) => {
    await expect(page.locator('[onclick="getAI()"]')).toHaveCount(0);
    await expect(page.locator('#pdfEmail, #pdfModal')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Propulsé par Claude');
  });

  test('includes family relief and TRIMF, then invalidates an edited result', async ({ page }) => {
    await page.fill('#grossSalary', '7500000');
    await page.selectOption('#familyStatus', 'married');
    await page.fill('#dependentChildren', '2');
    await page.selectOption('#soleTaxableEarner', 'yes');
    await page.fill('#spousesWithoutIncome', '1');
    await page.click('.calc-btn');
    const result = await page.evaluate(() => window.RESULT);
    expect(result.familyParts).toBe(3);
    expect(result.familyReduction).toBe(458500);
    expect(result.trimf).toBe(36000);
    expect(result.netAnnual).toBe(5798196);
    await expect(page.locator('#resAmount')).toContainText('483');
    await expect(page.locator('#resContent')).toContainText('TRIMF');
    await page.fill('#dependentChildren', '1');
    expect(await page.evaluate(() => window.RESULT)).toBeNull();
    await expect(page.locator('#calculationStatus')).toContainText('recalculez');
    await expect(page.locator('save-result-button')).toBeHidden();
  });

  test('reverse mode keeps annual input and monthly headline units consistent', async ({ page }) => {
    await page.fill('#grossSalary', '7500000');
    await page.selectOption('#familyStatus', 'married');
    await page.fill('#dependentChildren', '2');
    await page.selectOption('#soleTaxableEarner', 'yes');
    await page.fill('#spousesWithoutIncome', '1');
    await page.click('.calc-btn');
    await page.click('#netModeButton');
    await expect(page.locator('#grossSalary')).toHaveValue('5798196');
    await expect(page.locator('#salarySlider')).toHaveAttribute('aria-label', 'Salaire net annuel souhaité');
    await page.fill('#grossSalary', '7500000');
    await page.click('.calc-btn');
    const result = await page.evaluate(() => window.RESULT);
    expect(result.targetNetAnnual).toBe(7500000);
    expect(result.netAnnual).toBeGreaterThanOrEqual(7500000);
    const headline = Number((await page.locator('#resAmount').innerText()).replace(/\D/g, ''));
    expect(headline).toBe(Math.round(result.gross / 12));
    expect(headline).toBeLessThan(1000000);
    await page.click('#grossModeButton');
    await expect(page.locator('#salaryInputHint')).toContainText('Avant');
  });

  test('fits a small mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  });
});

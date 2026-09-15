const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

test('Zambia uses basic salary for NHIMA and clears invalid results', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/zambia/zm-paye');
  await page.locator('#grossSalary').fill('180000');
  await page.locator('#basicSalary').fill('120000');
  await page.locator('.calc-btn').click();
  await expect(page.locator('#calculationStatus')).toContainText('basic salary entered');
  expect(await page.evaluate(() => ({ tax: RESULT.annualPAYE, nhima: RESULT.nhima, net: RESULT.netAnnual })))
    .toEqual({ tax: 38112, nhima: 1200, net: 131688 });
  await expect(page.locator('#resContent')).toContainText('NHIMA');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const exportPlan = await page.evaluate(async () => {
    let captured;
    window.AfroTools = window.AfroTools || {};
    window.AfroTools.pdf = { generate: async (plan) => { captured = plan; } };
    await downloadPdfSummary();
    return captured;
  });
  expect(exportPlan.skipGate).toBe(true);
  expect(exportPlan.sections[0].rows.find(row => row[0] === 'NHIMA employee')[1]).toContain('1,200');
  expect(exportPlan.sections[1].rows.find(row => row[0] === 'NHIMA employee')[1]).toContain('100');
  await page.locator('#basicSalary').fill('180001');
  await page.locator('.calc-btn').click();
  await expect(page.locator('#calculationStatus')).toContainText('between zero');
  await expect(page.locator('#resultsCard')).toBeHidden();
  expect(await page.evaluate(() => RESULT)).toBeNull();
  await expect(page.locator('#aiBtn')).toBeDisabled();
  await page.locator('#basicSalary').fill('');
  await page.locator('.calc-btn').click();
  await expect(page.locator('#resultsCard')).toBeVisible();
  await expect(page.locator('#calculationStatus')).toContainText('gross salary treated as basic');
});

test('French Zambia exposes NHIMA and stays within a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/fr/zambia/zm-paye');
  await page.locator('#frPayeGross').fill('15000');
  await page.locator('#frPayeBasic').fill('10000');
  await page.locator('[data-calculate]').click();
  await expect(page.locator('[data-result-rows]')).toContainText('NHIMA salariée');
  await expect(page.locator('[data-results]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#frPayeBasic').fill('15001');
  await page.locator('[data-calculate]').click();
  await expect(page.locator('[data-error]')).toContainText('salaire de base');
  await expect(page.locator('[data-results]')).toBeHidden();
});

test('Zambia reverse calculation preserves basic salary and rejects impossible targets', async ({ page }) => {
  await page.goto('/zambia/zm-paye');
  await page.getByRole('button', { name: 'Net → Gross', exact: true }).click();
  await page.locator('#grossSalary').fill('131688');
  await page.locator('#basicSalary').fill('120000');
  await page.locator('.calc-btn').click();
  expect(await page.evaluate(() => RESULT.gross)).toBeCloseTo(180000, 2);
  await expect(page.locator('#grossSalary')).toHaveValue('131688');
  await page.locator('#grossSalary').fill('1000');
  await page.locator('.calc-btn').click();
  await expect(page.locator('#calculationStatus')).toContainText('too low');
  expect(await page.evaluate(() => RESULT)).toBeNull();
  await expect(page.locator('#resultsCard')).toBeHidden();
});

test('Zambia PDF contains NHIMA and the salary basis without a gate', async ({ page }) => {
  await page.goto('/zambia/zm-paye');
  await page.locator('#grossSalary').fill('180000');
  await page.locator('#basicSalary').fill('120000');
  await page.locator('.calc-btn').click();
  const downloaded = page.waitForEvent('download');
  await page.locator('#pdfBtn').click();
  const stream = await (await downloaded).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const parsed = await pdfParse(Buffer.concat(chunks));
  expect(parsed.text).toContain('NHIMA employee');
  expect(parsed.text).toContain('Basic salary used for NHIMA');
  expect(parsed.text).toContain('120,000');
  expect(parsed.text).toContain('1,200');
  expect(parsed.text).toContain('Planning estimate');
  await expect(page.locator('#pdfModal')).not.toHaveClass(/on/);
});

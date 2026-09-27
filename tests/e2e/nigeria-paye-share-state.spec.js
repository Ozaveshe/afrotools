const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 } });

async function expectDeductions(page, expected) {
  for (const [name, enabled] of Object.entries(expected)) {
    const toggle = page.locator(`[data-tog="${name}"]`);
    await expect(toggle).toHaveAttribute('aria-checked', String(enabled));
    if (enabled) await expect(toggle).toHaveClass(/\bon\b/);
    else await expect(toggle).not.toHaveClass(/\bon\b/);
  }
}

test('AI handoff parameters leave default deductions intact', async ({ page }) => {
  await page.goto('/nigeria/ng-salary-tax?source=ask&prefill=1');
  await expectDeductions(page, { pension: true, nhf: true, nhis: true });
  await page.waitForTimeout(900); // Include the delayed script-chain restore path.
  await expectDeductions(page, { pension: true, nhf: true, nhis: true });

  const salary = page.locator('#grossSalary');
  await salary.focus();
  await salary.fill('6,000,000');
  await expect(salary).toHaveValue('6,000,000');
  await page.locator('#calcBtn').click();
  await expect.poll(() => page.evaluate(() => window.RESULT?.statutory)).toBe(930000);
});

test('a shared scenario restores each statutory deduction independently', async ({ page }) => {
  await page.goto('/nigeria/ng-salary-tax?g=6000000&r=pita&p=1&h=1');
  await expect.poll(() => page.evaluate(() => window.RESULT?.statutory)).toBe(780000);
  await expectDeductions(page, { pension: true, nhf: false, nhis: true });
  await expect(page.locator('#nhisField')).toHaveClass(/\bon\b/);
});

test('an all-off shared scenario stays off in the controls and result', async ({ page }) => {
  await page.goto('/nigeria/ng-salary-tax?g=6000000&r=pita');
  await expect.poll(() => page.evaluate(() => window.RESULT?.statutory)).toBe(0);
  await expectDeductions(page, { pension: false, nhf: false, nhis: false });
});

test('shared custom deductions restore their amounts and visible fields', async ({ page }) => {
  await page.goto('/nigeria/ng-salary-tax?g=6000000&r=pita&li=120000&hl=200000');
  await expect.poll(() => page.evaluate(() => window.RESULT?.statutory)).toBe(320000);
  await expectDeductions(page, { pension: false, nhf: false, nhis: false, life: true, homeloan: true });
  await expect(page.locator('#lifeAmt')).toHaveValue('120,000');
  await expect(page.locator('#homeloanAmt')).toHaveValue('200,000');
  await expect(page.locator('#lifeField')).toHaveClass(/\bon\b/);
  await expect(page.locator('#homeloanField')).toHaveClass(/\bon\b/);
});

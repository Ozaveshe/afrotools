const { test, expect } = require('@playwright/test');
for (const route of ['/tools/minimum-wage/', '/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/']) test(`minimum wage selected sector and invalidation ${route}`, async ({page}) => {
  await page.goto(route);
  await page.locator('#country').selectOption('ZA');
  await page.locator('#state-select').selectOption('epwp');
  await page.locator('#compliance-toggle-btn').click();
  await page.locator('#compliance-salary').fill('4000');
  await page.locator('[onclick="checkCompliance()"]').click();
  await expect(page.locator('#compliance-result')).toHaveClass(/pass/);
  await expect(page.locator('#cr-detail')).toContainText('EPWP');
  expect((await page.locator('#cr-detail').innerText()).replace(/,/g,'')).toContain('2925.12'); // 16.62 * 8 * 22
  await page.locator('#state-select').selectOption('general');
  await expect(page.locator('#compliance-result')).not.toHaveClass(/pass|fail/);
  await page.locator('[onclick="checkCompliance()"]').click();
  await expect(page.locator('#compliance-result')).toHaveClass(/fail/);
  for (const width of [320,390]) {
    await page.setViewportSize({width,height:800});
    await page.locator('#state-select').selectOption('epwp');
    await page.locator('[onclick="checkCompliance()"]').click();
    await expect(page.locator('#compliance-result')).toHaveClass(/pass/);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  await page.locator('#compliance-salary').fill('');
  await page.locator('[onclick="checkCompliance()"]').click();
  await expect(page.locator('#compliance-result')).not.toHaveClass(/pass|fail/);
  await expect(page.locator('#compliance-salary')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#compliance-salary')).toBeFocused();
});

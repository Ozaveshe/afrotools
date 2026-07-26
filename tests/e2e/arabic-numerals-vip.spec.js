const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.__copied = text; } } });
  });
  await page.goto('/tools/arabic-numerals/');
});

test('distinguishes all three families and preserves mixed surrounding text', async ({ page }) => {
  const input = page.getByLabel('Text containing digits');
  await input.fill('Ref 007 / ١٢ / ۴۵, A-9');
  await expect(page.locator('#numeralDetected')).toHaveText('Detected: Western, Arabic-Indic, Eastern Arabic-Indic.');
  const values = page.locator('#results .val');
  await expect(values.nth(0)).toHaveText('Ref 007 / 12 / 45, A-9');
  await expect(values.nth(1)).toHaveText('Ref ٠٠٧ / ١٢ / ٤٥, A-٩');
  await expect(values.nth(2)).toHaveText('Ref ۰۰۷ / ۱۲ / ۴۵, A-۹');
  await expect(values.nth(1)).toHaveCSS('unicode-bidi', 'isolate');
});

test('example and clear controls are keyboard-operable and accurately named', async ({ page }) => {
  await page.getByRole('button', { name: 'Use mixed-script example' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Text containing digits')).toHaveValue('Invoice 007 / ١٢ / ۴۵');
  await page.getByRole('button', { name: 'Clear input' }).click();
  await expect(page.getByLabel('Text containing digits')).toHaveValue('');
  await expect(page.locator('#resultCard')).toBeHidden();
});

test('copies an exact isolated output without persisting input', async ({ page }) => {
  await page.getByLabel('Text containing digits').fill('ID ٠١');
  await page.getByRole('button', { name: 'Copy western digits' }).click();
  expect(await page.evaluate(() => window.__copied)).toBe('ID 01');
  await expect(page.locator('#numeralStatus')).toHaveText('Western digits copied.');
  const stored = await page.evaluate(() => JSON.stringify({
    local: Object.entries(localStorage),
    session: Object.entries(sessionStorage)
  }));
  expect(stored).not.toContain('ID ٠١');
});

test('fits 320px and exposes the reference table headings', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByLabel('Text containing digits').fill('123');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole('columnheader', { name: 'Arabic-Indic', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Eastern Arabic-Indic', exact: true })).toBeVisible();
});

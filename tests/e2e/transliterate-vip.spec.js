const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.__copied = text; } } });
  });
  await page.goto('/tools/transliterate/');
});

const fixtures = [
  { option: "Ge'ez (Amharic/Tigrinya)", value: 'geez', input: 'selam', output: 'ሰላም', cells: 147 },
  { option: 'Tifinagh (Amazigh/Berber)', value: 'tifinagh', input: 'azul', output: 'ⴰⵣⵓⵍ', cells: 26 },
  { option: 'Arabic letters (approximate Latin mapping)', value: 'arabic', input: 'bint', output: 'بِنت', cells: 30 }
];

for (const fixture of fixtures) {
  test(`${fixture.value} exposes its own fixture, limits and keyboard grid`, async ({ page }) => {
    await page.getByLabel('Output script mapping').selectOption(fixture.value);
    await expect(page.locator('.char-cell')).toHaveCount(fixture.cells);
    await page.getByRole('button', { name: 'Try Sample' }).click();
    await expect(page.getByLabel('Latin input')).toHaveValue(fixture.input);
    await expect(page.locator('#output')).toHaveText(fixture.output);
    await expect(page.locator('#sampleHint')).toContainText('not a vocabulary or pronunciation claim');
    await expect(page.locator('#mappingLimit')).toBeVisible();
  });
}

test('preserves and reports unsupported Latin characters instead of guessing', async ({ page }) => {
  await page.getByLabel('Latin input').fill('Cv!');
  await expect(page.locator('#output')).toHaveText('Cv!');
  await expect(page.locator('#unsupportedNotice')).toHaveText('Preserved unsupported Latin characters: c, v.');
});

test('Arabic output is isolated RTL, copy is exact, and raw text is not stored', async ({ page }) => {
  await page.getByLabel('Output script mapping').selectOption('arabic');
  await page.getByLabel('Latin input').fill('bint');
  await expect(page.locator('#output')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('#output')).toHaveCSS('direction', 'rtl');
  await page.getByRole('button', { name: 'Copy Output' }).click();
  expect(await page.evaluate(() => window.__copied)).toBe('بِنت');
  const stored = await page.evaluate(() => JSON.stringify({ local: Object.entries(localStorage), session: Object.entries(sessionStorage) }));
  expect(stored).not.toContain('bint');
});

test('token buttons are named, keyboard-operable and fit at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const first = page.locator('.char-cell').first();
  await expect(first).toHaveAccessibleName(/Insert Latin token/);
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Latin input')).not.toHaveValue('');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

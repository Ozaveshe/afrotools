const { test, expect } = require('@playwright/test');

const routes = [
  '/tools/amharic-translator/',
  '/tools/zulu-translator/',
  '/tools/arabic-numerals/',
  '/tools/transliterate/'
];

async function assertResponsive(page, width, colorScheme = 'light') {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.keyboard.press('Tab');
  const hasInteractiveFocus = await page.evaluate(() => {
    let active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
    return Boolean(active && ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'].includes(active.tagName));
  });
  expect(hasInteractiveFocus).toBe(true);
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
}

for (const route of routes) {
  test(`${route} is console-clean and responsive at 320/375 with dark mode and 200% text`, async ({ page }) => {
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    await assertResponsive(page, 320);
    await assertResponsive(page, 375, 'dark');
    expect(errors).toEqual([]);
  });
}

test('Amharic local search, control labels, copy, TXT and print-to-PDF path', async ({ page }) => {
  let cloudRequests = 0;
  await page.route('**/api/translate', (route) => { cloudRequests += 1; route.abort(); });
  await page.addInitScript(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.__copiedText = text; } } });
    window.print = () => { window.__printed = true; };
  });
  await page.goto('/tools/amharic-translator/');
  await page.getByLabel('Search English, Amharic or romanisation').fill('ሰላም');
  await expect(page.locator('.phrase:visible')).toHaveCount(1);
  await page.getByRole('button', { name: 'Copy visible rows' }).click();
  expect(await page.evaluate(() => window.__copiedText)).toContain('ሰላም');
  const download = page.waitForEvent('download');
  await page.locator('#downloadPhrasebook').click();
  expect((await download).suggestedFilename()).toBe('afrotools-amharic-phrasebook.txt');
  await page.locator('#printPhrasebook').click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
  await expect(page.getByLabel(/Copy Amharic phrase/)).toBeVisible();
  expect(cloudRequests).toBe(0);
});

test('isiZulu search and every generated visible button has an accessible name', async ({ page }) => {
  await page.goto('/tools/zulu-translator/');
  await page.getByLabel('Search English, isiZulu or pronunciation cue').fill('Sawubona');
  await expect(page.locator('.phrase:visible')).toHaveCount(2);
  const unnamed = await page.locator('button:visible').evaluateAll((buttons) => buttons.filter((button) => !(button.getAttribute('aria-label') || button.textContent.trim() || button.getAttribute('title'))).length);
  expect(unnamed).toBe(0);
  await expect(page.getByText('132 app-local draft phrase rows across 15 categories.')).toBeVisible();
  await expect(page.getByText(/has not received entry-level provenance or qualified isiZulu review/)).toBeVisible();
});

for (const phrasebook of [
  { route: '/tools/amharic-translator/', label: 'Amharic' },
  { route: '/tools/zulu-translator/', label: 'isiZulu' }
]) {
  test(`${phrasebook.label} cloud translation requires fresh consent and does not persist raw text`, async ({ page }) => {
    const requests = [];
    await page.route('**/api/translate', async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ translatedText: 'Synthetic output', provider: 'test', characters: 16 })
      });
    });
    await page.goto(phrasebook.route);
    const raw = `Synthetic private ${phrasebook.label} fixture`;
    await page.locator('#translateInput').fill(raw);
    await page.locator('#translateInput').press('Enter');
    expect(requests).toHaveLength(0);
    await page.locator('[data-external-translation-accept]').check();
    await page.locator('#translateBtn').click();
    await expect.poll(() => requests.length).toBe(1);
    expect(requests[0].text).toBe(raw);
    expect(await page.evaluate((value) => ({
      local: Object.values(localStorage).some((item) => String(item).includes(value)),
      session: Object.values(sessionStorage).some((item) => String(item).includes(value)),
      url: location.href.includes(value) || location.href.includes(encodeURIComponent(value))
    }), raw)).toEqual({ local: false, session: false, url: false });
    await page.reload();
    await expect(page.locator('[data-external-translation-accept]')).not.toBeChecked();
    await expect(page.locator('#translateBtn')).toBeDisabled();
  });
}

test('Arabic numeral route preserves mixed bidi text across all three digit families', async ({ page }) => {
  await page.addInitScript(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.__copiedText = text; } } });
    window.print = () => { window.__printed = true; };
  });
  await page.goto('/tools/arabic-numerals/');
  await page.getByLabel('Text containing digits').fill('رقم ١٢ / ref ۳۴ / 56');
  await expect(page.getByText('رقم 12 / ref 34 / 56', { exact: true })).toBeVisible();
  await expect(page.getByText('رقم ١٢ / ref ٣٤ / ٥٦', { exact: true })).toBeVisible();
  await expect(page.getByText('رقم ۱۲ / ref ۳۴ / ۵۶', { exact: true })).toBeVisible();
  await expect(page.getByText(/Mixed digit families converted/)).toBeVisible();
  await page.getByRole('button', { name: 'Copy all formats' }).click();
  expect(await page.evaluate(() => window.__copiedText)).toContain('Eastern Arabic-Indic:');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download TXT' }).click();
  expect((await download).suggestedFilename()).toBe('afrotools-digit-shapes.txt');
  await page.getByRole('button', { name: 'Print / save PDF' }).click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
});

test('transliteration fixtures and keyboard-operable character controls', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => { window.__printed = true; };
  });
  await page.goto('/tools/transliterate/');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByLabel('Output script mapping').locator('option')).toHaveCount(3);
  await expect(page.getByLabel('Output script mapping').locator('option[value="nko"], option[value="vai"]')).toHaveCount(0);
  await page.getByLabel('Latin input').fill('selam');
  await expect(page.locator('#output')).toHaveText('ሰላም');
  await page.getByLabel('Output script mapping').selectOption('tifinagh');
  await page.getByLabel('Latin input').fill('azul');
  await expect(page.locator('#output')).toHaveText('ⴰⵣⵓⵍ');
  await page.getByLabel('Output script mapping').selectOption('arabic');
  await page.getByLabel('Latin input').fill('bint');
  await expect(page.locator('#output')).toHaveText('بِنت');
  const insert = page.getByRole('button', { name: 'Insert Latin token sh for Arabic-letter mapping' });
  await insert.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Latin input')).toHaveValue('bintsh');
  await expect(page.getByText(/No reversible round trip is promised|never promised to round-trip/)).toBeVisible();
  const download = page.waitForEvent('download');
  await page.locator('#downloadTranslit').click();
  expect((await download).suggestedFilename()).toBe('afrotools-script-mapping.txt');
  await page.locator('#printTranslit').click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
});

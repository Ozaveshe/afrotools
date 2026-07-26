const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

test('Hausa gender choices, hooked letters, and script boundary stay local', async ({ page }) => {
  const cloudRequests = [];
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.route('**/api/translate', async (route) => {
    cloudRequests.push(route.request());
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/tools/hausa-translator/', { waitUntil: 'domcontentloaded' });

  const search = page.getByLabel('Search English or Hausa phrases');
  for (const fixture of [
    ['How are you?', 'Yaya kake? / Yaya kike?'],
    ['Money', 'Kuɗi'],
    ['Give me a discount', 'Ka / ki rage kaɗan'],
    ['I miss you', 'Ina kewarka / kewarki'],
    ['ATM / cash machine', 'Injin cire kuɗi / ATM'],
  ]) {
    await search.fill(fixture[0]);
    await expect(page.locator('#phrases')).toContainText(fixture[1]);
  }
  await search.fill('I may have malaria');
  await expect(page.locator('#phrases .verification-note')).toContainText('not a diagnosis');

  const guide = page.getByLabel('Boundary to inspect');
  for (const fixture of [
    ['address', 'kana / ka address a male'],
    ['name', 'sunanka asks a male'],
    ['letters', 'ɓ, ɗ, ƙ'],
    ['script', 'does not transliterate to Ajami'],
    ['region', 'Nigerian and Nigerien'],
  ]) {
    await guide.selectOption(fixture[0]);
    await expect(page.locator('#hausaUsageOutput')).toContainText(fixture[1]);
  }

  await page.locator('#translateInput').fill('Sirrin gwaji');
  await page.locator('#translateInput').press('Enter');
  expect(cloudRequests).toHaveLength(0);
  expect(consoleErrors).toEqual([]);
});

test('Hausa print surface produces a parser-readable local PDF', async ({ page }) => {
  await page.goto('/tools/hausa-translator/', { waitUntil: 'domcontentloaded' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(20000);
  const parsed = await pdfParse(pdf);
  expect(parsed.text).toContain('Hausa Translator & Phrasebook');
  expect(parsed.text).toContain('Coverage and orthography boundary');
});

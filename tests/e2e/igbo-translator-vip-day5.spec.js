const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

test('Igbo contrasts, dot-below vowels, and dialect boundary stay local', async ({ page }) => {
  const cloudRequests = [];
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.route('**/api/translate', async (route) => {
    cloudRequests.push(route.request());
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/tools/igbo-translator/', { waitUntil: 'domcontentloaded' });

  const search = page.getByLabel('Search English or Igbo phrases');
  for (const fixture of [
    ['I don\'t understand', 'Aghọtaghị m'],
    ['I understand', 'Aghọtara m'],
    ['Hospital', 'Ụlọ ọgwụ'],
    ['Pharmacy', 'Ụlọ ahịa ọgwụ'],
    ['Fever', 'Ahụ ọkụ'],
    ['I miss you', 'Agụụ gị na-agụ m'],
  ]) {
    await search.fill(fixture[0]);
    await expect(page.locator('#phrases')).toContainText(fixture[1]);
  }
  await search.fill('I may have malaria');
  await expect(page.locator('#phrases .verification-note')).toContainText('not a diagnosis');

  const guide = page.getByLabel('Choose a writing issue');
  for (const fixture of [
    ['vowels', 'a, e, i, ị, o, ọ, u, ụ'],
    ['harmony', 'two harmony sets'],
    ['tone', 'unmarked akwa'],
    ['dialect', 'Onitsha, Nsukka, Enuani, Ikwerre'],
  ]) {
    await guide.selectOption(fixture[0]);
    await expect(page.locator('#igboWritingResult')).toContainText(fixture[1]);
  }

  await page.locator('#translateInput').fill('Ihe nzuzo maka ule');
  await page.locator('#translateInput').press('Enter');
  expect(cloudRequests).toHaveLength(0);
  expect(consoleErrors).toEqual([]);
});

test('Igbo print surface produces a parser-readable local PDF', async ({ page }) => {
  await page.goto('/tools/igbo-translator/', { waitUntil: 'domcontentloaded' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(20000);
  const parsed = await pdfParse(pdf);
  expect(parsed.text).toContain('Igbo Draft Phrasebook');
  expect(parsed.text).toContain('Coverage, tone, and dialect boundary');
});

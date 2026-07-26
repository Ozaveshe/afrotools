const { test, expect } = require('@playwright/test');

test('Yoruba tone fixtures, ambiguity lab, and local-first boundary work together', async ({ page }) => {
  const cloudRequests = [];
  await page.route('**/api/translate', async (route) => {
    cloudRequests.push(route.request());
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/tools/yoruba-translator/', { waitUntil: 'domcontentloaded' });

  const search = page.getByLabel('Search English or Yoruba phrases');
  for (const fixture of [
    ['Good morning', 'Ẹ káàárọ̀'],
    ['Thank you', 'Ẹ ṣéun'],
    ['Church', 'Ilé ìjọsìn'],
    ['High blood pressure', 'Ẹ̀jẹ̀ ríru / ìfúnpá gíga'],
    ['Bank', 'Bánkì / ilé ìfowópamọ́'],
  ]) {
    await search.fill(fixture[0]);
    await expect(page.locator('#phrases')).toContainText(fixture[1]);
  }
  await search.fill('Money');
  await expect(page.locator('#phrases .verification-note')).toContainText('ọwọ́');

  const lab = page.getByLabel('Contrast to inspect');
  for (const fixture of [
    ['owo', 'owó = money'],
    ['oko', 'ọkọ̀ ayọ́kẹ́lẹ́'],
    ['ogun', 'òògùn = medicine'],
    ['ile', 'ilé = house'],
    ['honorific', 'ẹ / yín'],
  ]) {
    await lab.selectOption(fixture[0]);
    await expect(page.locator('#yorubaOrthographyOutput')).toContainText(fixture[1]);
  }

  await page.locator('#translateInput').fill('Àpẹẹrẹ ìkọ̀kọ̀');
  await page.locator('#translateInput').press('Enter');
  expect(cloudRequests).toHaveLength(0);
});

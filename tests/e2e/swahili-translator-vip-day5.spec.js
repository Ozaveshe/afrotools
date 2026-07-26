const { test, expect } = require('@playwright/test');

test('Swahili meaning distinctions and usage notes stay local and keyboard-usable', async ({ page }) => {
  const cloudRequests = [];
  await page.route('**/api/translate', async (route) => {
    cloudRequests.push(route.request());
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/tools/swahili-translator/', { waitUntil: 'domcontentloaded' });

  const search = page.getByLabel('Search English or Swahili phrases');
  for (const fixture of [
    ['I am fine', 'Niko vizuri'],
    ['Excuse me', 'Samahani'],
    ['Beach', 'Ufukwe'],
    ['ATM / cash machine', 'Mashine ya kutoa pesa'],
    ['Coffee beans', 'Buni'],
  ]) {
    await search.fill(fixture[0]);
    await expect(page.locator('#phrases')).toContainText(fixture[1]);
  }

  const checker = page.getByLabel('Meaning to check');
  await checker.focus();
  await checker.selectOption('fine');
  await expect(page.locator('#swahiliMeaningOutput')).toContainText('Niko vizuri');
  await checker.selectOption('sorry');
  await expect(page.locator('#swahiliMeaningOutput')).toContainText('Samahani');
  await checker.selectOption('place');
  await expect(page.locator('#swahiliMeaningOutput')).toContainText('Ufukwe');
  await checker.selectOption('coffee');
  await expect(page.locator('#swahiliMeaningOutput')).toContainText('buni');
  await checker.selectOption('this');
  await expect(page.locator('#swahiliMeaningOutput')).toContainText('noun class');

  await page.locator('#translateInput').fill('Unchanged Swahili fixture');
  await page.locator('#translateInput').press('Enter');
  expect(cloudRequests).toHaveLength(0);
});
